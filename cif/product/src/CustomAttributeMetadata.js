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

const CustomAttributeMetadataLoader = require('./CustomAttributeMetadataLoader.js');
const LoaderProxy = require('../../common/LoaderProxy.js');
class CustomAttributeMetadata {
  /**
   * @param {Object} parameters
   * @param {Object} parameters.productData The product data from the 3rd-party system.
   * @param {Object} [parameters.graphqlContext] The optional GraphQL execution context passed to the resolver.
   * @param {Object} [parameters.actionParameters] Some optional parameters of the I/O Runtime action, like for example authentication info.
   * @param {CategoryTreeLoader} [parameters.categoryTreeLoader] An optional CategoryTreeLoader, to optimise caching.
   * @param {ProductsLoader} [parameters.productsLoader] An optional ProductsLoader, to optimise caching.
   * LoaderProxy class returns a Proxy to avoid having to implement a getter for all properties.
   */
  constructor(parameters) {
    this.metaData = parameters.metaData;
    this.graphqlContext = parameters.graphqlContext;
    this.actionParameters = parameters.actionParameters;
    this.CustomAttributeMetadataLoader = new CustomAttributeMetadataLoader(
      parameters.actionParameters
    );

    return new LoaderProxy(this);
  }

  /**
   * @returns {Promise<Object>}
   * @private
   */
  __load() {
    return this.CustomAttributeMetadataLoader.load(this.metaData);
  }

  /**
   * Converts some product data from the 3rd-party commerce system into the Magento GraphQL format.
   * @param data
   * @returns {{image: {label: *, url: string}, thumbnail: {label: *, url: string}, stock_status: string,
   *  small_image: {label: *, url: string}, price: {regularPrice: {amount: {currency: *, value: *}}}, name: *,
   *  description: {html: (*|string)}, id: number, categories: [], sku: *, url_key: *}}
   * @private
   */
  __convertData() {
    return {
      items: [
        {
          attribute_code: 'category_id',
          attribute_type: 'AnyType',
          input_type: null,
        },
        {
          attribute_code: 'description',
          attribute_type: 'String',
          input_type: 'textarea',
        },
        {
          attribute_code: 'name',
          attribute_type: 'String',
          input_type: 'text',
        },
        {
          attribute_code: 'price',
          attribute_type: 'Float',
          input_type: 'price',
        },
        {
          attribute_code: 'short_description',
          attribute_type: 'String',
          input_type: 'textarea',
        },
        {
          attribute_code: 'sku',
          attribute_type: 'String',
          input_type: 'text',
        },
        {
          attribute_code: 'url_key',
          attribute_type: 'String',
          input_type: 'text',
        },
      ],
    };
  }
}
module.exports = CustomAttributeMetadata;
