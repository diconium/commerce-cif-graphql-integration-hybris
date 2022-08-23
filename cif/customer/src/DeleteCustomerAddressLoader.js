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

class DeleteCustomerAddressLoader {
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
          return this._deleteCustomerAddress(key, actionParameters).catch(
            error => {
              console.error(
                `Failed loading cart ${key}, got error ${JSON.stringify(
                  error.message,
                  null,
                  0
                )}`
              );
              throw new Error(JSON.stringify(error.message));
            }
          );
        })
      );
    };
    this.loader = new DataLoader(keys => loadingFunction(keys));
  }

  /**
   * method used to call the loadingFunction using dataloader.
   * @param {*} key parameter contains id of customer address which is to be deleted.
   * @returns {Promise} a promise return deleted customer address details after resolved successfully other wise return the error.
   */
  load(key) {
    return this.loader.load(key);
  }

  /**
   * method used to call hybris delete customer address endpoint to delete customer address.
   * @param {Object} key parameter contains id of customer address which is to be deleted.
   * @param {Object} actionParameters contains the product details and host details.
   * @returns {Promise} a promise resolves and return deletes customer address
   */
  _deleteCustomerAddress(key, actionParameters) {
    const {
      HB_API_BASE_PATH,
      bearer,
      customerId,
      HB_API_HOST,
      HB_PROTOCOL,
      HB_BASESITEID,
    } = actionParameters.context.settings;
    let addressId = key;

    const uri = `${HB_PROTOCOL}://${HB_API_HOST}${HB_API_BASE_PATH}${HB_BASESITEID}/users/${customerId}/addresses/${addressId}`;

    const config = {
      headers: {
        Authorization: `Bearer ${bearer}`,
      },
    };
    const payload = { config, uri };

    return new Promise((resolve, reject) => {
      axios
        .delete(uri, config)
        .then(response => {
          if (response) {
            resolve(response);
          } else {
            reject(false);
          }
        })
        .catch(error => {
          reject(error);
          reject(payload);
        });
    });
  }
}

module.exports = DeleteCustomerAddressLoader;
