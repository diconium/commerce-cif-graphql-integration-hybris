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

const ProductsLoader = require('../product/src/ProductsLoader.js');
const ProductLoader = require('../product/src/ProductLoader.js');
const CategoryTreeLoader = require('../category/src/CategoryTreeLoader.js');
const LoaderProxy = require('./LoaderProxy.js');
const Options = require('./Options.js');
// This module contains 3 classes because they have cross/cyclic dependencies to each other
// and it's not possible to have them in separate files because this is not supported by Javascript

class CategoryTree {
  /**
   * @param {Object} parameters
   * @param {String} parameters.categoryId The category id.
   * @param {Object} [parameters.graphqlContext] The optional GraphQL execution context passed to the resolver.
   * @param {Object} [parameters.actionParameters] Some optional parameters of the I/O Runtime action, like for example authentication info.
   * @param {CategoryTreeLoader} [parameters.categoryTreeLoader] An optional CategoryTreeLoader, to optimise caching.
   * @param {ProductsLoader} [parameters.productsLoader] An optional ProductsLoader, to optimise caching.
   * LoaderProxy class returns a Proxy to avoid having to implement a getter for all properties.
   */
  constructor(parameters) {
    /* cateId to get CategoryId from url */
    let cateId =
      parameters.categoryId.url_key !== undefined
        ? parameters.categoryId.url_key.eq
        : '';
    if (cateId !== '') {
      cateId = cateId.split('/');
      cateId = cateId[cateId.length - 1];
    }
    if (parameters.categoryId.category_uid !== undefined) {
      if (parameters.categoryId.category_uid.eq)
        this.categoryId = parameters.categoryId.category_uid.eq;
      else if (parameters.categoryId.category_uid.in) {
        this.categoryId = parameters.categoryId.category_uid.in.toString();
      }
    } else if (parameters.categoryId.url_key !== undefined) {
      this.categoryId = cateId;
    } else if (parameters.categoryId.parent_category_uid !== undefined) {
      this.categoryId = parameters.categoryId.parent_category_uid.eq;
    } else {
      this.categoryId = parameters.categoryId;
    }

    this.urlName = parameters.urlName || null;
    this.graphqlContext = parameters.graphqlContext;
    this.actionParameters = parameters.actionParameters;
    this.categoryTreeLoader =
      parameters.categoryTreeLoader ||
      new CategoryTreeLoader(parameters.actionParameters);
    this.productsLoader =
      parameters.productsLoader ||
      new ProductsLoader(parameters.actionParameters);

    return new LoaderProxy(this);
  }

  /**
   * Calls the category loader by category id
   * @returns {Promise}
   * @private
   */
  __load() {
    console.debug(`Loading category for ${this.categoryId}`);
    return this.categoryTreeLoader.load(this.categoryId);
  }

  /**
   * Converts some category data from the 3rd-party commerce system into the Magento GraphQL format.
   * Properties that require some extra data fetching with the 3rd-party system must have dedicated getters
   * in this class.
   *
   * @param {Object} data
   * @returns {Object} The backend category data converted into a GraphQL "CategoryTree" data.
   */
  __convertData(data) {
    if (!this.urlName && this.urlName === null) {
      this.urlName = data.id;
    }
    let urlKey = data.name;
    urlKey = urlKey
      .toLowerCase()
      .split('&')
      .join('-')
      .split(' ')
      .join('-');
    return {
      id: data.id,
      uid: data.id,
      name: data.name,
      description: data.url,
      url_key: urlKey,
      url_path: this.urlName === null ? null : this.urlName,
      updated_at: data.lastModified,
      position: 0,
      staged: true,
      page_info: {
        total_pages: 1,
      },
      total_count: 1,
    };
  }

  /**
   * get Category type
   * @returns {string}
   * @private
   */
  get __typename() {
    return 'CategoryTree';
  }

