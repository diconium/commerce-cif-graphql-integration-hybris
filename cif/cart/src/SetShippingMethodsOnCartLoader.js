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

class setShippingMethodsOnCartLoader {
  /**
   * @param {Object} [actionParameters] Some optional parameters of the I/O Runtime action, like for example authentication info.
   * @returns {loadingFunction}  -This loader loads each cart one by one, but if the 3rd party backend allows it,
   * it could also fetch all carts in one single request. In this case, the method must still return an Array of
   * carts with the same order as the keys.
   * @param {Array} [input] is an Array of cart ids
   */
  constructor(actionParameters) {
    const loadingFunction = inputs => {
      return Promise.resolve(
        inputs.map(input => {
          console.debug(`--> Fetching cart with id ${JSON.stringify(input)}`);
          return this._setShippingMethod(input, actionParameters).catch(
            error => {
              console.error(
                `Failed loading cart ${JSON.stringify(
                  input
                )}, got error ${JSON.stringify(error, null, 0)}`
              );
              throw new Error(error.message);
            }
          );
        })
      );
    };

    this.loader = new DataLoader(keys => loadingFunction(keys));
  }

  /**
   * Loads the cart with the given input.
   * @param {*} input will have the cart input like cart id and shipping method
   * @returns {Promise} A Promise with the cart data.
   */
  load(input) {
    return this.loader.load(input);
  }

  /**
   * @param {String} params consist of cart id and shipping method array.
   * @param {Object} actionParameters Some parameters of the I/O action itself (e.g. backend server URL, authentication info, etc)
   * @returns {Promise} A Promise with the cart data.
   */
  _setShippingMethod(input, actionParameters) {
    const {
      customerId,
      bearer,
      HB_API_BASE_PATH,
      HB_API_HOST,
      HB_PROTOCOL,
      HB_BASESITEID,
    } = actionParameters.context.settings;

    const { cart_id, shipping_methods } = input;
    const url = `${HB_PROTOCOL}://${HB_API_HOST}${HB_API_BASE_PATH}${HB_BASESITEID}/users/${customerId}/carts/${cart_id}/deliverymode?deliveryModeId=${shipping_methods[0].carrier_code}&fields=DEFAULT`;
    const config = {
      headers: {
        Authorization: `Bearer ${bearer}`,
      },
    };
    return new Promise((resolve, reject) => {
      axios
        .put(url, {}, config)
        .then(() => {
          resolve(true);
        })
        .catch(error => {
          reject(error);
        });
    });
  }
}

module.exports = setShippingMethodsOnCartLoader;
