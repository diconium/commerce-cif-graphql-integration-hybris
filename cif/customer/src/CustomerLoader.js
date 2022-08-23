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

class CustomerLoader {
  /**
   * @param {Object} actionParameters parameter object contains the bearer and host details
   * @returns {loadingFunction}  -This loader loads each keys one by one, but if the 3rd party backend allows it,
   * it could also fetch all keys in one single request. In this case, the method
   *  must still return an Array of keys with the same order as the input.
   * @param {Array} [keys] is an Array of parameters.
   */
  constructor(actionParameters) {
    const loadingFunction = keys => {
      return Promise.resolve(
        keys.map(key => {
          console.debug(`--> Fetching customer with id ${key}`);
          return this.getCustomer(actionParameters).catch(error => {
            console.error(
              `Failed loading customer ${key}, got error ${JSON.stringify(
                error,
                null,
                0
              )}`
            );
            return null;
          });
        })
      );
    };

    this.loader = new DataLoader(keys => loadingFunction(keys));
  }

  /**
   * method used to call the loadingFunction using dataloader
   * @param {*} input parameter contains the firstname,lastname
   * */
  load(keys) {
    return this.loader.load(keys);
  }

  /**
   * Method used to get customer details from hybris
   * @param {Object} actionParameters Some parameters of the I/O action itself (e.g. backend server URL, authentication info, etc)
   * @returns {Promise} a promise resolves and return customer details.
   */
  getCustomer(actionParameters) {
    const {
      customerId,
      bearer,
      HB_API_BASE_PATH,
      HB_API_HOST,
      HB_PROTOCOL,
      HB_BASESITEID,
    } = actionParameters.context.settings;
    const uri = `${HB_PROTOCOL}://${HB_API_HOST}${HB_API_BASE_PATH}${HB_BASESITEID}/users/${customerId}?fields=DEFAULT`;

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
module.exports = CustomerLoader;
