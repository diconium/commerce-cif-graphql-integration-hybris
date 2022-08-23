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

class ProductsLoader {
  /**
   * @param {Object} [actionParameters] Some optional parameters of the I/O Runtime action, like for example authentication info.
   * @returns {loadingFunction}  - This loader loads each product one by one, but if the 3rd party backend allows it,
   * it could also fetch all products in one single request. In this case, the method
   * must still return an Array of products with the same order as the keys.
   * @param {Object} [key]   the "key" is actually an object with search parameters.
   * @param {Array} [keys]  is array of parameters.
   * cacheKeyFunction is a custom function to generate custom cache keys, simply serializing the key
   */
  constructor(actionParameters) {
    const cacheKeyFunction = key => JSON.stringify(key, null, 0);

    const loadingFunction = keys => {
      return Promise.resolve(
        keys.map(key => {
          console.debug(
            `--> Performing a search with ${JSON.stringify(key, null, 0)}`
          );
          return this.__searchProducts(key, actionParameters).catch(error => {
            console.error(
              `Failed loading products for search ${JSON.stringify(
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

  load(key) {
    return this.loader.load(key);
  }

  /**
   * In a real 3rd-party integration, this method would query the 3rd-party system to search
   * products based on the search parameters. Note that to demonstrate how one can customize the arguments
   * of a field, the "sort" argument of the "products" field has been removed from the schema
   * in the main dispatcher action.
   *
   * @param {Object} params An object with the search parameters defined by the Magento GraphQL "products" field.
   * @param {String} [params.search] The "search" argument of the GraphQL "products" field.
   * @param {String} [params.filter] The "filter" argument of the GraphQL "products" field.
   * @param {String} [params.categoryId] An optional category id, to get all the products of a given category.
   * @param {Integer} params.currentPage The "currentPage" argument of the GraphQL "products" field.
   * @param {Integer} params.pageSize The "pageSize" argument of the GraphQL "products" field.
   * @param {Object} actionParameters Some parameters of the I/O action itself (e.g. backend server URL, authentication info, etc)
   * @returns {Promise} A Promise with the products data.
   */
  __searchProducts(params, actionParameters) {
    const {
      HB_API_BASE_PATH,
      HB_API_HOST,
      HB_PROTOCOL,
      HB_BASESITEID,
    } = actionParameters.context.settings;

    const config = {
      params: {
        json: true,
      },
    };

    /** Get a CategoryId by URL or Parameters */
    let categoryId =
      params.filters && params.filters.parent_category_uid
        ? params.filters.parent_category_uid.eq
        : params.filters && params.filters.category_uid
        ? params.filters.category_uid.eq
        : params.filter && params.filter.category_uid
        ? params.filter.category_uid.eq
        : params.categoryId
        ? params.categoryId
        : '';
    // check whether filter object value is empty or not
    if (params.filter && Object.keys(params.filter).length === 0) {
      const apiHost = `${HB_PROTOCOL}://${HB_API_HOST}${HB_API_BASE_PATH}${HB_BASESITEID}/products/search?fields=FULL`;
      return axios
        .get(apiHost, config)
        .then(response => {
          response.data.products = response.data.products.filter(
            product => !isNaN(parseInt(product.code))
          ); // Removing Product if code contains alphabets
          return response.data;
        })
        .catch(error => {
          return error;
        });
    } else if (params.search || categoryId !== '') {
      /** Get a products by category id or search value */

      /** Creating query and sort params for Hybris Api*/
      const query = `&query=${params.search ? params.search : `${categoryId}`}`;
      let sort = '';

      if (params.sort) {
        const sortKey = Object.keys(params.sort)[0];
        const sortValue = Object.values(params.sort)[0]
          .toString()
          .toLowerCase(); // Converting value from enum DESC to desc
        sort = `&sort=${sortKey}-${sortValue}`;
      }

      const apiHost = `${HB_PROTOCOL}://${HB_API_HOST}${HB_API_BASE_PATH}${HB_BASESITEID}/products/search?currentPage=${params.currentPage}&fields=FULL&pageSize=${params.pageSize}${query}${sort}`;

      return axios
        .get(apiHost, config)
        .then(response => {
          response.data.products = response.data.products.filter(
            product => !isNaN(parseInt(product.code))
          ); // Removing Product if code contains alphabets
          return response.data;
        })
        .catch(error => {
          return error;
        });
    } else if (params.filter && (params.filter.url_key || params.filter.sku)) {
      const productCode =
        params.filter.sku !== undefined
          ? params.filter.sku.eq
          : params.filter.url_key.eq;
      /** Get a product by sku */
      if (productCode) {
        const apiHost = `${HB_PROTOCOL}://${HB_API_HOST}${HB_API_BASE_PATH}${HB_BASESITEID}/products/${productCode}?fields=FULL`;
        return axios
          .get(apiHost, config)
          .then(response => ({
            products: [response.data],
            pagination: {
              totalResults: 1,
              currentPage: params.currentPage,
              pageSize: params.pageSize,
              totalPages: 1,
            },
          }))
          .catch(() => ({
            products: [],
            pagination: {
              totalResults: 0,
              currentPage: params.currentPage,
              pageSize: params.pageSize,
              totalPages: 0,
            },
          }));
      } else {
        return {
          products: [],
          pagination: {
            totalResults: 0,
            currentPage: params.currentPage,
            pageSize: params.pageSize,
            totalPages: 0,
          },
        };
      }
    }
  }
}

module.exports = ProductsLoader;
