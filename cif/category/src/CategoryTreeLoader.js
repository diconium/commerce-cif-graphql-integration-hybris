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

class CategoryTreeLoader {
  /**
   * @param {Object} [actionParameters] Some optional parameters of the I/O Runtime action, like for example authentication info.
   */
  constructor(actionParameters) {
    /** The loading function: "categoryIds" is an Array of category ids */
    let loadingFunction = categoryIds => {
      /**
       *This loader loads each category one by one, but if the 3rd party backend allows it,
       *it could also fetch all category in one single request. In this case, the method
       *must still return an Array of category with the same order as the keys.
       */
      return Promise.resolve(
        categoryIds.map(categoryId => {
          console.debug(`--> Fetching category with id ${categoryId}`);
          return this.__getCategoryById(categoryId, actionParameters).catch(
            error => {
              console.error(
                `Failed loading category ${categoryId}, got error ${JSON.stringify(
                  error,
                  null,
                  0
                )}`
              );
              return null;
            }
          );
        })
      );
    };

    this.loader = new DataLoader(keys => loadingFunction(keys));
  }

  /**
   * Loads the category with the given categoryId.
   *
   * @param {*} categoryId
   * @returns {Promise} A Promise with the category data.
   */
  load(categoryId) {
    return this.loader.load(categoryId);
  }

  prime(key, value) {
    return this.loader.prime(key, value);
  }

  /**
   * @param {String} categoryId The category id.
   * @param {String} actionParameters contain the context
   * @returns {Promise} A Promise with the category data.
   */
  __getCategoryById(categoryId, actionParameters) {
    const {
      HB_API_BASE_PATH,
      HB_API_HOST,
      HB_PROTOCOL,
      HB_BASESITEID,
    } = actionParameters.context.settings;

    let apiHost = `${HB_PROTOCOL}://${HB_API_HOST}${HB_API_BASE_PATH}${HB_BASESITEID}/catalogs/electronicsProductCatalog/Online/categories/${categoryId}?fields=FULL`;
    let config = {
      params: {
        json: true,
      },
    };
    return axios
      .get(apiHost, config)
      .then(response => {
        return response.data;
      })
      .catch(error => {
        return error;
      });
  }
}

module.exports = CategoryTreeLoader;
