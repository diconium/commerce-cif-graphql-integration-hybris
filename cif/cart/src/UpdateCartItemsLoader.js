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

class UpdateCartItemsLoader {
  /**
   * @param {Object} parameters
   * @param {Object} [actionParameters] Some optional parameters of the I/O Runtime action, like for example authentication info.
   * @param {Object} input consist of cartId, cart_item_id and quantity
   * @returns {loadingFunction}  -This loader loads each cart one by one, but if the 3rd party backend allows it,
   * it could also fetch all carts in one single request. In this case, the method must still return an Array of
   * carts with the same order as the keys.
   * @param {Array} [input] is an Array of cart ids
   */
  constructor(actionParameters) {
    const loadingFunction = input => {
      return Promise.resolve(
        input.map(queryInput => {
          return this._updateMethod(queryInput, actionParameters).catch(
            error => {
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
   * @param {*} input will have the cart input like cartId, cart_item_id and quantity.
   * @returns {Promise} A Promise with the cart data.
   */
  load(input) {
    return this.loader.load(input);
  }

  /**
   * In a real 3rd-party integration, this method would query the 3rd-party system
   * in order to fetch a cart based on the cart id. This method returns a Promise,
   * for example to simulate some HTTP REST call being performed to the 3rd-party commerce system.
   * @param {String} queryInput consist of cart id, cart_item-id and quantity.
   * @param {Object} actionParameters Some parameters of the I/O action itself (e.g. backend server URL, authentication info, etc)
   * @returns {Promise} A Promise with the cart data.
   */
  _updateMethod(queryInput, actionParameters) {
    const {
      customerId,
      bearer,
      HB_API_BASE_PATH,
      HB_API_HOST,
      HB_PROTOCOL,
      HB_BASESITEID,
    } = actionParameters.context.settings;

    const { cart_id, cart_items } = queryInput;

    const cartItem = cart_items[0];
    const { cart_item_uid, quantity } = cartItem;
    const body = {
      quantity: quantity,
    };
    const config = {
      headers: {
        Authorization: `Bearer ${bearer}`,
      },
    };
    const uri = `${HB_PROTOCOL}://${HB_API_HOST}${HB_API_BASE_PATH}${HB_BASESITEID}/users/${customerId}/carts/${cart_id}/entries/${cart_item_uid}?fields=FULL`;
    return new Promise((resolve, reject) => {
      axios
        .patch(uri, body, config)
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

module.exports = UpdateCartItemsLoader;
