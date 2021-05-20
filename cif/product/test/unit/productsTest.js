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
const chai = require('chai');
const assert = require('chai').assert;
const expect = require('chai').expect;
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
chai.use(chaiShallowDeepEqual);
const nock = require('nock');
const mockRequire = require('mock-require');
const ProductsLoader = require('../../src/ProductsLoader.js');
const CategoryTreeLoader = require('../../../category/src/CategoryTreeLoader.js');
const CartLoader = require('../../../cart/src/CartLoader.js');
const ProductLoader = require('../../../product/src/ProductLoader.js');

const basicProductSearchHybrisResponse = require('../resources/basicProductSearchHybrisResponse.json');
const basicProductSearchGraphqlResponse = require('../resources/basicProductSearchGraphqlResponse.json');
const searchProductByCategoryIdHybrisResponse = require('../resources/searchProductByCategoryIdHybrisResponse.json');
const searchProductByCategoryIdGraphqlResponse = require('../resources/searchProductByCategoryIdGraphqlResponse.json');
const combinedSearchProductbySkuHybrisResponse = require('../resources/combinedSearchProductbySkuHybrisResponse.json');
const combinedSearchCategoryHybrisResponse = require('../resources/combinedSearchCategoryHybrisResponse.json');
const combinedSearchCategory553HybrisResponse = require('../resources/combinedSearchCategory553HybrisResponse.json');
const combinedSearchCategory574HybrisResponse = require('../resources/combinedSearchCategory574HybrisResponse.json');
const combinedSearchProductHybrisResponse = require('../resources/combinedSearchProductHybrisResponse.json');
const combinedSearchGraphqlResplonse = require('../resources/combinedSearchGraphqlResplonse.json');
const multipleSkuSearch898503HybrisResponse = require('../resources/multipleSkuSearch898503HybrisResponse.json');
const multipleSkuSearch2278102HybrisResponse = require('../resources/multipleSkuSearch2278102HybrisResponse.json');
const multipleSkuSearchGraphqlResponse = require('../resources/multipleSkuSearchGraphqlResponse.json');
const ymlData = require('../../../common/options.json');

