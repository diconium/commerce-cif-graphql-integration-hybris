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
        .reply(200, hybrisDeliveryModes);
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
      args.variables = {
        cartId: '00000035',
        shippingMethod: {
          carrier_code: 'standard-gross',
          method_code: 'standard-gross',
        },
      };
      args.query =
        'mutation SetShippingMethod($cartId:String!$shippingMethod:ShippingMethodInput!){setShippingMethodsOnCart(input:{cart_id:$cartId shipping_methods:[$shippingMethod]}){cart{id available_payment_methods{code title __typename}...SelectedShippingMethodCheckoutFragment ...PriceSummaryFragment ...ShippingInformationFragment ...AvailableShippingMethodsCheckoutFragment __typename}__typename}}fragment AvailableShippingMethodsCheckoutFragment on Cart{id shipping_addresses{available_shipping_methods{amount{currency value __typename}available carrier_code carrier_title method_code method_title __typename}street __typename}__typename}fragment SelectedShippingMethodCheckoutFragment on Cart{id shipping_addresses{selected_shipping_method{amount{currency value __typename}carrier_code method_code method_title __typename}street __typename}__typename}fragment PriceSummaryFragment on Cart{id items{id quantity __typename}...ShippingSummaryFragment prices{...TaxSummaryFragment ...DiscountSummaryFragment ...GrandTotalFragment subtotal_excluding_tax{currency value __typename}__typename}...GiftCardSummaryFragment __typename}fragment DiscountSummaryFragment on CartPrices{discounts{amount{currency value __typename}label __typename}__typename}fragment GiftCardSummaryFragment on Cart{id applied_gift_cards{code applied_balance{value currency __typename}__typename}__typename}fragment GrandTotalFragment on CartPrices{grand_total{currency value __typename}__typename}fragment ShippingSummaryFragment on Cart{id shipping_addresses{selected_shipping_method{amount{currency value __typename}__typename}street __typename}__typename}fragment TaxSummaryFragment on CartPrices{applied_taxes{amount{currency value __typename}__typename}__typename}fragment ShippingInformationFragment on Cart{id email shipping_addresses{city country{code label __typename}firstname lastname postcode region{code label region_id __typename}street telephone __typename}__typename}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        assert.equal(SetShippingMethod.callCount, 1);
        let response = result.data.setShippingMethodsOnCart;
        expect(response.cart.shipping_addresses).to.deep.equals(
          validSetShippingMethodOnCart.data.setShippingMethodsOnCart.cart
            .shipping_addresses
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
        .reply(200, hybrisDeliveryModes);
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
      args.variables = {
        cartId: '00000035',
        shippingMethod: {
          carrier_code: 'premium-gross',
          method_code: 'premium-gross',
        },
      };
      args.query =
        'mutation SetShippingMethod($cartId:String!$shippingMethod:ShippingMethodInput!){setShippingMethodsOnCart(input:{cart_id:$cartId shipping_methods:[$shippingMethod]}){cart{id available_payment_methods{code title __typename}...SelectedShippingMethodCheckoutFragment ...PriceSummaryFragment ...ShippingInformationFragment ...AvailableShippingMethodsCheckoutFragment __typename}__typename}}fragment AvailableShippingMethodsCheckoutFragment on Cart{id shipping_addresses{available_shipping_methods{amount{currency value __typename}available carrier_code carrier_title method_code method_title __typename}street __typename}__typename}fragment SelectedShippingMethodCheckoutFragment on Cart{id shipping_addresses{selected_shipping_method{amount{currency value __typename}carrier_code method_code method_title __typename}street __typename}__typename}fragment PriceSummaryFragment on Cart{id items{id quantity __typename}...ShippingSummaryFragment prices{...TaxSummaryFragment ...DiscountSummaryFragment ...GrandTotalFragment subtotal_excluding_tax{currency value __typename}__typename}...GiftCardSummaryFragment __typename}fragment DiscountSummaryFragment on CartPrices{discounts{amount{currency value __typename}label __typename}__typename}fragment GiftCardSummaryFragment on Cart{id applied_gift_cards{code applied_balance{value currency __typename}__typename}__typename}fragment GrandTotalFragment on CartPrices{grand_total{currency value __typename}__typename}fragment ShippingSummaryFragment on Cart{id shipping_addresses{selected_shipping_method{amount{currency value __typename}__typename}street __typename}__typename}fragment TaxSummaryFragment on CartPrices{applied_taxes{amount{currency value __typename}__typename}__typename}fragment ShippingInformationFragment on Cart{id email shipping_addresses{city country{code label __typename}firstname lastname postcode region{code label region_id __typename}street telephone __typename}__typename}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        let response = result.data.setShippingMethodsOnCart;
        assert.equal(typeof response !== 'undefined', true);
        assert.equal(response.cart.id, '00000035');
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
      args.variables = {
        cartId: 'INVALID-CART-ID',
        shippingMethod: {
          carrier_code: 'standard-gross',
          method_code: 'standard-gross',
        },
      };
      args.query =
        'mutation SetShippingMethod($cartId:String!$shippingMethod:ShippingMethodInput!){setShippingMethodsOnCart(input:{cart_id:$cartId shipping_methods:[$shippingMethod]}){cart{id available_payment_methods{code title __typename}...SelectedShippingMethodCheckoutFragment ...PriceSummaryFragment ...ShippingInformationFragment ...AvailableShippingMethodsCheckoutFragment __typename}__typename}}fragment AvailableShippingMethodsCheckoutFragment on Cart{id shipping_addresses{available_shipping_methods{amount{currency value __typename}available carrier_code carrier_title method_code method_title __typename}street __typename}__typename}fragment SelectedShippingMethodCheckoutFragment on Cart{id shipping_addresses{selected_shipping_method{amount{currency value __typename}carrier_code method_code method_title __typename}street __typename}__typename}fragment PriceSummaryFragment on Cart{id items{id quantity __typename}...ShippingSummaryFragment prices{...TaxSummaryFragment ...DiscountSummaryFragment ...GrandTotalFragment subtotal_excluding_tax{currency value __typename}__typename}...GiftCardSummaryFragment __typename}fragment DiscountSummaryFragment on CartPrices{discounts{amount{currency value __typename}label __typename}__typename}fragment GiftCardSummaryFragment on Cart{id applied_gift_cards{code applied_balance{value currency __typename}__typename}__typename}fragment GrandTotalFragment on CartPrices{grand_total{currency value __typename}__typename}fragment ShippingSummaryFragment on Cart{id shipping_addresses{selected_shipping_method{amount{currency value __typename}__typename}street __typename}__typename}fragment TaxSummaryFragment on CartPrices{applied_taxes{amount{currency value __typename}__typename}__typename}fragment ShippingInformationFragment on Cart{id email shipping_addresses{city country{code label __typename}firstname lastname postcode region{code label region_id __typename}street telephone __typename}__typename}';
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
