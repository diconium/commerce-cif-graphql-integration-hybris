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
const resolve = require('../../src/cartResolver.js').main;
const chai = require('chai');
const { expect } = chai;
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
chai.use(chaiShallowDeepEqual);
const nock = require('nock');
const assert = require('chai').assert;
const cartNotFound = require('../resources/cartNotFound.json');
const hybrisGetVouchersList = require('../resources/hybrisGetVouchersList.json');
const hybrisGetCartWithCouponsResponse = require('../resources/hybrisGetCartWithCouponsResponse.json');
const hybrisDeliveryModes = require('../resources/hybrisDeliveryModes.json');
//const validResponseRemoveCouponFromCart = require('../resources/validResponseRemoveCouponFromCart.json');
const RemoveCouponLoader = require('../../src/RemoveCouponFromCartLoader');
const TestUtils = require('../../../utils/TestUtils.js');

describe('RemoveCouponFromCart', function() {
  const scope = nock(TestUtils.getHybrisInstance());
  let RemoveCoupon;
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
    RemoveCoupon = sinon.spy(
      RemoveCouponLoader.prototype,
      '_removeCouponsFromCart'
    );
  });

  afterEach(() => {
    RemoveCoupon.restore();
  });

  describe('Unit Tests', () => {
    //Returns object with hybris url and configuaration data
    let args = TestUtils.getContextData();

    //Returns hybris configured api base path
    const HB_API_BASE_PATH = TestUtils.getYmlData().HB_API_BASE_PATH;

    it('Mutation: unit Remove coupon from cart', () => {
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000035/vouchers`
        )
        .query({ fields: 'DEFAULT', query: '' })
        .reply(200, hybrisGetVouchersList);
      scope
        .intercept(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000035/vouchers/BUYMORE16`,
          'delete'
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200);
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/carts/00000035`)
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisGetCartWithCouponsResponse);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000035/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);

      args.query =
        'mutation {removeCouponFromCart(input:{ cart_id: "00000035"}){cart{items{product{name}quantity}applied_coupon{code}prices{grand_total{value,currency}}}}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        let response = result.data.removeCouponFromCart.cart;
        assert.equal(response.items[0].quantity, 1);
      });
    });

    it('Mutation: validate response should contain cart not found', () => {
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/users/current/carts/INVALID-CART-ID/vouchers`
        )
        .query({ fields: 'DEFAULT', query: '' })
        .reply(400, cartNotFound);
      scope
        .intercept(
          `${HB_API_BASE_PATH}electronics/users/current/carts/INVALID-CART-ID/vouchers/BUYMORE16`,
          'delete'
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, undefined);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/users/current/carts/INVALID-CART-ID`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisGetCartWithCouponsResponse);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/users/current/carts/INVALID-CART-ID/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);

      args.query =
        'mutation {removeCouponFromCart(input:{ cart_id: "INVALID-CART-ID"}){cart{items{product{name}quantity}applied_coupon{code}prices{grand_total{value,currency}}}}}';
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
