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

class ChangeCustomerPasswordLoader {
  /**
   * @param {Object} [actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info.
   */
  constructor(actionParameters) {
    // The loading function: "input" is an Array of parameters
    let loadingFunction = inputs => {
      return Promise.resolve(
        inputs.map(input => {
          // This loader loads each inputs one by one, but if the 3rd party backend allows it,
          // it could also fetch all inputs in one single request. In this case, the method
          // must still return an Array of inputs with the same order as the input.
          return this._generateCustomerToken(input, actionParameters).catch(
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
   * @param {*} input parameter input
   * @returns {Promise} a promise return access token after resolved successfully other wise return the error.
   */
  load(input) {
    return this.loader.load(input);
  }

  /**
   * method used to get the access token from hybris, it uses urlencoded body to fetch hybris data
   * In a real 3rd-party integration, this method would query the 3rd-party system
   * for example to simulate some HTTP REST call being performed to the 3rd-party commerce system.
   * @param {Object} input  parameter contains like email, password
   * @param {Object} actionParameters Some parameters of the I/O action itself (e.g. backend server URL, authentication info, etc)
   * @returns {Promise} return access token if promise resolves successfully otherwise return error
   */
  _generateCustomerToken(input, actionParameters) {
    const {
      customerId,
      bearer,
      HB_API_BASE_PATH,
      HB_API_HOST,
      HB_PROTOCOL,
      HB_BASESITEID,
    } = actionParameters.context.settings;
    let { currentPassword, newPassword } = input.params;
    let body = {};
    const config = {
      headers: {
        Authorization: `Bearer ${bearer}`,
      },
    };
    let uri = `${HB_PROTOCOL}://${HB_API_HOST}${HB_API_BASE_PATH}${HB_BASESITEID}/users/${customerId}/password?new=${newPassword}&old=${currentPassword}`;

    return new Promise((resolve, reject) => {
      axios
        .put(uri, body, config)
        .then(() => {
          resolve(true);
        })
        .catch(error => {
          reject(error);
        });
    });
  }
}

module.exports = ChangeCustomerPasswordLoader;
