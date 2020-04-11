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

describe('Place Order', function() {
  before(() => {
    sinon.stub(console, 'debug');
    sinon.stub(console, 'error');
  });

  after(() => {
    console.debug.restore();
    console.error.restore();
  });

  describe('Integration Tests', () => {
    let args = {
      url: 'https://hybris.example.com/',
      context: {
        settings: {
          bearer: '',
          customerId: 'current',
        },
      },
    };

    it('Mutation: validate response should return order Id', () => {
      args.query =
        'mutation { placeOrder(input: {cart_id: "00000043"}) {order { order_id}}}';
      return TestUtils.getBearer().then(accessToken => {
        args.context.settings.bearer = accessToken;
        return resolve(args).then(result => {
          let responseData = result.data.placeOrder.order.order_id;
          assert.notEqual(responseData, '');
        });
      });
    });

    it('Mutation: validate response should return invalid access token', () => {
      args.query =
        'mutation { placeOrder(input: {cart_id: "00000043"}) {order { order_id}}}';
      args.context.settings.bearer = 'accessToken';
      return resolve(args).then(result => {
        const errors = result.errors[0];
        expect(errors).shallowDeepEqual({
          message: 'Invalid access token: accessToken',
          source: {
            name: 'GraphQL request',
          },
        });
      });
    });

    it('Mutation: validate response should return Cart not found.', () => {
      args.query =
        'mutation { placeOrder(input: {cart_id: "00000004"}) {order { order_id}}}';
      return TestUtils.getBearer().then(accessToken => {
        args.context.settings.bearer = accessToken;
        return resolve(args).then(result => {
          const errors = result.errors[0];
          expect(errors).shallowDeepEqual({
            message: 'Cart not found.',
            source: {
              name: 'GraphQL request',
            },
          });
        });
      });
    });

    it('Mutation: validate response should return Delivery mode is not set', () => {
      args.query =
        'mutation { placeOrder(input: {cart_id: "00000045"}) {order { order_id}}}';
      return TestUtils.getBearer().then(accessToken => {
        args.context.settings.bearer = accessToken;
        return resolve(args).then(result => {
          const errors = result.errors[0];
          expect(errors).shallowDeepEqual({
            message: 'Delivery mode is not set',
            source: {
              name: 'GraphQL request',
            },
          });
        });
      });
    });

    it('Mutation: validate response should return Payment info is not set', () => {
      args.query =
        'mutation { placeOrder(input: {cart_id: "00000004"}) {order { order_id}}}';
      return TestUtils.getBearer().then(accessToken => {
        args.context.settings.bearer = accessToken;
        return resolve(args).then(result => {
          const errors = result.errors[0];
          expect(errors).shallowDeepEqual({
            message: 'Payment info is not set',
            source: {
              name: 'GraphQL request',
            },
          });
        });
      });
    });
  });
});
