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
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
const nock = require('nock');
const assert = require('chai').assert;
chai.use(chaiShallowDeepEqual);
const bearer = '321f45b5-c25c-4a68-ba69-301c41e1f4e4';
const { expect } = chai;
const hybrisSetShippingMethodOnCart = require('../resources/hybrisSetShippingMethodOnCart');
const validSetShippingMethodOnCart = require('../resources/validSetShippingMethodOnCart');
const hybrisSetShippingMethodOnCartPremiumGross = require('../resources/hybrisSetShippingMethodOnCartPremium');
const validSetShippingMethodOnCartPremium = require('../resources/validSetShippingMethodOnCartPremium');
const cartNotFound = require('../resources/cartNotFound.json');

describe('SetShippingMethodOnCart', () => {
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

    it('Mutation: set shipping method on cart deliveryModeId:standard-gross', () => {
      scope
        .put('/rest/v2/electronics/users/current/carts/00000000/deliverymode')
        .query({
          fields: 'DEFAULT',
          deliveryModeId: 'standard-gross',
          access_token: `${bearer}`,
        })
        .reply(200);
      scope
        .get('/rest/v2/electronics/users/current/carts/00000000')
        .query({ fields: 'FULL', access_token: `${bearer}` })
        .reply(200, hybrisSetShippingMethodOnCart);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation {setShippingMethodsOnCart(input: {cart_id: "00000000", shipping_methods: [{carrier_code: "standard-gross", method_code: "bestway"}]}) {cart {shipping_addresses {selected_shipping_method { carrier_code,carrier_title,method_code,method_title,amount {value,currency}}}}}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        let response = result.data.setShippingMethodsOnCart;
        expect(response.cart.shipping_addresses).to.deep.equals(
          validSetShippingMethodOnCart.cart.shipping_addresses
        );
      });
    });

    it('Mutation: set shipping method on cart with deliveryModeId:premium-gross', () => {
      scope
        .put('/rest/v2/electronics/users/current/carts/00000000/deliverymode')
        .query({
          fields: 'DEFAULT',
          deliveryModeId: 'premium-gross',
          access_token: `${bearer}`,
        })
        .reply(200);
      scope
        .get('/rest/v2/electronics/users/current/carts/00000000')
        .query({ fields: 'FULL', access_token: `${bearer}` })
        .reply(200, hybrisSetShippingMethodOnCartPremiumGross);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation {setShippingMethodsOnCart(input: {cart_id: "00000000", shipping_methods: [{carrier_code: "premium-gross", method_code: "bestway"}]}) {cart {shipping_addresses {selected_shipping_method { carrier_code,carrier_title,method_code,method_title,amount {value,currency}}}}}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        let response = result.data.setShippingMethodsOnCart.cart;
        assert.equal(typeof response !== 'undefined', true);
        expect(response).to.deep.equals(
          validSetShippingMethodOnCartPremium.cart
        );
      });
    });

    it('Mutation: Set shipping method on cart validate response should contain cart not found', () => {
      scope
        .put('/rest/v2/electronics/users/current/carts/00000000/deliverymode')
        .query({
          fields: 'DEFAULT',
          deliveryModeId: 'standard-gross',
          access_token: `${bearer}`,
        })
        .reply(400, cartNotFound);
      scope
        .get('/rest/v2/electronics/users/current/carts/00000000')
        .query({ fields: 'DEFAULT', access_token: `${bearer}` })
        .reply(200, hybrisSetShippingMethodOnCart);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation {setShippingMethodsOnCart(input: {cart_id: "00000000", shipping_methods: [{carrier_code: "standard-gross", method_code: "bestway"}]}) {cart {shipping_addresses {selected_shipping_method { carrier_code,carrier_title,method_code,method_title,amount {value,currency}}}}}}';
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
