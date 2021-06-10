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

class CountriesLoader {
  /**
   * @param {Object} actionParameters parameter object contains the bearer and host details
   * @returns {loadingFunction}  -This loader loads each keys one by one, but if the 3rd party backend allows it,
   * it could also fetch all keys in one single request. In this case, the method
   *  must still return an Array of keys with the same order as the input.
   * @param {Array} [keys] is an Array of parameters.
   */
  constructor(actionParameters) {
    const cacheKeyFunction = key => JSON.stringify(key, null, 0);

    const loadingFunction = keys => {
      return Promise.resolve(
        keys.map(key => {
          console.debug(
            `--> Performing a get countries with 
              ${JSON.stringify(key, null, 0)}`
          );
          return this.__countries(actionParameters).catch(error => {
            console.error(
              `Failed loading countries ${JSON.stringify(
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

    this.loader = new DataLoader(keys => loadingFunction(keys), {
      cacheKeyFn: cacheKeyFunction,
    });
  }

  /**
   * method used to call the loadingFunction using dataloader
   * @param {*} input parameter contains the country details like two_letter_abbreviation, full_name_english details
   * @returns {Promise} a promise return countries  after resolved successfully other wise return the error.
   */
  load(key) {
    return this.loader.load(key);
  }
  /**
   * method used to call commerce GraphQL create customer endpoint to create new customer
   * @param {Object} parameter contains the country details like two_letter_abbreviation, full_name_english details
   * @param {Object} actionParameters parameter object contains the bearer and host details
   */
  __countries(actionParameters) {
    const {
      HB_API_BASE_PATH,
      HB_API_HOST,
      HB_PROTOCOL,
      HB_BASESITEID,
    } = actionParameters.context.settings;
    const uri = `${HB_PROTOCOL}://${HB_API_HOST}${HB_API_BASE_PATH}${HB_BASESITEID}/countries?fields=FULL`;
    return new Promise((resolve, reject) => {
      axios
        .get(uri, {
          params: {
            query: '',
          },
          headers: {},
        })
        .then(response => {
          if (response.data.countries) {
            resolve(response.data.countries);
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

/**
 * @type {CountriesLoader}
 */
module.exports = CountriesLoader;
