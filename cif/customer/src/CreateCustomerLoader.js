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
const TokenUtils = require('../../common/TokenUtils.js');

class CreateCustomerLoader {
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
          return this._createCustomer(key, actionParameters).catch(error => {
            console.error(
              `Failed loading cart ${key}, got error ${JSON.stringify(
                error,
                null,
                0
              )}`
            );
            throw new Error(error.message);
          });
        })
      );
    };
    this.loader = new DataLoader(keys => loadingFunction(keys));
  }

  /**
   * method used to call the loadingFunction using dataloader
   * @param {*} input parameter contains the customer details like firstname, lastname, email,  password details
   * @returns {Promise} a promise return cart Id after resolved successfully other wise return the error.
   */
  load(key) {
    return this.loader.load(key);
  }

  /**
   * method used to call commerce GraphQL create customer endpoint to create new customer
   * @param {Object} parameter contains the customer details like firstname, lastname, email,  password details
   * @param {Object} actionParameters contains the product details and host details
   * @returns {Promise} a promise resolves and return newely created customer.
   */
  _createCustomer(key, actionParameters) {
    const { bearer } = actionParameters.context.settings;

    if (bearer) {
      return this._execute(key, actionParameters, bearer);
    }

    return TokenUtils.getOAuthClientBearer(actionParameters).then(bearerToken =>
      this._execute(key, actionParameters, bearerToken)
    );
  }
  _execute(key, actionParameters, bearer) {
    const {
      HB_API_BASE_PATH,
      HB_API_HOST,
      HB_PROTOCOL,
      HB_BASESITEID,
    } = actionParameters.context.settings;

    const body = {
      firstName: key.firstname,
      lastName: key.lastname,
      password: key.password,
      titleCode: '',
      uid: key.email,
    };

    const uri = `${HB_PROTOCOL}://${HB_API_HOST}${HB_API_BASE_PATH}${HB_BASESITEID}/users?fields=DEFAULT`;
    const config = {
      headers: {
        Authorization: `Bearer ${bearer}`,
      },
    };
    return new Promise((resolve, reject) => {
      axios
        .post(uri, body, config)
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

module.exports = CreateCustomerLoader;
