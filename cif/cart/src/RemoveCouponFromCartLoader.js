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
class RemoveCouponFromCartLoader {
  /**
   * @param {Object} [actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info.
   * @returns {loadingFunction}  -This loader loads each cart one by one, but if the 3rd party backend allows it,
   * it could also fetch all carts in one single request. In this case, the method must still return an Array of
   * carts with the same order as the keys.
   * @param {Array} [cartIds] is an Array of cart ids.
   */

  constructor(actionParameters) {
    this.vouchersList = actionParameters.vouchersList;
    this.actionParameters = actionParameters.actionParameters;

    const loadingFunction = cartIds => {
      return Promise.resolve(
        cartIds.map(cartId => {
          return this._removeCouponsFromCart(
            cartId,
            this.vouchersList,
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
   * @param {*} input parameter cartId and coupon code to remove
   * @returns {Promise} a promise return null after resolved successfully other wise return the error.
   */
  load(cartId) {
    return this.loader.load(cartId);
  }

  /**
   * @param {String}  parameter contains cartId details and
   * @param {Object} parameter contains the list of voucher codes to remove
   * @param {Object} [actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info.
   * @returns {Promise} a promise return null if resolves successfully else return error.
   */
  _removeCouponsFromCart(cartId, vouchersList, actionParameters) {
    const {
      customerId,
      bearer,
      HB_API_BASE_PATH,
      HB_API_HOST,
      HB_PROTOCOL,
      HB_BASESITEID,
    } = actionParameters.context.settings;

    return new Promise((resolve, reject) => {
      vouchersList &&
        vouchersList.vouchers.map(({ code }) => {
          const uri = `${HB_PROTOCOL}://${HB_API_HOST}${HB_API_BASE_PATH}${HB_BASESITEID}/users/${customerId}/carts/${cartId}/vouchers/${code}?fields=FULL`;
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
    });
  }
}

module.exports = RemoveCouponFromCartLoader;
