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
const resolve = require('../../../cart/src/cartResolver.js').main;
const nock = require('nock');

const TestUtils = require('../../../utils/TestUtils.js');
const hybrisUpdateCartItems = require('../resources/hybrisUpdateCartItems');
const validUpdateCartItems = require('../resources/validUpdateCartItems');
const cartNotFound = require('../resources/cartNotFound');
const entryNotFoundUpdateCartItems = require('../resources/entryNotFoundUpdateCartItems');
const UpdateCartLoader = require('../../src/UpdateCartItemsLoader');
const hybrisCartData = require('../resources/hybrisCartQuery.json');
const hybrisDeliveryModes = require('../resources/hybrisDeliveryModes.json');

chai.use(chaiShallowDeepEqual);

describe('Update Cart Items Resolver', () => {
  const scope = nock(TestUtils.getHybrisInstance());
  let UpdateCart;
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
    UpdateCart = sinon.spy(UpdateCartLoader.prototype, '_updateMethod');
  });

  afterEach(() => {
    UpdateCart.restore();
  });

  describe('Unit Tests', () => {
    //Returns object with hybris url and configuaration data
    let args = TestUtils.getContextData();

    //Returns hybris configured api base path
    const HB_API_BASE_PATH = TestUtils.getYmlData().HB_API_BASE_PATH;

    it('Update cart items unit test case', () => {
      scope
        .patch(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000016/entries/0`
        )
        .query({ fields: 'FULL' })
        .reply(200, hybrisUpdateCartItems);
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/carts/00000016`)
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisCartData);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000016/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);

      args.query =
        'mutation {updateCartItems(input: {cart_id: "00000016", cart_items: [{cart_item_uid: "0",quantity: 3}]}){ cart{items {uid,product {name sku},quantity } prices { grand_total{ value,currency}}}}}';
      return resolve(args).then(result => {
        let response = result.data.updateCartItems.cart;
        const { errors } = result;
        assert.isUndefined(result.errors);
        expect(errors).to.be.undefined;
        assert.equal(UpdateCart.callCount, 1);
        expect(response).to.deep.equals(
          validUpdateCartItems.data.updateCartItems.cart
        );
      });
    });

    it('Mutation: Cart not found', () => {
      scope
        .patch(
          `${HB_API_BASE_PATH}electronics/users/current/carts/INVALID-CART-ID/entries/0`
        )
        .query({ fields: 'FULL' })
        .reply(400, cartNotFound);

      args.query =
        'mutation {updateCartItems(input: {cart_id: "INVALID-CART-ID", cart_items: [{cart_item_uid: "0",quantity: 3}]}){ cart{items {uid,product {name sku},quantity } prices { grand_total{ value,currency}}}}}';
      return resolve(args).then(result => {
        const errors = result.errors[0];
        expect(errors).shallowDeepEqual({
          message: 'Request failed with status code 400',
          source: {
            name: 'GraphQL request',
          },
        });
      });
    });

    it('Mutation: Entry not found', () => {
      scope
        .patch(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000016/entries/10`
        )
        .query({ fields: 'FULL' })
        .reply(400, entryNotFoundUpdateCartItems);

      args.query =
        'mutation {updateCartItems(input: {cart_id: "00000016", cart_items: [{cart_item_uid:"10",quantity: 3}]}){ cart{items {uid,product {name sku},quantity } prices { grand_total{ value,currency}}}}}';
      return resolve(args).then(result => {
        const errors = result.errors[0];
        expect(errors).shallowDeepEqual({
          message: 'Request failed with status code 400',
          source: {
            name: 'GraphQL request',
          },
        });
      });
    });
  });
});
