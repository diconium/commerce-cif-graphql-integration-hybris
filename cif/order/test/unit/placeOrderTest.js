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
const resolve = require('../../../order/src/orderResolver.js').main;
const nock = require('nock');
const assert = require('chai').assert;
const chai = require('chai');
const { expect } = chai;
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
chai.use(chaiShallowDeepEqual);
const hybrisPlaceOrder = require('../resources/hybrisPlaceOrder.json');
const cartNotFound = require('../../../cart/test/resources/cartNotFound.json');
const deliveryAddressNotSet = require('../resources/deliveryAddressNotSet.json');
const paymentInfoNotSet = require('../resources/paymentInfoNotSet.json');
const bearer = 'b8f4dc9b-75aa-4eb3-a8d3-b8bbf879b0f6';

describe('SetShippingAddress OnCart', function() {
  const scope = nock('https://hybris.example.com');
  before(() => {
    sinon.stub(console, 'debug');
    sinon.stub(console, 'error');
  });

  after(() => {
    console.debug.restore();
    console.error.restore();
  });

  describe('Validation', () => {
    let args = {
      url: 'https://hybris.example.com',
      context: {
        settings: {
          bearer: '',
          customerId: 'current',
          HB_PROTOCOL: 'https',
          HB_API_HOST: 'hybris.example.com',
          HB_API_BASE_PATH: '/rest/v2',
          HB_BASESITEID: '/electronics',
        },
      },
    };

    it('Mutation: validate response should return valid coupon code', () => {
      scope
        .post('/rest/v2/electronics/users/current/orders')
        .query({
          fields: 'DEFAULT',
          cartId: '00000045',
          access_token: `${bearer}`,
        })
        .reply(200, hybrisPlaceOrder);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation { placeOrder(input: {cart_id: "00000045"}) {order { order_id}}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        let responseData = result.data.placeOrder.order;
        expect(responseData)
          .to.be.ok.and.to.haveOwnProperty('order_id')
          .and.to.equal('00000024');
      });
    });

    it('Mutation: validate response should contain cart not found', () => {
      scope
        .post('/rest/v2/electronics/users/current/orders')
        .query({
          fields: 'DEFAULT',
          cartId: '00000043',
          access_token: `${bearer}`,
        })
        .reply(400, cartNotFound);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation { placeOrder(input: {cart_id: "00000043"}) {order { order_id}}}';
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

    it('Mutation: validate response should contain Delivery mode is not set', () => {
      scope
        .post('/rest/v2/electronics/users/current/orders')
        .query({
          fields: 'DEFAULT',
          cartId: '00000045',
          access_token: `${bearer}`,
        })
        .reply(400, deliveryAddressNotSet);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation { placeOrder(input: {cart_id: "00000045"}) {order { order_id}}}';
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

    it('Mutation: validate response should contain Payment info is not set', () => {
      scope
        .post('/rest/v2/electronics/users/current/orders')
        .query({
          fields: 'DEFAULT',
          cartId: '00000023',
          access_token: `${bearer}`,
        })
        .reply(400, paymentInfoNotSet);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation { placeOrder(input: {cart_id: "00000023"}) {order { order_id}}}';
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
