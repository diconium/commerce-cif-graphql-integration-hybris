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
class VouchersListLoader {
  /**
   * @param {Object} [actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info
   * @returns {loadingFunction}  -This loader loads each cart one by one, but if the 3rd party backend allows it,
   * it could also fetch all carts in one single request. In this case, the method must still return an Array of
   * carts with the same order as the keys.
   * @param {Array} [cartIds] is an Array of cart ids
   */
  constructor(actionParameters) {
    const loadingFunction = cartIds => {
      return Promise.resolve(
        cartIds.map(cartId => {
          return this._getVouchersList(cartId, actionParameters).catch(
            error => {
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
   * @param {*} cartId parameter cartId for which we are fetching carts
   * @returns {Promise} a promise return null after resolved successfully other wise return the error.
   */
  load(cartId) {
    return this.loader.load(cartId);
  }

  /**
   * @param {Object} cartId parameter contains cartId
   * @param {Object} [actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info.
   * @returns {Promise} a promise return null if resolves successfully else return error.
   */
  _getVouchersList(cartId, actionParameters) {
    const {
      customerId,
      bearer,
      HB_API_BASE_PATH,
      HB_API_HOST,
      HB_PROTOCOL,
      HB_BASESITEID,
    } = actionParameters.context.settings;
    const uri = `${HB_PROTOCOL}://${HB_API_HOST}${HB_API_BASE_PATH}${HB_BASESITEID}/users/${customerId}/carts/${cartId}/vouchers?fields=DEFAULT`;

    return new Promise((resolve, reject) => {
      axios
        .get(uri, {
          params: {
            query: '',
          },
          headers: {
            Authorization: `Bearer ${bearer}`,
          },
        })
        .then(response => {
          response.data.vouchers.length > 0
            ? resolve(response.data)
            : reject(response);
        })
        .catch(error => {
          reject(error);
        });
    });
  }
}

module.exports = VouchersListLoader;
