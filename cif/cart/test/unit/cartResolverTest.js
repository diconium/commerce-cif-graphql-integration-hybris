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
const chai = require('chai');
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
const nock = require('nock');
chai.use(chaiShallowDeepEqual);
const { expect } = chai;
const bearer = 'aaa58f85-d5f5-4303-8a53-272f1868325f';
const resolve = require('../../src/cartResolver.js').main;
const hybrisCartData = require('../resources/hybrisCartQuery.json');
const validCartQueryData = require('../resources/validCartQueryResponse.json');
const cartNotFound = require('../resources/cartNotFound.json');

describe('Cart Resolver', function() {
  const scope = nock('https://hybris.example.com');

  before(() => {
    // Disable console debugging
    sinon.stub(console, 'debug');
    sinon.stub(console, 'error');
  });

  after(() => {
    console.debug.restore();
    console.error.restore();
  });

  describe('Integration Tests', () => {
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

    // todo this unit test can be broken down into several ones as cart returns lot of data and it would we nice to have the title of the tests for that data
    // todo for example : Cart query with valid voucher data
    it('Mutation: Cart query unit', () => {
      scope
        .get('/rest/v2/electronics/users/current/carts/00000001')
        .query({ fields: 'FULL', access_token: `${bearer}` })
        .reply(200, hybrisCartData);
      args.context.settings.bearer = bearer;
      args.query =
        '{cart(cart_id: "00000001") {email,billing_address {city,country {code,label},firstname,lastname,postcode, region {code,label},street,telephone},shipping_addresses{firstname,lastname,street,city,region{code,label},country{code,label},available_shipping_methods{amount{currency,value},available,carrier_code,carrier_title,error_message,method_code,method_title,price_excl_tax{value,currency},price_incl_tax{value,currency}},selected_shipping_method{amount{value,currency},carrier_code,carrier_title,method_code,method_title}},items{id,product{name,sku},quantity},available_payment_methods{code,title},selected_payment_method{code,title},applied_coupon{code},prices{grand_total{value,currency}}}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        let response = result.data.cart;
        expect(response).to.deep.equals(validCartQueryData.cart);
      });
    });

    it('Mutation: Cart query invalid cart id', () => {
      scope
        .get('/rest/v2/electronics/users/current/carts/10000001')

        .query({ fields: 'FULL', access_token: `${bearer}` })
        .reply(400, cartNotFound);
      args.context.settings.bearer = bearer;
      args.query =
        '{cart(cart_id: "10000001") {email,billing_address {city,country {code,label},firstname,lastname,postcode, region {code,label},street,telephone},shipping_addresses{firstname,lastname,street,city,region{code,label},country{code,label},available_shipping_methods{amount{currency,value},available,carrier_code,carrier_title,error_message,method_code,method_title,price_excl_tax{value,currency},price_incl_tax{value,currency}},selected_shipping_method{amount{value,currency},carrier_code,carrier_title,method_code,method_title}},items{id,product{name,sku},quantity},available_payment_methods{code,title},selected_payment_method{code,title},applied_coupon{code},prices{grand_total{value,currency}}}}';
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
