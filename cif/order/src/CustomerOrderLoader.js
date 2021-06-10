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

class CustomerOrderLoader {
  /**
   * @param {Object} parameters parameter object contains the graphqlContext & actionParameters
   * @param {Object} [parameters.actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info.
   * @returns {loadingFunction}  - This loader loads each keys one by one, but if the 3rd party backend allows it,
   * it could also fetch all keys in one single request. In this case, the method
   * must still return an Array of keys with the same order as the input.
   * @param {Array} [keys] is an Array of parameters.
   */
  constructor(actionParameters) {
    /** The loading function: "cartIds" is an Array of cart ids */
    let loadingFunction = keys => {
      return Promise.resolve(
        keys.map(key => {
          console.debug(
            '--> Performing a get customer orders with ' +
              JSON.stringify(key, null, 0)
          );
          return this._customerOrder(actionParameters).catch(error => {
            console.error(
              `Failed loading Customer Orders ${JSON.stringify(
                key,
                null,
                0
              )}, got error ${JSON.stringify(error, null, 0)}`
            );
            return null;
          });
        })
      );
    };
    this.loader = new DataLoader(keys => loadingFunction(keys));
  }

  /**
   * method used to call load method from custom loader class
   */
  load(keys) {
    return this.loader.load(keys);
  }

  /**
   * @param {Object} [actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info.
   * @returns {Promise} a promise with the order data.
   */
  _customerOrder(actionParameters) {
    const {
      customerId,
      bearer,
      HB_API_BASE_PATH,
      HB_API_HOST,
      HB_PROTOCOL,
      HB_BASESITEID,
    } = actionParameters.context.settings;
    const config = {
      headers: {
        Authorization: `Bearer ${bearer}`,
      },
    };
    const uri = `${HB_PROTOCOL}://${HB_API_HOST}${HB_API_BASE_PATH}${HB_BASESITEID}/users/${customerId}/orders?fields=DEFAULT&access_token=${bearer}`;
    return new Promise((resolve, reject) => {
      axios
        .get(uri, config)
        .then(response => {
          if (!response.data.errors) {
            resolve(response.data);
          } else {
            reject(response);
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }
}

module.exports = CustomerOrderLoader;
