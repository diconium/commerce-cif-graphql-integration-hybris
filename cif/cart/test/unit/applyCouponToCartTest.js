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
const hybrisDeliveryModes = require('../resources/hybrisDeliveryModes.json');
const validResponseApplyCouponToCart = require('../resources/validResponseApplyCouponToCart.json');
const cartNotFound = require('../resources/cartNotFound.json');
const couponAlreadyExist = require('../resources/couponAlreadyExist.json');
const invalidCouponCode = require('../resources/invalidCouponCode.json');
const inActiveCouponCode = require('../resources/inActiveCouponCode.json');
const ApplyCouponToCartLoader = require('../../../cart/src/ApplyCouponToCartLoader');
const TestUtils = require('../../../utils/TestUtils.js');

describe('ApplyCouponOnCart', function() {
  const scope = nock(TestUtils.getHybrisInstance());
  let applyCouponToCart;
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
    applyCouponToCart = sinon.spy(
      ApplyCouponToCartLoader.prototype,
      '_applyCouponToCart'
    );
  });

  afterEach(() => {
    applyCouponToCart.restore();
  });

  describe('Unit Tests', () => {
    //Returns object with hybris url and configuaration data
    let args = TestUtils.getContextData();

    //Returns hybris configured api base path
    const HB_API_BASE_PATH = TestUtils.getYmlData().HB_API_BASE_PATH;

    it('Mutation: validate apply coupon to cart', () => {
      scope
        .post(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000016/vouchers`
        )
        .query({ voucherId: 'BUYMORE16' })
        .reply(200);
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/carts/00000016`)
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisApplyCoupon);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000016/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);
      args.query =
        'mutation {applyCouponToCart(input: {cart_id: "00000016",coupon_code: "BUYMORE16"}){cart{items{product{name}quantity}applied_coupon{code}prices{grand_total{value,currency}}}}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        let response = result.data.applyCouponToCart.cart;
        // Ensure the create empty cart function is only called once.
        assert.equal(applyCouponToCart.callCount, 1);
        expect(response).to.deep.equals(validResponseApplyCouponToCart);
      });
    });

    it('Mutation: validate response should contain cart not found', () => {
      scope
        .post(
          `${HB_API_BASE_PATH}electronics/users/current/carts/INVALID-CART-ID/vouchers`
        )
        .query({ voucherId: 'BUYMORE16' })
        .reply(400, cartNotFound);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/users/current/carts/INVALID-CART-ID`
        )
        .query({
          fields: 'DEFAULT',
          access_token: `${TestUtils.getContextData().context.settings.bearer}`,
        })
        .reply(200, hybrisApplyCoupon);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000016/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);

      args.query =
        'mutation {applyCouponToCart(input: {cart_id: "INVALID-CART-ID",coupon_code: "BUYMORE16"}){cart{items{product{name}quantity}applied_coupon{code}prices{grand_total{value,currency}}}}}';
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

    it('Mutation: validate response should contain coupon already exist for cart', () => {
      scope
        .post(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000016/vouchers`
        )
        .query({ voucherId: 'BUYMORE16' })
        .reply(400, couponAlreadyExist);
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/carts/00000016`)
        .query({
          fields: 'DEFAULT',
          access_token: `${TestUtils.getContextData().context.settings.bearer}`,
        })
        .reply(200, hybrisApplyCoupon);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000016/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);

      args.query =
        'mutation {applyCouponToCart(input: {cart_id: "00000016",coupon_code: "BUYMORE16"}){cart{items{product{name}quantity}applied_coupon{code}prices{grand_total{value,currency}}}}}';
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

    it('Mutation: validate response should contain coupon is inactive', () => {
      scope
        .post(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000016/vouchers`
        )
        .query({ voucherId: 'WINTER16' })
        .reply(400, inActiveCouponCode);
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/carts/00000016`)
        .query({
          fields: 'DEFAULT',
          access_token: `${TestUtils.getContextData().context.settings.bearer}`,
        })
        .reply(200, hybrisApplyCoupon);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000016/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);

      args.query =
        'mutation {applyCouponToCart(input: {cart_id: "00000016",coupon_code: "WINTER16"}){cart{items{product{name}quantity}applied_coupon{code}prices{grand_total{value,currency}}}}}';
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

    it('Mutation: validate response should contain coupon is invalid', () => {
      scope
        .post(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000016/vouchers`
        )
        .query({ voucherId: 'SUMMER69' })
        .reply(400, invalidCouponCode);
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/carts/00000016`)
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisApplyCoupon);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000016/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);

      args.query =
        'mutation {applyCouponToCart(input: {cart_id: "00000016",coupon_code: "SUMMER69"}){cart{items{product{name}quantity}applied_coupon{code}prices{grand_total{value,currency}}}}}';
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
