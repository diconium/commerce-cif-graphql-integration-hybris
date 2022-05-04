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
const TestUtils = require('../../../utils/TestUtils.js');

const basicProductSearchHybrisResponse = require('../resources/basicProductSearchHybrisResponse.json');
const basicProductSearchGraphqlResponse = require('../resources/basicProductSearchGraphqlResponse.json');
const searchProductByCategoryIdHybrisResponse = require('../resources/searchProductByCategoryIdHybrisResponse.json');
const searchProductByCategoryIdGraphqlResponse = require('../resources/searchProductByCategoryIdGraphqlResponse.json');
const combinedSearchProductbySkuHybrisResponse = require('../resources/combinedSearchProductbySkuHybrisResponse.json');
//const combinedSearchCategoryHybrisResponse = require('../resources/combinedSearchCategoryHybrisResponse.json');
const combinedSearchCategory553HybrisResponse = require('../resources/combinedSearchCategory553HybrisResponse.json');
const combinedSearchCategory574HybrisResponse = require('../resources/combinedSearchCategory574HybrisResponse.json');
const combinedSearchCategory604HybrisResponse = require('../resources/combinedSearchCategory604HybrisResponse.json');
const combinedSearchCategory562HybrisResponse = require('../resources/combinedSearchCategory562HybrisResponse.json');
const combinedSearchProductHybrisResponse = require('../resources/combinedSearchProductHybrisResponse.json');
const combinedSearchGraphqlResplonse = require('../resources/combinedSearchGraphqlResplonse.json');
const multipleSkuSearch898503HybrisResponse = require('../resources/multipleSkuSearch898503HybrisResponse.json');
const multipleSkuSearch2278102HybrisResponse = require('../resources/multipleSkuSearch2278102HybrisResponse.json');
const multipleSkuSearchGraphqlResponse = require('../resources/multipleSkuSearchGraphqlResponse.json');

