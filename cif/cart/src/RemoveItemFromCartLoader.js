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

class RemoveItemFromCartLoader {
  /**
   * @param {Object} [actionParameters] Some optional parameters of the I/O Runtime action, like for example authentication info.
   */
  constructor(actionParameters) {
    let loadingFunction = cartInputs => {
      /**
       *This loader loads each cart one by one, but if the 3rd party backend allows it,
       *it could also fetch all carts in one single request. In this case, the method
       *must still return an Array of carts with the same order as the keys.
       */
      return Promise.resolve(
        cartInputs.map(cartInput => {
          console.debug(
            `--> Fetching cart with id ${JSON.stringify(cartInput)}`
          );
          return this._removeItemFromCart(cartInput, actionParameters).catch(
            error => {
              console.error(
                `Failed loading cart ${JSON.stringify(
                  cartInput
                )}, got error ${JSON.stringify(error, null, 0)}`
              );
              throw new Error(error);
            }
          );
        })
      );
    };

    this.loader = new DataLoader(keys => loadingFunction(keys));
  }

  /**
   * Loads the cart with the given cartId.
   * @param {*} cartInput will have the cart input like cart id and cart item id
   * @returns {Promise} A Promise with the cart data.
   */
  load(cartInput) {
    return this.loader.load(cartInput);
  }

  /**
   * @param {String} cartInput The cart id.
   * @param {Object} actionParameters Some parameters of the I/O action itself (e.g. backend server URL, authentication info, etc)
   * @param {Object} cartInput consist of input data like sku and quantity
   * @returns {Promise} A Promise with the cart data.
   */
  _removeItemFromCart(cartInput, actionParameters) {
    const {
      customerId,
      bearer,
      HB_API_BASE_PATH,
      HB_API_HOST,
      HB_PROTOCOL,
      HB_BASESITEID,
    } = actionParameters.context.settings;

    let { cart_id, cart_item_uid } = cartInput;
    const uri = `${HB_PROTOCOL}://${HB_API_HOST}${HB_API_BASE_PATH}${HB_BASESITEID}/users/${customerId}/carts/${cart_id}/entries/${cart_item_uid}?fields=DEFAULT`;
    return new Promise((resolve, reject) => {
      axios
        .delete(uri, {
          params: {
            query: '',
          },
          headers: {
            Authorization: `Bearer ${bearer}`,
          },
        })
        .then(() => {
          resolve(true);
        })
        .catch(error => {
          reject(error);
        });
    });
  }
}

module.exports = RemoveItemFromCartLoader;
