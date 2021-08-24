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
const resolve = require('../../src/cartResolver.js').main;
const nock = require('nock');
const hybrisAddSimpleProductToCart = require('../resources/hybrisAddSimpleProductToCart');
const validResponseAddSimpleProductToCart = require('../resources/validResponseAddSimpleProductToCart');
const inValidCart = require('../resources/inValidJsonFileAddSimpleProductToCart.json');
const AddProductToCartLoader = require('../../../cart/src/AddProductToCartLoader');
const TestUtils = require('../../../utils/TestUtils.js');

describe('AddProductToCart', () => {
  const scope = nock(TestUtils.getHybrisInstance());
  let addProductToCart;
  before(() => {
    // Disable console debugging
    sinon.stub(console, 'debug');
    sinon.stub(console, 'error');
  });

  after(() => {
    console.debug.restore();
    console.error.restore();
  });

  beforeEach(() => {
    // We "spy" all the loading functions
    addProductToCart = sinon.spy(
      AddProductToCartLoader.prototype,
      '_addProductToCart'
    );
  });

  afterEach(() => {
    addProductToCart.restore();
  });

  describe('Unit Tests', () => {
    //Returns object with hybris url and configuaration data
    let args = TestUtils.getContextData();

    //Returns hybris configured api base path
    const HB_API_BASE_PATH = TestUtils.getYmlData().HB_API_BASE_PATH;

    it('Add products to cart nock test case', () => {
      scope
        .post(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000015/entries`
        )
        .query({ fields: 'FULL' })
        .reply(200, hybrisAddSimpleProductToCart);
      args.query =
        'mutation {addSimpleProductsToCart(input: {cart_id: "00000015", cart_items: [{data: {quantity: 1.0, sku: "3514521"}}]}) {cart {items {uid, product {name,sku},quantity}}}}';
      return resolve(args).then(result => {
        let items = result.data.addSimpleProductsToCart.cart.items[0];
        let testData = validResponseAddSimpleProductToCart.items[0];
        const { errors } = result;
        assert.isUndefined(result.errors);
        expect(errors).to.be.undefined;
        assert.equal(items.uid, testData.uid);
        assert.equal(items.quantity, testData.quantity);
        assert.equal(items.product.name, testData.product.name);
        assert.equal(items.product.sku, testData.product.sku);
        // Ensure the create empty cart function is only called once.
        assert.equal(addProductToCart.callCount, 1);
      });
    });

    it('Mutation: validate response should contain cart not found', () => {
      scope
        .post(
          `${HB_API_BASE_PATH}electronics/users/current/carts/INVALID-CART-ID/entries`
        )
        .query({ fields: 'FULL' })
        .reply(400, inValidCart);
      args.query =
        'mutation {addSimpleProductsToCart(input: {cart_id: "INVALID-CART-ID", cart_items: [{data: {quantity: 1.0, sku: "3514521"}}]}) {cart {items {uid, product {name,sku},quantity}}}}';
      return resolve(args).then(result => {
        const errors = result.errors[0];
        expect(errors).shallowDeepEqual({
          message: 'Error: Request failed with status code 400',
          source: {
            name: 'GraphQL request',
          },
        });
      });
    });
  });
});