  /**
   * Get children categories data
   * @returns {Promise<T>}
   */
  get children() {
    return this.__load()
      .then(data => {
        if (!data.subcategories || data.subcategories.length === 0) {
          return [];
        }
        return data.subcategories.map(category => {
          this.categoryTreeLoader.prime(category.id, category);
          return new CategoryTree({
            categoryId: category.id,
            urlName:
              (this.urlName !== null ? `${this.urlName}/` : '') + category.id,
            graphqlContext: this.graphqlContext,
            actionParameters: this.actionParameters,
            categoryTreeLoader: this.categoryTreeLoader,
            productsLoader: this.productsLoader,
          });
        });
      })
      .catch(errorOutput => Promise.reject(errorOutput));
  }
  get items() {
    return this.__load()
      .then(data => {
        if (data.subcategories.length)
          return data.subcategories.map(category => {
            this.categoryTreeLoader.prime(category.id, category);
            return new CategoryTree({
              categoryId: category.id,
              urlName:
                (this.urlName !== null ? `${this.urlName}/` : '') + category.id,
              graphqlContext: this.graphqlContext,
              actionParameters: this.actionParameters,
              categoryTreeLoader: this.categoryTreeLoader,
              productsLoader: this.productsLoader,
            });
          });
        else if (data.id) {
          this.categoryTreeLoader.prime(data.id, data);
          return [
            new CategoryTree({
              categoryId: data.id,
              urlName:
                (this.urlName !== null ? `${this.urlName}/` : '') + data.id,
              graphqlContext: this.graphqlContext,
              actionParameters: this.actionParameters,
              categoryTreeLoader: this.categoryTreeLoader,
              productsLoader: this.productsLoader,
            }),
          ];
        } else if (!data.subcategories || data.subcategories.length === 0) {
          return [];
        }
      })
      .catch(errorOutput => Promise.reject(errorOutput));
  }
  /**
   * Get children category count
   * @returns {Promise<T>}
   */
  get children_count() {
    return this.__load()
      .then(data => {
        return data.subcategories ? data.subcategories.length : 0;
      })
      .catch(errorOutput => Promise.reject(errorOutput));
  }

  /**
   * Get products count for the particular category
   * @returns {Promise<T>}
   */
  get product_count() {
    return this.__load()
      .then(data => {
        const searchKey = {
          categoryId: data.id,
          pageSize: 20,
          currentPage: 1,
        };
        return this.productsLoader.load(searchKey).then(response => {
          return response.pagination.totalResults;
        });
      })
      .catch(errorOutput => Promise.reject(errorOutput));
  }

  /**
   * Getters cannot have arguments, so we define a function to fetch product data
   * @param params
   * @returns {Products}
   */
  products(params) {
    // We don't need to call this.__load() here because only fetching the products
    // of a category does not require fetching the category itself
    return new Products({
      search: {
        categoryId: this.categoryId,
        pageSize: params.pageSize,
        currentPage: params.currentPage,
      },
      graphqlContext: this.graphqlContext,
      actionParameters: this.actionParameters,
      productsLoader: this.productsLoader,
      categoryTreeLoader: this.categoryTreeLoader,
    });
  }
}

class Products {
  /**
   * @param {Object} parameters
   * @param {Object} parameters.search The "search" argument of the GraphQL "products" field, with an optional categoryId property.
   * @param {Object} [parameters.graphqlContext] The optional GraphQL execution context passed to the resolver.
   * @param {Object} [parameters.actionParameters] Some optional parameters of the I/O Runtime action, like for example authentication info.
   * @param {ProductsLoader} [parameters.productsLoader] An optional ProductsLoader, to optimise caching.
   * @param {CategoryTreeLoader} [parameters.categoryTreeLoader] An optional CategoryTreeLoader, to optimise caching.
   */
  constructor(parameters) {
    this.search = parameters.search;
    this.categories = parameters.categories;
    this.graphqlContext = parameters.graphqlContext;
    this.actionParameters = parameters.actionParameters;
    this.productsLoader =
      parameters.productsLoader ||
      new ProductsLoader(parameters.actionParameters);
    this.categoryTreeLoader =
      parameters.categoryTreeLoader ||
      new CategoryTreeLoader(parameters.actionParameters);

    /**
     * This class returns a Proxy to avoid having to implement a getter for all properties.
     */
    return new LoaderProxy(this);
  }

  /**
   * Calls the products loader by search param
   * @returns {Promise<unknown>}
   * @private
   */
  __load() {
    console.debug(
      `Loading products for ${JSON.stringify(this.search, null, 0)}`
    );
    return this.productsLoader.load(this.search);
  }

  /**
   * Converts some products data from the 3rd-party commerce system into the Magento GraphQL format.
   * Properties that require some extra data fetching with the 3rd-party system must have dedicated getters
   * in this class.
   *
   * @param {Object} data
   * @returns {Object} The backend products data converted into a GraphQL "Products" data.
   */
  __convertData(data) {
    return {
      total_count: data.pagination.totalResults,
      page_info: {
        current_page: data.pagination.currentPage,
        page_size: data.pagination.pageSize,
        total_pages: data.pagination.totalPages,
      },
    };
  }

