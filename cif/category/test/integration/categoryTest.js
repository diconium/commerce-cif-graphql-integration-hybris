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
const expect = require('chai').expect;
const mockRequire = require('mock-require');
const ProductsLoader = require('../../src/ProductsLoader.js');
const CategoryTreeLoader = require('../../../category/src/CategoryTreeLoader.js');
const CartLoader = require('../../../cart/src/CartLoader.js');
const ProductLoader = require('../../../product/src/ProductLoader.js');

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
            let resolve = require(options.actionName).main;
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
    resolve = require('../../../src/local/dispatcher.js').main;
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
      url: 'https://mybackendserver.com/rest',
      remoteSchemas: {
        cart: {
          order: 20,
          action: '../../src/remote/cartResolver.js',
        },
      },
    };

    it('Basic category search', () => {
      args.query =
        '{category(id: "1"){id,name,description,children{id,name,description,children{id,name,description}}}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.body.errors); // No GraphQL errors

        let category = result.body.data.category;
        assert.equal(category.id, '1');
        assert.equal(category.name, 'Category #1');

        let children = category.children;
        assert.equal(children.length, 2);
        children.forEach((subcategory, idx) => {
          let id = idx + 1;
          assert.equal(subcategory.name, `Category #1-${id}`);
          assert.equal(
            subcategory.description,
            `Fetched category #1-${id} from ${args.url}`
          );
          let subchildren = subcategory.children;
          assert.equal(subchildren.length, 2);
          subchildren.forEach((subsubcategory, idx2) => {
            let id2 = idx2 + 1;
            assert.equal(subsubcategory.name, `Category #1-${id}-${id2}`);
            assert.equal(
              subsubcategory.description,
              `Fetched category #1-${id}-${id2} from ${args.url}`
            );
          });
        });

        // Ensure the category loading function is only called once for each category being fetched
        assert.equal(getCategoryById.callCount, 7);
        assert(getCategoryById.calledWith('1', args));
        assert(getCategoryById.calledWith('1-1', args));
        assert(getCategoryById.calledWith('1-2', args));
        assert(getCategoryById.calledWith('1-1-1', args));
        assert(getCategoryById.calledWith('1-1-2', args));
        assert(getCategoryById.calledWith('1-2-1', args));
        assert(getCategoryById.calledWith('1-2-2', args));
      });
    });

    it('Combined products and category search', () => {
      args.query =
        '{products(filter:{sku:{eq:"a-sku"}}, currentPage:1){items{sku,categories{id}}}, category(id: "1"){id,products{items{sku}}}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.body.errors); // No GraphQL errors

        let items = result.body.data.products.items;
        assert.equal(items.length, 1);
        assert.equal(items[0].sku, 'a-sku');

        let categories = items[0].categories;
        assert.equal(categories.length, 2);
        categories.forEach((category, idx) => {
          let id = idx + 1;
          assert.equal(category.id, `cat${id}`);
        });

        let products = result.body.data.category.products;
        assert.equal(products.items.length, 2);
        products.items.forEach((item, idx) => {
          let id = idx + 1;
          assert.equal(item.sku, `product-${id}`);
        });

        // Ensure the Products search function is called once for the "search by sku"
        // and once for the category products
        assert(searchProducts.calledTwice);
        assert(
          searchProducts.calledWith(
            {
              filter: {
                sku: {
                  eq: 'a-sku',
                },
              },
              pageSize: 20,
              currentPage: 1,
            },
            args
          )
        );
        assert(
          searchProducts.calledWith(
            {
              categoryId: '1',
              pageSize: 20,
              currentPage: 1,
            },
            args
          )
        );

        // Ensure the category loading function is only called once for each category being fetched
        assert.equal(getCategoryById.callCount, 3);
        assert(getCategoryById.calledWith('1', args));
        assert(getCategoryById.calledWith('cat1', args));
        assert(getCategoryById.calledWith('cat2', args));
      });
    });

    it('Query cart remote resolver', () => {
      args.query =
        '{products(filter:{sku:{in:["a-sku", "b-sku"]}}, currentPage:1){items{sku}}, cart(cart_id:"abcd"){email,items{product{sku}}}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.body.errors); // No GraphQL errors

        let items = result.body.data.products.items;
        assert.equal(items.length, 2);
        assert.equal(items[0].sku, 'a-sku');
        assert.equal(items[1].sku, 'b-sku');

        let cart = result.body.data.cart;
        assert.equal(cart.email, 'dummy@example.com');

        let cartItems = cart.items;
        assert.equal(cartItems.length, 2);
        cartItems.forEach((item, idx) => {
          let id = idx + 1;
          let product = item.product;
          assert.equal(product.sku, `product-${id}`);
        });

        // Ensure the Products search function is called once
        assert(
          searchProducts.calledOnceWith(
            {
              filter: {
                sku: {
                  in: ['a-sku', 'b-sku'],
                },
              },
              pageSize: 20,
              currentPage: 1,
            },
            args
          )
        );

        // Ensure the cart loading function is only called once
        // (we dont check the 'args' parameter because this is modified by graphql-tools)
        assert(getCartById.calledOnceWith('abcd'));

        // Ensure the product loading function is only called twice, once for each product sku
        // (we dont check the 'args' parameter because this is modified by graphql-tools)
        assert(getProductBySku.calledTwice);
        assert(getProductBySku.calledWith('product-1'));
        assert(getProductBySku.calledWith('product-2'));
      });
    });

    it('Error when fetching the category data', () => {
      // Replace spy with stub
      getCategoryById.restore();
      getCategoryById = sinon
        .stub(CategoryTreeLoader.prototype, '__getCategoryById')
        .returns(Promise.reject('Connection failed'));

      args.query = '{category(id: "1"){id}}';
      return resolve(args).then(result => {
        assert.equal(result.body.errors.length, 1);
        assert.equal(result.body.errors[0].message, 'Backend data is null');
        expect(result.body.errors[0].path).to.eql(['category', 'id']);
      });
    });
  });
});
