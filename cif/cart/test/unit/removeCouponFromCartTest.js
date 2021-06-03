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
const validResponseRemoveCouponFromCart = require('../resources/validResponseRemoveCouponFromCart.json');
const TestUtils = require('../../../utils/TestUtils.js');
const bearer = 'df808bac-0353-4883-a7cc-67583ebb2532';
const ymlData = require('../../../common/options.json');

describe('RemoveCouponFromCart', function() {
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

    it('Mutation: unit Remove coupon from cart', () => {
      scope
        .get(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/00000035/vouchers`
        )
        .query({ fields: 'DEFAULT', query: '' })
        .reply(200, hybrisGetVouchersList);
      scope
        .intercept(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/00000035/vouchers/BUYMORE16`,
          'delete'
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200);
      scope
        .get(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/00000035`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisGetCartWithCouponsResponse);
      scope
        .get(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/00000035/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation {removeCouponFromCart(input:{ cart_id: "00000035"}){cart{items{product{name}quantity}applied_coupon{code}prices{grand_total{value,currency}}}}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        let response = result.data.removeCouponFromCart.cart;
        expect(response).to.deep.equals(validResponseRemoveCouponFromCart);
      });
    });

    it('Mutation: validate response should contain cart not found', () => {
      scope
        .get(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/INVALID-CART-ID/vouchers`
        )
        .query({ fields: 'DEFAULT', query: '' })
        .reply(400, cartNotFound);
      scope
        .intercept(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/INVALID-CART-ID/vouchers/BUYMORE16`,
          'delete'
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, undefined);
      scope
        .get(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/INVALID-CART-ID`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisGetCartWithCouponsResponse);
      scope
        .get(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/INVALID-CART-ID/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);
      args.context.settings.bearer = bearer;
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
