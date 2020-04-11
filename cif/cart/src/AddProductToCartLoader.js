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
const rp = require('request-promise');

class AddProductToCartResolverLoader {
  /**
   * @param {Object} actionParameters parameter object contains the cartId, Items to be added,graphqlContext & actionParameters
   * @param {Object} [actionParameters.actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info.
   */
  constructor(actionParameters) {
    this.actionParameters = actionParameters;
    let loadingFunction = inputs => {
      return Promise.resolve(
        inputs.map(input => {
          console.debug(`--> Fetching cart with id ${JSON.stringify(input)}`);
          return this._addProductToCart(input, this.actionParameters).catch(
            error => {
              console.error(
                `Failed loading cart ${JSON.stringify(
                  input
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
   * method used to call the loadingFunction using dataloader
   * @param {*} input parameter contains the cart id and the cart items
   * @returns {Promise} a promise return cart Id after resolved successfully other wise return the error.
   */
  load(input) {
    return this.loader.load(input);
  }

  /**
   * @param {String} input consists of cart id and cart items to which the item to added.
   * @param {Object} actionParameters Some parameters of the I/O action itself (e.g. backend server URL, authentication info, etc)
   * @returns {Promise} a promise with the Item to be added data.
   */
  _addProductToCart(input, actionParameters) {
    const {
      customerId,
      bearer,
      HB_API_BASE_PATH,
      HB_API_HOST,
      HB_PROTOCOL,
      HB_BASESITEID,
    } = actionParameters.context.settings;

    const { cart_id, cart_items } = input;
    const { data } = cart_items[0];

    let body = {
      product: {
        code: data.sku,
      },
      quantity: data.quantity,
    };

    const uri = `${HB_PROTOCOL}://${HB_API_HOST}${HB_API_BASE_PATH}${HB_BASESITEID}/users/${customerId}/carts/${cart_id}/entries?fields=DEFAULT&access_token=${bearer}`;
    return new Promise((resolve, reject) => {
      return rp({
        method: 'POST',
        uri: uri,
        body: body,
        json: true,
      })
        .then(response => resolve(response))
        .catch(err => {
          reject(err.error.errors[0].message);
        });
    });
  }
}

module.exports = AddProductToCartResolverLoader;
