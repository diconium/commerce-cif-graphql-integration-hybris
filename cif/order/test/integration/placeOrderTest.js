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
const resolve = require('../../../order/src/orderResolver.js').main;
const TestUtils = require('../../../utils/TestUtils.js');
const chai = require('chai');
const { expect } = chai;
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
chai.use(chaiShallowDeepEqual);
const PlaceOrderLoader = require('../../src/PlaceOrderLoader');
const ymlData = require('../../../common/options.json');

describe('Place Order', function() {
  let PlaceOrder;
  before(() => {
    sinon.stub(console, 'debug');
    sinon.stub(console, 'error');
  });

  after(() => {
    console.debug.restore();
    console.error.restore();
  });

  beforeEach(() => {
    // We "spy" all the loading functions
    PlaceOrder = sinon.spy(PlaceOrderLoader.prototype, '_placeOrder');
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

    it('Mutation: validate response should return order Id', () => {
      args.query =
        'mutation { placeOrder(input: {cart_id: "00000050"}) {order { order_id}}}';
      return resolve(args).then(result => {
        let responseData = result.data.placeOrder.order.order_id;
        assert.notEqual(responseData, '');
        assert.equal(PlaceOrder.callCount, 1);
      });
    });

    it('Mutation: validate response should return invalid access token', () => {
      args.query =
        'mutation { placeOrder(input: {cart_id: "00000050"}) {order { order_id}}}';
      args.context.settings.bearer = 'accessToken';
      return resolve(args).then(result => {
        const errors = result.errors[0];
        expect(errors).shallowDeepEqual({
          message: 'Request failed with status code 401',
          source: {
            name: 'GraphQL request',
          },
        });
      });
    });

    it('Mutation: validate response should return Cart not found.', () => {
      args.query =
        'mutation { placeOrder(input: {cart_id: "CART NOT FOUND"}) {order { order_id}}}';
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

    it('Mutation: validate response should return Delivery mode is not set', () => {
      args.query =
        'mutation { placeOrder(input: {cart_id: "00000050"}) {order { order_id}}}';
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

    it('Mutation: validate response should return Payment info is not set', () => {
      args.query =
        'mutation { placeOrder(input: {cart_id: "00000050"}) {order { order_id}}}';
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
