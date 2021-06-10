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
const TokenUtils = require('../../common/TokenUtils.js');
const axios = require('axios');

class SetGuestEmailOnCartLoader {
  /**
   * @param {Object} parameters parameter object contains the cartId,shippingAddress,graphqlContext & actionParameters
   * @param {Object} parameters.guestEmail parameter contains the guest email
   * @param {Object} [parameters.actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info.
   * @returns {loadingFunction}  -This loader loads each cart one by one, but if the 3rd party backend allows it,
   * it could also fetch all carts in one single request. In this case, the method must still return an Array of
   * carts with the same order as the keys.
   * @param {Array} [cartIds] is an Array of cart ids
   */
  constructor(parameters) {
    this.guestEmail = parameters.guestEmail;
    this.actionParameters = parameters.actionParameters;
    const loadingFunction = cartIds => {
      return Promise.resolve(
        cartIds.map(cartId => {
          return this._setGuestEmailOnCart(
            cartId,
            this.guestEmail,
            this.actionParameters
          ).catch(error => {
            throw new Error(error.message);
          });
        })
      );
    };
    this.loader = new DataLoader(keys => loadingFunction(keys));
  }

  /**
   * method used to call the loadingFunction using dataloader
   * @param {*} cartId parameter cartId
   * @returns {Promise} a promise return empty array after promise resolved successfully, other wise return the error.
   */
  load(cartId) {
    return this.loader.load(cartId);
  }

  /**
   * @param {Object} cartId parameter contains the cart Id
   * @param {Object} guestEmail parameter contains the guest email
   * @param {Object} [actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info.
   * @returns {Promise} a promise the status true if promise resolves successfuly.
   */
  _setGuestEmailOnCart(cartId, guestEmail, actionParameters) {
    const { bearer } = actionParameters.context.settings;

    if (bearer) {
      return this._execute(actionParameters, cartId, guestEmail, bearer);
    }

    return TokenUtils.getOAuthClientBearer(actionParameters).then(bearerToken =>
      this._execute(actionParameters, cartId, guestEmail, bearerToken)
    );
  }

  _execute(actionParameters, cartId, guestEmail, bearer) {
    const {
      customerId,
      HB_API_BASE_PATH,
      HB_API_HOST,
      HB_PROTOCOL,
      HB_BASESITEID,
    } = actionParameters.context.settings;
    const uri = `${HB_PROTOCOL}://${HB_API_HOST}${HB_API_BASE_PATH}${HB_BASESITEID}/users/${customerId}/carts/${cartId}/email?email=${guestEmail}&fields=DEFAULT`;
    const config = {
      headers: {
        Authorization: `Bearer ${bearer}`,
      },
    };

    return new Promise((resolve, reject) => {
      axios
        .put(uri, {}, config)
        .then(() => {
          resolve(guestEmail);
        })
        .catch(error => {
          reject(error);
        });
    });
  }
}

module.exports = SetGuestEmailOnCartLoader;
