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
const TestUtils = require('../../../utils/TestUtils.js');
const { expect } = chai;
const hybrisSetShippingMethodOnCart = require('../resources/hybrisSetShippingMethodOnCart');
const validSetShippingMethodOnCart = require('../resources/validSetShippingMethodOnCart');
const hybrisSetShippingMethodOnCartPremiumGross = require('../resources/hybrisSetShippingMethodOnCartPremium');
const hybrisDeliveryModes = require('../resources/hybrisDeliveryModes.json');
const validSetShippingMethodOnCartPremium = require('../resources/validSetShippingMethodOnCartPremium');
const cartNotFound = require('../resources/cartNotFound.json');
const SetShippingMethodLoader = require('../../src/SetShippingMethodsOnCartLoader');

describe('SetShippingMethodOnCart', () => {
  const scope = nock(TestUtils.getHybrisInstance());
  let SetShippingMethod;
  before(() => {
    // Disable console debugging
    sinon.stub(console, 'debug');
    sinon.stub(console, 'error');
  });

  after(() => {
    console.debug.restore();
    console.error.restore();
  });

  beforeEach(() => {
    // We "spy" all the loading functions
    SetShippingMethod = sinon.spy(
      SetShippingMethodLoader.prototype,
      '_setShippingMethod'
    );
  });

  afterEach(() => {
    SetShippingMethod.restore();
  });

  describe('Unit Tests', () => {
    //Returns object with hybris url and configuaration data
    let args = TestUtils.getContextData();

    //Returns hybris configured api base path
    const HB_API_BASE_PATH = TestUtils.getYmlData().HB_API_BASE_PATH;

    it('Mutation: set shipping method on cart deliveryModeId:standard-gross', () => {
      scope
        .put(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000035/deliverymode`
        )
        .query({
          fields: 'DEFAULT',
          deliveryModeId: 'standard-gross',
        })
        .reply(200);
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/carts/00000035`)
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisSetShippingMethodOnCart);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000035/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);

      args.query =
        'mutation {setShippingMethodsOnCart(input: {cart_id: "00000035", shipping_methods: [{carrier_code: "standard-gross", method_code: "bestway"}]}) {cart {shipping_addresses {selected_shipping_method { carrier_code,carrier_title,method_code,method_title,amount {value,currency}}}}}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        assert.equal(SetShippingMethod.callCount, 1);
        let response = result.data.setShippingMethodsOnCart;
        expect(response.cart.shipping_addresses).to.deep.equals(
          validSetShippingMethodOnCart.cart.shipping_addresses
        );
      });
    });

    it('Mutation: set shipping method on cart with deliveryModeId:premium-gross', () => {
      scope
        .put(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000035/deliverymode`
        )
        .query({
          fields: 'DEFAULT',
          deliveryModeId: 'premium-gross',
        })
        .reply(200);
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/carts/00000035`)
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisSetShippingMethodOnCartPremiumGross);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000035/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);

      args.query =
        'mutation {setShippingMethodsOnCart(input: {cart_id: "00000035", shipping_methods: [{carrier_code: "premium-gross", method_code: "bestway"}]}) {cart {shipping_addresses {selected_shipping_method { carrier_code,carrier_title,method_code,method_title,amount {value,currency}}}}}}';
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
        .put(
          `${HB_API_BASE_PATH}electronics/users/current/carts/INVALID-CART-ID/deliverymode`
        )
        .query({
          fields: 'DEFAULT',
          deliveryModeId: 'standard-gross',
        })
        .reply(400, cartNotFound);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/users/current/carts/INVALID-CART-ID`
        )
        .query({ fields: 'DEFAULT', query: '' })
        .reply(200, hybrisSetShippingMethodOnCart);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/users/current/carts/INVALID-CART-ID/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);

      args.query =
        'mutation {setShippingMethodsOnCart(input: {cart_id: "INVALID-CART-ID", shipping_methods: [{carrier_code: "standard-gross", method_code: "bestway"}]}) {cart {shipping_addresses {selected_shipping_method { carrier_code,carrier_title,method_code,method_title,amount {value,currency}}}}}}';
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
