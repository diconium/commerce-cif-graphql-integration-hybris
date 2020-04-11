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

class ApplyCouponToCartLoader {
  /**
   * @param {Object} [actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info.
   */
  constructor(actionParameters) {
    // The loading function: "cartIds" is an Array of cart ids
    let loadingFunction = inputs => {
      return Promise.resolve(
        inputs.map(input => {
          console.debug(`--> Fetching cart with id ${JSON.stringify(input)}`);
          return this._applyCouponToCart(input, actionParameters).catch(
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
   * method used to call the loadingFunction using dataloader
   * @param {*} input parameter cartId
   * @returns {Promise} a promise return null after resolved successfully other wise return the error.
   */
  load(input) {
    return this.loader.load(input);
  }

  /**
   * In a real 3rd-party integration, this method would query the 3rd-party system
   * method used to post applyCouponToCart details based on the Cart Id and coupon Code.
   * for example to simulate some HTTP REST call being performed to the 3rd-party commerce system.
   * @param {Object} input parameter contains the couponCode details and the cart id
   * @param {Object} [actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info.
   * @returns {Promise} a promise return null if resolves successfully else return error.
   */
  _applyCouponToCart(input, actionParameters) {
    const {
      customerId,
      bearer,
      HB_API_BASE_PATH,
      HB_API_HOST,
      HB_PROTOCOL,
      HB_BASESITEID,
    } = actionParameters.context.settings;

    const { cart_id, coupon_code } = input;

    return rp({
      method: 'POST',
      uri: `${HB_PROTOCOL}://${HB_API_HOST}${HB_API_BASE_PATH}${HB_BASESITEID}/users/${customerId}/carts/${cart_id}/vouchers?voucherId=${coupon_code}&access_token=${bearer}`,
      resolveWithFullResponse: true,
      json: true,
    })
      .then(() => {})
      .catch(err => {
        throw new Error(err.error.errors[0].message);
      });
  }
}

module.exports = ApplyCouponToCartLoader;
