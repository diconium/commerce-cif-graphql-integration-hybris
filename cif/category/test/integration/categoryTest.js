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

const sinon = require('sinon');
const assert = require('chai').assert;
const mockRequire = require('mock-require');
const ProductsLoader = require('../../../product/src/ProductsLoader.js');
const CategoryTreeLoader = require('../../src/CategoryTreeLoader.js');
const ProductLoader = require('../../../product/src/ProductLoader.js');
const ymlData = require('../../../common/options.json');

describe('Dispatcher Resolver', () => {
  let resolve;
  let searchProducts;
  let getProductBySku;
  let getCategoryById;

  before(() => {
    sinon.stub(console, 'error');

    // Mock openwhisk client
    mockRequire('openwhisk', () => {
      return {
        actions: {
          invoke: options => {
            resolve = require(options.actionName).main;
            return resolve({
              query: options.params.query,
              variables: options.params.variables,
              operationName: options.params.operationName,
              context: options.params.context,
            });
          },
        },
      };
    });

    // The main dispatcher resolver (will use the mock openwhisk client)
    resolve = require('../../../common/dispatcher.js').main;
  });

  after(() => {
    console.error.restore();
  });

  beforeEach(() => {
    // We "spy" all the loading functions
    searchProducts = sinon.spy(ProductsLoader.prototype, '__searchProducts');
    getProductBySku = sinon.spy(ProductLoader.prototype, '__getProductBySku');
    getCategoryById = sinon.spy(
      CategoryTreeLoader.prototype,
      '__getCategoryById'
    );
  });

  afterEach(() => {
    searchProducts.restore();
    getProductBySku.restore();
    getCategoryById.restore();
  });

  describe('Integration Tests', () => {
    let args = {
      url: `${ymlData.HB_PROTOCOL}://${ymlData.HB_API_HOST}`,
      __ow_headers: {
        authorization: '',
      },
      remoteSchemas: {
        category: {
          order: 20,
          action: '../../src/categoryResolver.js',
        },
        product: {
          order: 20,
          action: '../../../product/src/productResolver.js',
        },
      },
    };

    it('Basic category search', () => {
      args.query =
        '{categoryList(filters:{ids:{eq:"1"}}){id,name,url_path,url_key,product_count,children_count,children{id,name,url_path,url_key,product_count,children_count}}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.body.errors); // No GraphQL errors

        let category = result.body.data.categoryList[0];
        assert.equal(category.id, 1);
        assert.equal(category.name, 'Open Catalogue');

        let children = category.children;
        assert.equal(children.length, 4);

        // Ensure the category loading function is only called once for each category being fetched
        assert.equal(getCategoryById.callCount, 1);
      });
    });

    it('Basic category search with product details', () => {
      args.query =
        '{categoryList(filters:{category_uid:{eq:"1"}}){uid,products{items{sku,name}},name,description,children{uid,products{items{sku,name}},name,description,children{id,products{items{sku,name}},name,description}}}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.body.errors); // No GraphQL errors

        let category = result.body.data.categoryList[0];
        assert.equal(category.id, 1);
        assert.equal(category.name, 'Open Catalogue');

        let children = category.children;
        assert.equal(children.length, 4);
        assert.equal(category.products.items.length, 20);

        // Ensure the category loading function is only called once for each category being fetched
        assert.equal(getCategoryById.callCount, 1);

        assert.equal(searchProducts.callCount, 12);
      });
    });
  });
});