describe('Dispatcher Resolver', () => {
  const scope = nock(TestUtils.getHybrisInstance());
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
    //Returns hybris configured api base path
    const HB_API_BASE_PATH = TestUtils.getYmlData().HB_API_BASE_PATH;
    let args = {
      url: TestUtils.getHybrisInstance(),
      __ow_headers: {
        authorization: `Bearer ${
          TestUtils.getContextData().context.settings.bearer
        }`,
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
        '{products(currentPage:1,pageSize:6,search:"short",filter:{category_uid:{eq:"1"}}){total_count,items{__typename,sku,name,small_image{url},url_key,url_path,url_rewrites{url},price_range{minimum_price{regular_price{value,currency},final_price{value,currency},discount{amount_off,percent_off}}},... on ConfigurableProduct{price_range{maximum_price{regular_price{value,currency},final_price{value,currency},discount{amount_off,percent_off}}}},... on BundleProduct{price_range{maximum_price{regular_price{value,currency},final_price{value,currency},discount{amount_off,percent_off}}}},staged},aggregations{options{count,label,value},attribute_code,count,label}}}';
      const param = {
        currentPage: 1,
        fields: 'FULL',
        pageSize: 6,
        query: 'short',
        json: true,
      };
      scope
        .get(`${HB_API_BASE_PATH}electronics/products/search`)
        .query(param)
        .reply(200, basicProductSearchHybrisResponse)
        .log(console.log);
      return resolve(args).then(result => {
        assert.isUndefined(result.body.errors); // No GraphQL errors

        let products = result.body.data.products;
        assert.equal(products.total_count, 90);

        let items = products.items;
        assert.equal(items.length, 20);

        // Ensure the Products search function is only called once
        assert.equal(searchProducts.callCount, 1);
        expect(products).to.deep.equals(
          basicProductSearchGraphqlResponse.data.products
        );
      });
    });

    it('Search products by category id', () => {
      args.query =
        '{products(currentPage:1,pageSize:6,filter:{category_uid:{eq:"1"}},sort:{price:ASC}){total_count,items{__typename,sku,name,small_image{url},url_key,url_path,url_rewrites{url},price_range{minimum_price{regular_price{value,currency},final_price{value,currency},discount{amount_off,percent_off}}},... on ConfigurableProduct{price_range{maximum_price{regular_price{value,currency},final_price{value,currency},discount{amount_off,percent_off}}}},... on BundleProduct{price_range{maximum_price{regular_price{value,currency},final_price{value,currency},discount{amount_off,percent_off}}}},staged},aggregations{options{count,label,value},attribute_code,count,label}}}';
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/products/search?currentPage=1&fields=FULL&pageSize=6&query=1&sort=price-asc&json=true`
        )
        .reply(200, searchProductByCategoryIdHybrisResponse)
        .log(console.log);
      return resolve(args).then(result => {
        assert.isUndefined(result.body.errors); // No GraphQL errors

        let items = result.body.data.products.items;
        assert.equal(items[0].sku, '834955');
        expect(items).to.deep.equals(
          searchProductByCategoryIdGraphqlResponse.data.products.items
        );
      });
    });

    it('Combined products and category search', () => {
      args.query =
        '{products(filter:{sku:{eq:"898503"}}){items{__typename,sku,url_key,name,categories{__typename,uid,url_path,name,breadcrumbs{category_uid,category_url_path,category_name}}}}}';

      let param = {
        fields: 'FULL',
        json: true,
      };
      scope
        .get(`${HB_API_BASE_PATH}electronics/products/898503`)
        .query(param)
        .reply(200, combinedSearchProductbySkuHybrisResponse)
        .log(console.log);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/catalogs/electronicsProductCatalog/Online/categories/574`
        )
        .query(param)
        .reply(200, combinedSearchCategory574HybrisResponse)
        .log(console.log);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/catalogs/electronicsProductCatalog/Online/categories/553`
        )
        .query(param)
        .reply(200, combinedSearchCategory553HybrisResponse)
        .log(console.log);

      param = {
        currentPage: 1,
        fields: 'FULL',
        pageSize: 20,
        json: true,
      };
      scope
        .get(`${HB_API_BASE_PATH}electronics/products/search`)
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

        let products = result.body.data.products;
        assert.equal(products.items.length, 1);

        // Ensure the category loading function is only called once for each category being fetched
        assert.equal(getCategoryById.callCount, 2);
        expect(result.body.data).to.deep.equals(
          combinedSearchGraphqlResplonse.data
        );
      });
    });

    it('Query multiple sku remote resolver', () => {
      args.query =
        '{products(filter:{sku:{in:["898503","2278102",]}}){items{__typename,sku,url_key,name,categories{__typename,uid,url_path,name,breadcrumbs{category_uid,category_url_path,category_name}}}}}';
      let param = {
        fields: 'FULL',
        json: true,
      };
      scope
        .get(`${HB_API_BASE_PATH}electronics/products/898503`)
        .query(param)
        .reply(200, multipleSkuSearch898503HybrisResponse)
        .log(console.log);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/catalogs/electronicsProductCatalog/Online/categories/574`
        )
        .query(param)
        .reply(200, combinedSearchCategory574HybrisResponse)
        .log(console.log);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/catalogs/electronicsProductCatalog/Online/categories/553`
        )
        .query(param)
        .reply(200, combinedSearchCategory553HybrisResponse)
        .log(console.log);
      scope
        .get(`${HB_API_BASE_PATH}electronics/products/2278102`)
        .query(param)
        .reply(200, multipleSkuSearch2278102HybrisResponse)
        .log(console.log);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/catalogs/electronicsProductCatalog/Online/categories/604`
        )
        .query(param)
        .reply(200, combinedSearchCategory604HybrisResponse)
        .log(console.log);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/catalogs/electronicsProductCatalog/Online/categories/562`
        )
        .query(param)
        .reply(200, combinedSearchCategory562HybrisResponse)
        .log(console.log);
      param = {
        currentPage: 1,
        fields: 'FULL',
        pageSize: 20,
        json: true,
      };
      scope
        .get(`${HB_API_BASE_PATH}electronics/products/search`)
        .query(param)
        .reply(200, combinedSearchProductHybrisResponse)
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
        expect(items).to.deep.equals(
          multipleSkuSearchGraphqlResponse.data.products.items
        );
      });
    });

    it('Error when fetching the product data', () => {
      // Replace spy with stub
      searchProducts.restore();
      searchProducts = sinon
        .stub(ProductsLoader.prototype, '__searchProducts')
        .returns(Promise.reject('Connection failed'));

      args.query =
        '{products(currentPage:1,pageSize:6,search:"short",filter:{category_uid:{eq:"1"}}){total_count,items{__typename,sku,name,small_image{url},url_key,url_path,url_rewrites{url},price_range{minimum_price{regular_price{value,currency},final_price{value,currency},discount{amount_off,percent_off}}},... on ConfigurableProduct{price_range{maximum_price{regular_price{value,currency},final_price{value,currency},discount{amount_off,percent_off}}}},... on BundleProduct{price_range{maximum_price{regular_price{value,currency},final_price{value,currency},discount{amount_off,percent_off}}}},staged},aggregations{options{count,label,value},attribute_code,count,label}}}';
      return resolve(args).then(result => {
        let error = result.body.errors;
        assert.equal(error[0].message, 'Backend data is null');
        expect(error[0].path).to.eql(['products', 'total_count']);
      });
    });
  });
});
