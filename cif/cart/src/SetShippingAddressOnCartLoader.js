/*******************************************************************************
 *
 *    Copyright 2019 Adobe. All rights reserved.
 *    This file is licensed to you under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License. You may obtain a copy
 *    of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software distributed under
 *    the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 *    OF ANY KIND, either express or implied. See the License for the specific language
 *    governing permissions and limitations under the License.
 *
 ******************************************************************************/

'use strict';

const DataLoader = require('dataloader');
const axios = require('axios');

class SetShippingAddressOnCartLoader {
  /**
   * @param {Object} parameters parameter object contains the cartId,shippingAddress,graphqlContext & actionParameters
   * @param {Object} parameters.shippingAddress parameter contains the shippingaddress details
   * @param {Object} [parameters.actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info.
   * @returns {loadingFunction}  -This loader loads each cart one by one, but if the 3rd party backend allows it,
   * it could also fetch all carts in one single request. In this case, the method must still return an Array of
   * carts with the same order as the keys.
   * @param {Array} [cartIds] is an Array of cart ids
   */
  constructor(parameters) {
    this.actionParameters = parameters.actionParameters;
    const loadingFunction = cartIds => {
      return Promise.resolve(
        cartIds.map(cartId => {
          return this._setShippingAddressOnCart(
            cartId,
            this.address,
            this.actionParameters
          ).catch(error => {
            throw new Error(JSON.stringify(error.message));
          });
        })
      );
    };
    this.loader = new DataLoader(keys => loadingFunction(keys));
  }

  /**
   * method used to call the loadingFunction using dataloader
   * @param {*} cartId parameter cartId
   * @returns {Promise} a promise return shippingAddress after resolved successfully other wise return the error.
   */
  load(cartId, address) {
    this.address = address;
    return this.loader.load(cartId);
  }

  /**
   * In a real 3rd-party integration, this method would query the 3rd-party system
   * in order to post shippingAddress details based on the cart id. This method returns a Promise,
   * for example to simulate some HTTP REST call being performed to the 3rd-party commerce system.
   * @param {Object} parameters.shippingAddress parameter contains the shippingaddress details
   * @param {Object} [parameters.actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info.
   * @returns {Promise} a promise with the shippingaddress data.
   */
  _setShippingAddressOnCart(cartId, address, actionParameters) {
    const {
      customerId,
      bearer,
      HB_API_BASE_PATH,
      HB_API_HOST,
      HB_PROTOCOL,
      HB_BASESITEID,
    } = actionParameters.context.settings;

    const body = address;
    const config = {
      headers: {
        Authorization: `Bearer ${bearer}`,
      },
    };
    const uri = `${HB_PROTOCOL}://${HB_API_HOST}${HB_API_BASE_PATH}${HB_BASESITEID}/users/${customerId}/carts/${cartId}/addresses/delivery?fields=DEFAULT&access_token=${bearer}`;
    return new Promise((resolve, reject) => {
      axios
        .post(uri, body, config)
        .then(response => {
          if (response.data) {
            resolve(response.data);
          } else {
            reject(false);
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }
}

module.exports = SetShippingAddressOnCartLoader;