  /**
   * Get Items data in magento graphql format
   * @returns {Promise<T>}
   */
  get items() {
    return this.__load()
      .then(() => {
        if (!this.data.products || this.data.products.length === 0) {
          return [];
        }

        return this.data.products.map(productData => {
          return new Product({
            productData: productData,
            graphqlContext: this.graphqlContext,
            actionParameters: this.actionParameters,
            categoryTreeLoader: this.categoryTreeLoader,
            productsLoader: this.productsLoader,
            categories: this.categories,
          });
        });
      })
      .catch(errorOutput => Promise.reject(errorOutput));
  }
}

class Product {
  /**
   * @param {Object} parameters
   * @param {Object} parameters.productData The product data from the 3rd-party system.
   * @param {Object} [parameters.graphqlContext] The optional GraphQL execution context passed to the resolver.
   * @param {Object} [parameters.actionParameters] Some optional parameters of the I/O Runtime action, like for example authentication info.
   * @param {CategoryTreeLoader} [parameters.categoryTreeLoader] An optional CategoryTreeLoader, to optimise caching.
   * @param {ProductsLoader} [parameters.productsLoader] An optional ProductsLoader, to optimise caching.
   */
  constructor(parameters) {
    this.productData = parameters.productData;
    this.categoriesQuery = parameters.categories;
    this.graphqlContext = parameters.graphqlContext;
    this.actionParameters = parameters.actionParameters;
    this.HB_SECURE_BASE_MEDIA_URL = this.actionParameters.context.settings.HB_SECURE_BASE_MEDIA_URL;
    this.categoryTreeLoader =
      parameters.categoryTreeLoader ||
      new CategoryTreeLoader(parameters.actionParameters);
    this.productsLoader =
      parameters.productsLoader ||
      new ProductsLoader(parameters.actionParameters);

    /**
     * This class returns a Proxy to avoid having to implement a getter for all properties.
     */
    return new LoaderProxy(this);
  }

  /**
   * Get product type
   * @returns {string}
   * @private
   */
  get __typename() {
    return 'SimpleProduct';
  }

  /**
   * Get categories detail for the product in magento graphql format
   * @returns {CategoryTree[]}
   */
  get categories() {
    return this.productData.categories.map(categoryId => {
      return new CategoryTree({
        categoryId: categoryId.code,
        graphqlContext: this.graphqlContext,
        actionParameters: this.actionParameters,
        categoryTreeLoader: this.categoryTreeLoader,
        productsLoader: this.productsLoader,
      });
    });
  }

  /**
   * @returns {Promise<Object>}
   * @private
   */
  __load() {
    return Promise.resolve(this.productData);
  }

  /**
   * Converts some product data from the 3rd-party commerce system into the Magento GraphQL format.
   * @param data
   * @returns {{image: {label: *, url: string}, thumbnail: {label: *, url: string}, stock_status: string,
   *  small_image: {label: *, url: string}, price: {regularPrice: {amount: {currency: *, value: *}}}, name: *,
   *  description: {html: (*|string)}, id: number, categories: [], sku: *, url_key: *}}
   * @private
   */
  __convertData(data) {
    const imageUrl =
      data.images && data.images.length > 0
        ? `${this.HB_SECURE_BASE_MEDIA_URL}${data.images[0].url}`
        : '';
    return {
      sku: data.code,
      id: data.code,
      uid: data.code,
      url_key: data.code,
      name: data.name,
      staged: true,
      description: {
        html: data.description || '',
      },
      stock_status:
        data.stock && data.stock.stockLevelStatus === 'inStock'
          ? 'IN_STOCK'
          : 'OUT_OF_STOCK',
      price_range: {
        minimum_price: {
          regular_price: {
            value: data.price.value,
            currency: data.price.currencyIso,
          },
          final_price: {
            value: data.price.value,
            currency: data.price.currencyIso,
          },
          discount: {
            amount_off: 0,
            percent_off: 0,
          },
        },
      },
      price: {
        regularPrice: {
          amount: {
            currency: data.price.currencyIso,
            value: data.price.value,
          },
        },
      },
      image: this.categoriesQuery
        ? imageUrl
        : {
            url: imageUrl,
            label:
              data.images && data.images.length > 0
                ? data.images[0].altText || ''
                : '',
          },
      small_image: {
        url:
          data.images && data.images.length > 0
            ? `${this.HB_SECURE_BASE_MEDIA_URL}${data.images[0].url}`
            : '',
        label:
          data.images && data.images.length > 0
            ? data.images[0].altText || ''
            : '',
      },
      thumbnail: {
        url:
          data.images && data.images.length > 0
            ? `${this.HB_SECURE_BASE_MEDIA_URL}${data.images[0].url}`
            : '',
        label:
          data.images && data.images.length > 0
            ? data.images[0].altText || ''
            : '',
      },
      categories: [],
    };
  }

