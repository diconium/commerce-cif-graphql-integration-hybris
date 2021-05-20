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
const resolve = require('../../src/cartResolver.js').main;
const TestUtils = require('../../../utils/TestUtils');
const UpdateCartLoader = require('../../src/UpdateCartItemsLoader');
const ymlData = require('../../../common/options.json');

describe('Cart Resolver', () => {
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

  describe('Integration Tests', () => {
    let args = {
      url: TestUtils.getHybrisInstance(),
      context: {
        settings: {
          bearer: '',
          customerId: 'current',
          HB_PROTOCOL: ymlData.HB_PROTOCOL,
          HB_API_HOST: ymlData.HB_API_HOST,
          HB_API_BASE_PATH: ymlData.HB_API_BASE_PATH,
          HB_BASESITEID: ymlData.HB_BASESITEID,
        },
      },
    };
    before(async () => {
      args.context.settings.bearer = await TestUtils.getBearer();
    });

    it('Mutation: update cart items', () => {
      args.query =
        'mutation {updateCartItems(input: {cart_id: "00000035", cart_items: [{cart_item_id: "0",quantity: 3}]}){ cart{items {id,product {name sku},quantity } prices { grand_total{ value,currency}}}}}';
      //todo check async await support so that this variable can be stored earlier -- Done
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        let response = result.data.updateCartItems.cart;
        assert.equal(response.items.length > 0, true);
        assert.equal(typeof response.prices != 'undefined', true);
        assert.equal(
          typeof response.prices.grand_total.currency != 'undefined',
          true
        );
        assert.equal(
          typeof response.prices.grand_total.value != 'undefined',
          true
        );
        assert.equal(UpdateCart.callCount, 1);
      });
    });

    it('Mutation: update cart items entry number undefined', () => {
      args.query =
        'mutation {updateCartItems(input: {cart_id: "00000035", cart_items: [{cart_item_id: 100,quantity: 2}]}){ cart{items {id,product {name sku},quantity } prices { grand_total{ value,currency}}}}}';
      args.context.settings.customerId = 'anonymous';
      args.context.settings.bearer = '';
      return resolve(args).then(result => {
        assert.equal(result.data.updateCartItems, null);
        assert.equal(
          result.errors[0].message,
          'Request failed with status code 401'
        );
      });
    });
  });
});