describe('Dispatcher Resolver', () => {
  const scope = nock(`${ymlData.HB_PROTOCOL}://${ymlData.HB_API_HOST}`);
  let resolve;
  let searchProducts;
  let getProductBySku;
  let getCategoryById;
  let getCartById;

  before(() => {
    // Disable console debugging
    sinon.stub(console, 'debug');
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
    console.debug.restore();
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
    getCartById = sinon.spy(CartLoader.prototype, '__getCartById');
  });

  afterEach(() => {
    searchProducts.restore();
    getProductBySku.restore();
    getCategoryById.restore();
    getCartById.restore();
  });

  describe('Integration Tests', () => {
    let args = {
      url: `${ymlData.HB_PROTOCOL}://${ymlData.HB_API_HOST}`,
      __ow_headers: {
        authorization: 'Bearer e771db98-ffa3-49bf-802a-c29a59d03991',
      },
      remoteSchemas: {
        category: {
          order: 20,
          action: '../../../category/src/categoryResolver.js',
        },
        product: {
          order: 20,
          action: '../../src/productResolver.js',
        },
        cart: {
          order: 20,
          action: '../../../cart/src/cartResolver.js',
        },
      },
    };

    it('Basic products search', () => {
      args.query =
        '{products(search: "short", currentPage: 1){total_count,page_info{current_page,page_size},items{sku,name,description{html},price{regularPrice{amount{currency,value}}}}}}';
      const param = {
        currentPage: 1,
        fields: 'FULL',
        pageSize: 20,
        query: 'short',
        json: true,
      };
      scope
        .get(`${ymlData.HB_API_BASE_PATH}electronics/products/search`)
        .query(param)
        .reply(200, basicProductSearchHybrisResponse)
        .log(console.log);
      return resolve(args).then(result => {
        assert.isUndefined(result.body.errors); // No GraphQL errors

        let products = result.body.data.products;
        assert.equal(products.total_count, 90);

        let pageInfo = products.page_info;
        assert.equal(pageInfo.current_page, 1);
        assert.equal(pageInfo.page_size, 20);

        let items = products.items;
        assert.equal(items.length, 20);

        // Ensure the Products search function is only called once
        assert.equal(searchProducts.callCount, 1);
        expect(products).to.deep.equals(basicProductSearchGraphqlResponse);
      });
    });

    it('Search products by category id', () => {
      args.query =
        '{products(filter:{category_uid:{eq:"1"}}, currentPage:1){items{sku,name,stock_status,image{url,label}}}}';
      const param = {
        currentPage: 1,
        fields: 'FULL',
        pageSize: 20,
        query: '::allCategories:1',
        json: true,
      };
      scope
        .get(`${ymlData.HB_API_BASE_PATH}electronics/products/search`)
        .query(param)
        .reply(200, searchProductByCategoryIdHybrisResponse)
        .log(console.log);
      return resolve(args).then(result => {
        assert.isUndefined(result.body.errors); // No GraphQL errors

        let items = result.body.data.products.items;
        assert.equal(items.length, 20);
        assert.equal(items[0].sku, '898503');
        expect(items).to.deep.equals(searchProductByCategoryIdGraphqlResponse);
      });
    });

    it('Combined products and category search', () => {
      args.query =
        '{products(filter:{sku:{eq:"898503"}}, currentPage:1){items{sku,categories{uid}}}, categoryList(filters:{category_uid:{eq:"1"}}){uid,products{items{sku}}}}';
      let param = {
        fields: 'FULL',
        json: true,
      };
      scope
        .get(`${ymlData.HB_API_BASE_PATH}electronics/products/898503`)
        .query(param)
        .reply(200, combinedSearchProductbySkuHybrisResponse)
        .log(console.log);

      scope
        .get(
          `${ymlData.HB_API_BASE_PATH}electronics/catalogs/electronicsProductCatalog/Online/categories/1`
        )
        .query(param)
        .reply(200, combinedSearchCategoryHybrisResponse)
        .log(console.log);

      scope
        .get(
          `${ymlData.HB_API_BASE_PATH}electronics/catalogs/electronicsProductCatalog/Online/categories/553`
        )
        .query(param)
        .reply(200, combinedSearchCategory553HybrisResponse)
        .log(console.log);

      scope
        .get(
          `${ymlData.HB_API_BASE_PATH}electronics/catalogs/electronicsProductCatalog/Online/categories/574`
        )
        .query(param)
        .reply(200, combinedSearchCategory574HybrisResponse)
        .log(console.log);

      param = {
        currentPage: 1,
        fields: 'FULL',
        pageSize: 20,
        query: '::allCategories:1',
        json: true,
      };
      scope
        .get(`${ymlData.HB_API_BASE_PATH}electronics/products/search`)
        .query(param)
        .reply(200, combinedSearchProductHybrisResponse)
        .log(console.log);

      return resolve(args).then(result => {
        assert.isUndefined(result.body.errors); // No GraphQL errors

        let items = result.body.data.products.items;
        assert.equal(items.length, 1);
        assert.equal(items[0].sku, '898503');

        let categories = items[0].categories;
        assert.equal(categories.length, 2);

        let products = result.body.data.categoryList[0].products;
        assert.equal(products.items.length, 20);

        // Ensure the Products search function is called once for the "search by sku"
        // and once for the category products
        assert(searchProducts.calledTwice);

        // Ensure the category loading function is only called once for each category being fetched
        assert.equal(getCategoryById.callCount, 3);
        expect(result.body.data).to.deep.equals(combinedSearchGraphqlResplonse);
      });
    });

    it('Query multiple sku remote resolver', () => {
      args.query =
        '{products(filter:{sku:{in:["898503", "2278102"]}}, currentPage:1){items{sku}}}';
      let param = {
        fields: 'FULL',
        json: true,
      };
      scope
        .get(`${ymlData.HB_API_BASE_PATH}electronics/products/898503`)
        .query(param)
        .reply(200, multipleSkuSearch898503HybrisResponse)
        .log(console.log);

      scope
        .get(`${ymlData.HB_API_BASE_PATH}electronics/products/2278102`)
        .query(param)
        .reply(200, multipleSkuSearch2278102HybrisResponse)
        .log(console.log);

      return resolve(args).then(result => {
        assert.isUndefined(result.body.errors); // No GraphQL errors

        let items = result.body.data.products.items;
        assert.equal(items.length, 2);
        assert.equal(items[0].sku, '898503');
        assert.equal(items[1].sku, '2278102');

        // Ensure the product loading function is only called twice, once for each product sku
        // (we dont check the 'args' parameter because this is modified by graphql-tools)
        assert(getProductBySku.calledTwice);
        expect(items).to.deep.equals(multipleSkuSearchGraphqlResponse);
      });
    });

    it('Error when fetching the product data', () => {
      // Replace spy with stub
      searchProducts.restore();
      searchProducts = sinon
        .stub(ProductsLoader.prototype, '__searchProducts')
        .returns(Promise.reject('Connection failed'));

      args.query = '{products(search: "short", currentPage: 1){total_count}}';
      return resolve(args).then(result => {
        assert.equal(result.body.errors.length, 1);
        assert.equal(result.body.errors[0].message, 'Backend data is null');
        expect(result.body.errors[0].path).to.eql(['products', 'total_count']);
      });
    });
  });
});
