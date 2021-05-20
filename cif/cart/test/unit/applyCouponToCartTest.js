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
const TestUtils = require('../../../utils/TestUtils.js');
const bearer = '1049a531-a218-4b67-a831-e94b68c37f73';
const ymlData = require('../../../common/options.json');

describe('ApplyCouponOnCart', function() {
  const scope = nock(`${ymlData.HB_PROTOCOL}://${ymlData.HB_API_HOST}`);
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

    it('Mutation: validate apply coupon to cart', () => {
      scope
        .post(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/00000016/vouchers`
        )
        .query({ voucherId: 'BUYMORE16' })
        .reply(200);
      scope
        .get(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/00000016`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisApplyCoupon);
      scope
        .get(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/00000016/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation {applyCouponToCart(input: {cart_id: "00000016",coupon_code: "BUYMORE16"}){cart{items{product{name}quantity}applied_coupon{code}prices{grand_total{value,currency}}}}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        let response = result.data.applyCouponToCart.cart;
        expect(response).to.deep.equals(validResponseApplyCouponToCart);
      });
    });

    it('Mutation: validate response should contain cart not found', () => {
      scope
        .post(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/INVALID-CART-ID/vouchers`
        )
        .query({ voucherId: 'BUYMORE16' })
        .reply(400, cartNotFound);
      scope
        .get(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/INVALID-CART-ID`
        )
        .query({ fields: 'DEFAULT', access_token: `${bearer}` })
        .reply(200, hybrisApplyCoupon);
      scope
        .get(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/00000016/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);
      args.context.settings.bearer = bearer;
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
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/00000016/vouchers`
        )
        .query({ voucherId: 'BUYMORE16' })
        .reply(400, couponAlreadyExist);
      scope
        .get(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/00000016`
        )
        .query({ fields: 'DEFAULT', access_token: `${bearer}` })
        .reply(200, hybrisApplyCoupon);
      scope
        .get(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/00000016/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);
      args.context.settings.bearer = bearer;
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
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/00000016/vouchers`
        )
        .query({ voucherId: 'WINTER16' })
        .reply(400, inActiveCouponCode);
      scope
        .get(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/00000016`
        )
        .query({ fields: 'DEFAULT', access_token: `${bearer}` })
        .reply(200, hybrisApplyCoupon);
      scope
        .get(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/00000016/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);
      args.context.settings.bearer = bearer;
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
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/00000016/vouchers`
        )
        .query({ voucherId: 'SUMMER69' })
        .reply(400, invalidCouponCode);
      scope
        .get(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/00000016`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisApplyCoupon);
      scope
        .get(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/00000016/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);
      args.context.settings.bearer = bearer;
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
