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
const validResponseRemoveCouponFromCart = require('../resources/validResponseRemoveCouponFromCart.json');
const bearer = '11ec3520-46f8-48f2-bb9d-0788507466a6';

describe('RemoveCouponFromCart', function() {
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

    it('Mutation: Remove coupon from cart', () => {
      scope
        .get('/rest/v2/electronics/users/current/carts/00000002/vouchers')
        .query({ fields: 'DEFAULT', access_token: `${bearer}` })
        .reply(200, hybrisGetVouchersList);
      scope
        .intercept(
          '/rest/v2/electronics/users/current/carts/00000002/vouchers/coupontest001',
          'delete'
        )
        .query({ fields: 'DEFAULT', access_token: `${bearer}` })
        .reply(200);
      scope
        .get('/rest/v2/electronics/users/current/carts/00000002')
        .query({ fields: 'FULL', access_token: `${bearer}` })
        .reply(200, hybrisGetCartWithCouponsResponse);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation {removeCouponFromCart(input:{ cart_id: "00000002"}){cart{items{product{name}quantity}applied_coupon{code}prices{grand_total{value,currency}}}}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        let response = result.data.removeCouponFromCart.cart;
        expect(response).to.deep.equals(validResponseRemoveCouponFromCart);
      });
    });

    it('Mutation: validate response should contain cart not found', () => {
      scope
        .get('/rest/v2/electronics/users/current/carts/0000002/vouchers')
        .query({ fields: 'DEFAULT', access_token: `${bearer}` })
        .reply(400, cartNotFound);
      scope
        .intercept(
          '/rest/v2/electronics/users/current/carts/0000002/vouchers/coupontest001',
          'delete'
        )
        .query({ fields: 'DEFAULT', access_token: `${bearer}` })
        .reply(200, undefined);
      scope
        .get('/rest/v2/electronics/users/current/carts/0000002')
        .query({ fields: 'FULL', access_token: `${bearer}` })
        .reply(200, hybrisGetCartWithCouponsResponse);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation {removeCouponFromCart(input:{ cart_id: "0000002"}){cart{items{product{name}quantity}applied_coupon{code}prices{grand_total{value,currency}}}}}';
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
});