  /**
   * media_gallery type is interface can't return data directly so created MediaGallery Interface to return Data
   * @returns {*}
   */
  get media_gallery() {
    return this.productData.images
      ? this.productData.images
          .filter(
            image => image.format === 'product' || image.format === 'zoom'
          )
          .map(
            (image, index) =>
              new MediaGallery({
                position: index,
                url: image.url,
                disabled: false,
                label: image.altText || '',
              })
          )
      : [];
  }
}

class ProductsBySkus {
  /**
   * @param {Object} parameters
   * @param {Object} parameters.search The "search" argument of the GraphQL "products" field, with an optional categoryId property.
   * @param {Object} [parameters.graphqlContext] The optional GraphQL execution context passed to the resolver.
   * @param {Object} [parameters.actionParameters] Some optional parameters of the I/O Runtime action, like for example authentication info.
   * @param {ProductsLoader} [parameters.productsLoader] An optional ProductsLoader, to optimise caching.
   * @param {CategoryTreeLoader} [parameters.categoryTreeLoader] An optional CategoryTreeLoader, to optimise caching.
   */
  constructor(parameters) {
    this.search = parameters.search;
    this.skus = this.search.filter.sku.in;
    this.graphqlContext = parameters.graphqlContext;
    this.actionParameters = parameters.actionParameters;
    this.ProductLoader = new ProductLoader(parameters.actionParameters);
    this.productsLoader =
      parameters.productsLoader ||
      new ProductsLoader(parameters.actionParameters);
    this.categoryTreeLoader =
      parameters.categoryTreeLoader ||
      new CategoryTreeLoader(parameters.actionParameters);

    /**
     * This class returns a Proxy to avoid having to implement a getter for all properties.
     */
    return new LoaderProxy(this);
  }

  /**
   * Load products data by Array of skus
   * @returns {Promise}
   * @private
   */
  __load() {
    console.debug(`Loading products for ${JSON.stringify(this.skus, null, 0)}`);
    return this.ProductLoader.loadMany(this.skus);
  }

  /**
   * Converts some products data from the 3rd-party commerce system into the Magento GraphQL format.
   * Properties that require some extra data fetching with the 3rd-party system must have dedicated getters
   * in this class.
   *
   * @param {Object} data
   * @returns {Object} The backend products data converted into a GraphQL "Products" data.
   */
  __convertData(data) {
    return {
      total_count: data.length,
      page_info: {
        current_page: this.search.currentPage,
        page_size: this.search.pageSize,
        total_pages:
          data.length > this.search.pageSize
            ? Math.ceil(data.length / this.search.pageSize)
            : 1,
      },
    };
  }

  /**
   * Get Items data in magento graphql format
   * @returns {Promise<T>}
   */
  get items() {
    return this.__load()
      .then(() => {
        if (!this.data || this.data.length === 0) {
          return [];
        }

        return this.data.map(productData => {
          return new Product({
            productData: productData,
            graphqlContext: this.graphqlContext,
            actionParameters: this.actionParameters,
            categoryTreeLoader: this.categoryTreeLoader,
            productsLoader: this.productsLoader,
          });
        });
      })
      .catch(errorOutput => Promise.reject(errorOutput));
  }
}

class MediaGallery {
  /**
   * @param {Object} parameters
   * @param {String} parameters.url Url returns path of image
   * @param {Integer} parameters.position Position returns position of image .
   * @param {String} parameters.label Label returns title  of image .
   *
   */
  constructor(parameters) {
    const ymlData = Options.get();
    this.url = `${ymlData.HB_SECURE_BASE_MEDIA_URL}${parameters.url}`;
    this.position = parameters.position;
    this.label = parameters.label;
    this.disabled = parameters.disabled;
  }
  /**
   * get MediaGallery type
   * @returns {string}
   * @private
   */
  get __typename() {
    return 'ProductImage';
  }
}

module.exports.MediaGallery = MediaGallery;
module.exports.Products = Products;
module.exports.CategoryTree = CategoryTree;
module.exports.Product = Product;
module.exports.ProductsBySkus = ProductsBySkus;
