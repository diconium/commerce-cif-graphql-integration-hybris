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
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
chai.use(chaiShallowDeepEqual);
const mockRequire = require('mock-require');
const ProductsLoader = require('../../src/ProductsLoader.js');
const CategoryTreeLoader = require('../../../category/src/CategoryTreeLoader.js');
const CartLoader = require('../../../cart/src/CartLoader.js');
const ProductLoader = require('../../../product/src/ProductLoader.js');
const TestUtils = require('../../../utils/TestUtils.js');

describe('Dispatcher Resolver', () => {
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
      url: `https://${TestUtils.getYmlData().HB_API_HOST}`,
      __ow_headers: {
        authorization: 'Bearer e771db98-ffa3-49bf-802a-c29a59d03991',
      },
      remoteSchemas: {
        customAttributeMetadata: {
          order: 20,
          action: '../../src/customAttributeMetadataResolver.js',
        },
        product: {
          order: 20,
          action: '../../src/productResolver.js',
        },
        category: {
          order: 20,
          action: '../../../category/src/categoryResolver.js',
        },
        cart: {
          order: 20,
          action: '../../../cart/src/cartResolver.js',
        },
      },
    };
    before(async () => {
      args.__ow_headers.authorization =
        'Bearer ' + (await TestUtils.getBearer());
    });

    it('Basic products search', () => {
      args.query =
        '{products(search: "short", currentPage: 1){total_count,page_info{current_page,page_size},items{sku,name,url_key,description{html},price{regularPrice{amount{currency,value}}}}}}';

      return resolve(args).then(result => {
        assert.isUndefined(result.body.errors); // No GraphQL errors

        let products = result.body.data.products;
        assert.equal(products.total_count, 86);

        let pageInfo = products.page_info;
        assert.equal(pageInfo.current_page, 1);
        assert.equal(pageInfo.page_size, 20);

        let items = products.items;
        assert.equal(items.length, 20);

        // Ensure the Products search function is only called once
        assert.equal(searchProducts.callCount, 1);
      });
    });

    it('Search products by category id', () => {
      args.query =
        '{products(filter:{category_uid:{eq:"1"}}, currentPage:1){items{sku,name,stock_status,image{url,label}}}}';

      return resolve(args).then(result => {
        assert.isUndefined(result.body.errors); // No GraphQL errors

        let items = result.body.data.products.items;
        assert.equal(items.length, 20);
        assert.equal(items[0].sku, '1099285');
      });
    });

    it('Combined products and category search', () => {
      args.query =
        '{products(filter:{sku:{eq:"898503"}}, currentPage:1){items{sku,categories{id}}}, categoryList(filters:{ids:{eq:"1"}}){id,products{items{sku}}}}';

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
      });
    });

    it('Query multiple sku remote resolver', () => {
      args.query =
        '{products(filter:{sku:{in:["898503", "2278102"]}}, currentPage:1){items{sku}}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.body.errors); // No GraphQL errors

        let items = result.body.data.products.items;
        assert.equal(items.length, 2);
        assert.equal(items[0].sku, '898503');
        assert.equal(items[1].sku, '2278102');

        // Ensure the product loading function is only called twice, once for each product sku
        // (we dont check the 'args' parameter because this is modified by graphql-tools)
        assert(getProductBySku.calledTwice);
      });
    });

    it('Query cart remote resolver', () => {
      args.query =
        '{products(filter:{sku:{in:["898503", "2278102"]}}, currentPage:1){items{sku}}, cart(cart_id:"00000004"){email,items{product{sku}}}}';
      // return TestUtils.getBearer().then(accessToken => {
      //   args.__ow_headers.authorization = 'Bearer ' + accessToken;
      return resolve(args).then(result => {
        assert.isUndefined(result.body.errors); // No GraphQL errors

        let items = result.body.data.products.items;
        assert.equal(items.length, 2);
        assert.equal(items[0].sku, '898503');
        assert.equal(items[1].sku, '2278102');

        let cart = result.body.data.cart;
        assert.equal(cart.email, 'test@example.com');

        let cartItems = cart.items;
        assert.equal(cartItems.length, 2);
        // Ensure the cart loading function is only called once
        // (we dont check the 'args' parameter because this is modified by graphql-tools)
        assert(getCartById.calledOnceWith('00000004'));

        // Ensure the product loading function is only called twice, once for each product sku
        // (we dont check the 'args' parameter because this is modified by graphql-tools)
        assert(getProductBySku.calledTwice);
        assert(getProductBySku.calledWith('898503'));
        assert(getProductBySku.calledWith('2278102'));
      });
      //});
    });
  });
});
