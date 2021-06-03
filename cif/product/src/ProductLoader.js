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

class ProductLoader {
  /**
   * @param {Object} [actionParameters] Some optional parameters of the I/O Runtime action, like for example authentication info.
   */
  constructor(actionParameters) {
    /**The loading function: "productSkus" is an Array of product skus */
    let loadingFunction = productSkus => {
      /**
       *This loader loads each product one by one, but if the 3rd party backend allows it,
       *it could also fetch all products in one single request. In this case, the method
       *must still return an Array of products with the same order as the keys.
       */
      return Promise.resolve(
        productSkus.map(productSku => {
          console.debug(`--> Fetching product with sku ${productSku}`);
          return this.__getProductBySku(productSku, actionParameters).catch(
            error => {
              console.error(
                `Failed loading product ${productSku}, got error ${JSON.stringify(
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
   * Loads the product with the given product sku.
   *
   * @param {*} productSku
   * @returns {Promise} A Promise with the product data.
   */
  loadMany(productSku) {
    return this.loader.loadMany(productSku);
  }

  /**
   * In a real 3rd-party integration, this method would query the 3rd-party system
   * in order to fetch a product based on the product sku. This method returns a Promise,
   * for example to simulate some HTTP REST call being performed to the 3rd-party commerce system.
   *
   * @param {String} productSku The product sku.
   * @param {Object} actionParameters Some parameters of the I/O action itself (e.g. backend server URL, authentication info, etc)
   * @returns {Promise} A Promise with the product data.
   */
  __getProductBySku(productSku, actionParameters) {
    const {
      HB_API_BASE_PATH,
      HB_API_HOST,
      HB_PROTOCOL,
      HB_BASESITEID,
    } = actionParameters.context.settings;

    let apiHost = `${HB_PROTOCOL}://${HB_API_HOST}${HB_API_BASE_PATH}${HB_BASESITEID}/products/${productSku}?fields=FULL`;
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
      .catch(() => ({
        products: [],
        pagination: {
          totalResults: 0,
          currentPage: 1,
          pageSize: 20,
          totalPages: 0,
        },
      }));
  }
}

module.exports = ProductLoader;
