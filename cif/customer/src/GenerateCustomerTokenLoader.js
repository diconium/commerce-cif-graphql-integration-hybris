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

class GenerateCustomerTokenLoader {
  /**
   * @param {Object} [actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info.
   * @returns {loadingFunction}  - This loader loads each inputs one by one, but if the 3rd party backend allows it,
   * it could also fetch all inputs in one single request. In this case, the method
   * must still return an Array of inputs with the same order as the input.
   * @param {Array} [inputs] is an Array of parameters.
   */
  constructor(actionParameters) {
    const loadingFunction = inputs => {
      return Promise.resolve(
        inputs.map(input => {
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
    const { email, password } = input.graphqlContext;

    const {
      HB_API_HOST,
      HB_PROTOCOL,
      HB_OAUTH_PATH,
      HB_CLIENTID,
      HB_CLIENTSECRET,
    } = actionParameters.context.settings;

    const body = {
      grant_type: 'password',
      username: email,
      password: password,
      client_secret: HB_CLIENTSECRET,
      client_id: HB_CLIENTID,
    };

    const searchParams = Object.keys(body)
      .map(key => {
        return `${encodeURIComponent(key)}=${encodeURIComponent(body[key])}`;
      })
      .join('&');

    const config = {
      headers: {
        'Content-type': 'application/x-www-form-urlencoded',
      },
    };
    return new Promise((resolve, reject) => {
      axios
        .post(
          `${HB_PROTOCOL}://${HB_API_HOST}${HB_OAUTH_PATH}?operationType=oAuth`,
          searchParams,
          config
        )
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

module.exports = GenerateCustomerTokenLoader;
