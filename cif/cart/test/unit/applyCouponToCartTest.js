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
const resolve = require('../../../cart/src/cartResolver.js').main;
const nock = require('nock');
const assert = require('chai').assert;
const chai = require('chai');
const expect = require('chai').expect;
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
chai.use(chaiShallowDeepEqual);
const hybrisApplyCoupon = require('../resources/hybrisApplyCoupon.json');
const validResponseApplyCouponToCart = require('../resources/validResponseApplyCouponToCart.json');
const cartNotFound = require('../resources/cartNotFound.json');
const couponAlreadyExist = require('../resources/couponAlreadyExist.json');
const invalidCouponCode = require('../resources/invalidCouponCode.json');
const inActiveCouponCode = require('../resources/inActiveCouponCode.json');
const bearer = 'bb84cb05-9d99-4655-8f39-7d6ca7e0b22c';

describe('ApplyCouponOnCart', function() {
  const scope = nock('https://hybris.example.com');
  before(() => {
    sinon.stub(console, 'debug');
    sinon.stub(console, 'error');
  });

  after(() => {
    console.debug.restore();
    console.error.restore();
  });

  describe('Unit Tests', () => {
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

    it('Mutation: validate apply coupon to cart', () => {
      scope
        .post('/rest/v2/electronics/users/current/carts/00000002/vouchers')
        .query({ voucherId: 'coupontest001', access_token: `${bearer}` })
        .reply(200);
      scope
        .get('/rest/v2/electronics/users/current/carts/00000002')
        .query({ fields: 'FULL', access_token: `${bearer}` })
        .reply(200, hybrisApplyCoupon);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation {applyCouponToCart(input: {cart_id: "00000002",coupon_code: "coupontest001"}){cart{items{product{name}quantity}applied_coupon{code}prices{grand_total{value,currency}}}}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        let response = result.data.applyCouponToCart.cart;
        expect(response).to.deep.equals(validResponseApplyCouponToCart);
      });
    });

    it('Mutation: validate response should contain cart not found', () => {
      scope
        .post('/rest/v2/electronics/users/current/carts/0000002/vouchers')
        .query({ voucherId: 'coupontest001', access_token: `${bearer}` })
        .reply(400, cartNotFound);
      scope
        .get('/rest/v2/electronics/users/current/carts/0000002')
        .query({ fields: 'DEFAULT', access_token: `${bearer}` })
        .reply(200, hybrisApplyCoupon);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation {applyCouponToCart(input: {cart_id: "0000002",coupon_code: "coupontest001"}){cart{items{product{name}quantity}applied_coupon{code}prices{grand_total{value,currency}}}}}';
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

    it('Mutation: validate response should contain coupon already exist for cart', () => {
      scope
        .post('/rest/v2/electronics/users/current/carts/00000058/vouchers')
        .query({ voucherId: 'coupontest001', access_token: `${bearer}` })
        .reply(400, couponAlreadyExist);
      scope
        .get('/rest/v2/electronics/users/current/carts/00000058')
        .query({ fields: 'DEFAULT', access_token: `${bearer}` })
        .reply(200, hybrisApplyCoupon);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation {applyCouponToCart(input: {cart_id: "00000058",coupon_code: "coupontest001"}){cart{items{product{name}quantity}applied_coupon{code}prices{grand_total{value,currency}}}}}';
      return resolve(args).then(result => {
        const errors = result.errors[0];
        expect(errors).shallowDeepEqual({
          message: 'coupon.already.exists.cart',
          source: {
            name: 'GraphQL request',
          },
        });
      });
    });

    it('Mutation: validate response should contain coupon is inactive', () => {
      scope
        .post('/rest/v2/electronics/users/current/carts/00000058/vouchers')
        .query({ voucherId: 'coupontest001', access_token: `${bearer}` })
        .reply(400, inActiveCouponCode);
      scope
        .get('/rest/v2/electronics/users/current/carts/00000058')
        .query({ fields: 'DEFAULT', access_token: `${bearer}` })
        .reply(200, hybrisApplyCoupon);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation {applyCouponToCart(input: {cart_id: "00000058",coupon_code: "coupontest001"}){cart{items{product{name}quantity}applied_coupon{code}prices{grand_total{value,currency}}}}}';
      return resolve(args).then(result => {
        const errors = result.errors[0];
        expect(errors).shallowDeepEqual({
          message: 'coupon.not.active.expired',
          source: {
            name: 'GraphQL request',
          },
        });
      });
    });

    it('Mutation: validate response should contain coupon is invalid', () => {
      scope
        .post('/rest/v2/electronics/users/current/carts/00000058/vouchers')
        .query({ voucherId: 'coupontest001', access_token: `${bearer}` })
        .reply(400, invalidCouponCode);
      scope
        .get('/rest/v2/electronics/users/current/carts/00000058')
        .query({ fields: 'DEFAULT', access_token: `${bearer}` })
        .reply(200, hybrisApplyCoupon);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation {applyCouponToCart(input: {cart_id: "00000058",coupon_code: "coupontest001"}){cart{items{product{name}quantity}applied_coupon{code}prices{grand_total{value,currency}}}}}';
      return resolve(args).then(result => {
        const errors = result.errors[0];
        expect(errors).shallowDeepEqual({
          message: 'coupon.invalid.code.provided',
          source: {
            name: 'GraphQL request',
          },
        });
      });
    });
  });
});
