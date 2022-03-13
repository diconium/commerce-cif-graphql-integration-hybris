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
const chai = require('chai');
const { expect } = chai;
const nock = require('nock');
const assert = require('chai').assert;
const hybrisGetCustomerAddress = require('../../../customer/test/resources/hybrisGetCustomerAddress.json');
const hybrisShippingAddress = require('../resources/hybrisShippingAddress.json');
const hybrisDeliveryModes = require('../resources/hybrisDeliveryModes.json');
const validResponseSetShippingAddress = require('../resources/validResponseSetShippingAddress.json');
const cartNotFound = require('../resources/cartNotFound.json');
const invalidRegionCode = require('../resources/invalidRegionCode.json');
const invalidCountryCode = require('../resources/invalidCountryCode.json');
const validResponseInvalidMesasageCode = require('../resources/validResponseInvalidMessageCode.json');
const TestUtils = require('../../../utils/TestUtils.js');
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
chai.use(chaiShallowDeepEqual);
const ShippingAddressLoader = require('../../src/SetShippingAddressOnCartLoader');
const hybrisCartData = require('../resources/hybrisCartQuery.json');

describe('SetShippingAddress OnCart', function() {
  const scope = nock(TestUtils.getHybrisInstance());
  let ShippingAddress;
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
    ShippingAddress = sinon.spy(
      ShippingAddressLoader.prototype,
      '_setShippingAddressOnCart'
    );
  });

  afterEach(() => {
    ShippingAddress.restore();
  });

  describe('Validation', () => {
    //Returns object with hybris url and configuaration data
    let args = TestUtils.getContextData();

    //Returns hybris configured api base path
    const HB_API_BASE_PATH = TestUtils.getYmlData().HB_API_BASE_PATH;

    it('Mutation: Should successfully post shipping address for the cart', () => {
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/addresses`)
        .query({ fields: 'DEFAULT', query: '' })
        .reply(200, hybrisGetCustomerAddress);
      scope
        .post(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000035/addresses/delivery`
        )
        .query({
          fields: 'DEFAULT',
          access_token: `${TestUtils.getContextData().context.settings.bearer}`,
        })
        .reply(200, hybrisShippingAddress);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000035/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/carts/00000035`)
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisCartData);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000035/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);
      args.variables = {
        cartId: '00000035',
        addressId: 0,
      };
      args.query =
        'mutation SetCustomerAddressOnCart($cartId:String!$addressId:Int!){setShippingAddressesOnCart(input:{cart_id:$cartId shipping_addresses:[{customer_address_id:$addressId}]}){cart{id ...ShippingInformationFragment ...ShippingMethodsCheckoutFragment ...PriceSummaryFragment ...AvailablePaymentMethodsFragment __typename}__typename}}fragment ShippingInformationFragment on Cart{id email shipping_addresses{city country{code label __typename}firstname lastname postcode region{code label region_id __typename}street telephone __typename}__typename}fragment ShippingMethodsCheckoutFragment on Cart{id ...AvailableShippingMethodsCheckoutFragment ...SelectedShippingMethodCheckoutFragment shipping_addresses{country{code __typename}postcode region{code __typename}street __typename}__typename}fragment AvailableShippingMethodsCheckoutFragment on Cart{id shipping_addresses{available_shipping_methods{amount{currency value __typename}available carrier_code carrier_title method_code method_title __typename}street __typename}__typename}fragment SelectedShippingMethodCheckoutFragment on Cart{id shipping_addresses{selected_shipping_method{amount{currency value __typename}carrier_code method_code method_title __typename}street __typename}__typename}fragment PriceSummaryFragment on Cart{id items{id quantity __typename}...ShippingSummaryFragment prices{...TaxSummaryFragment ...DiscountSummaryFragment ...GrandTotalFragment subtotal_excluding_tax{currency value __typename}__typename}...GiftCardSummaryFragment __typename}fragment DiscountSummaryFragment on CartPrices{discounts{amount{currency value __typename}label __typename}__typename}fragment GiftCardSummaryFragment on Cart{id applied_gift_cards{code applied_balance{value currency __typename}__typename}__typename}fragment GrandTotalFragment on CartPrices{grand_total{currency value __typename}__typename}fragment ShippingSummaryFragment on Cart{id shipping_addresses{selected_shipping_method{amount{currency value __typename}__typename}street __typename}__typename}fragment TaxSummaryFragment on CartPrices{applied_taxes{amount{currency value __typename}__typename}__typename}fragment AvailablePaymentMethodsFragment on Cart{id available_payment_methods{code title __typename}__typename}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        let setShippingAddressesOnCart = result.data.setShippingAddressesOnCart;
        expect(setShippingAddressesOnCart).to.deep.equals(
          validResponseSetShippingAddress.data.setShippingAddressesOnCart
        );
      });
    });

    it('Mutation: validate response should contain cart not found', () => {
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/addresses`)
        .query({ fields: 'DEFAULT', query: '' })
        .reply(200, hybrisGetCustomerAddress);
      scope
        .post(
          `${HB_API_BASE_PATH}electronics/users/current/carts/INVALID-CART-ID/addresses/delivery`
        )
        .query({
          fields: 'DEFAULT',
          access_token: `${TestUtils.getContextData().context.settings.bearer}`,
        })
        .reply(400, cartNotFound);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/users/current/carts/INVALID-CART-ID/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/users/current/carts/INVALID-CART-ID`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisCartData);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/users/current/carts/INVALID-CART-ID/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);

      args.variables = {
        cartId: 'INVALID-CART-ID',
        addressId: 0,
      };
      args.query =
        'mutation SetCustomerAddressOnCart($cartId:String!$addressId:Int!){setShippingAddressesOnCart(input:{cart_id:$cartId shipping_addresses:[{customer_address_id:$addressId}]}){cart{id ...ShippingInformationFragment ...ShippingMethodsCheckoutFragment ...PriceSummaryFragment ...AvailablePaymentMethodsFragment __typename}__typename}}fragment ShippingInformationFragment on Cart{id email shipping_addresses{city country{code label __typename}firstname lastname postcode region{code label region_id __typename}street telephone __typename}__typename}fragment ShippingMethodsCheckoutFragment on Cart{id ...AvailableShippingMethodsCheckoutFragment ...SelectedShippingMethodCheckoutFragment shipping_addresses{country{code __typename}postcode region{code __typename}street __typename}__typename}fragment AvailableShippingMethodsCheckoutFragment on Cart{id shipping_addresses{available_shipping_methods{amount{currency value __typename}available carrier_code carrier_title method_code method_title __typename}street __typename}__typename}fragment SelectedShippingMethodCheckoutFragment on Cart{id shipping_addresses{selected_shipping_method{amount{currency value __typename}carrier_code method_code method_title __typename}street __typename}__typename}fragment PriceSummaryFragment on Cart{id items{id quantity __typename}...ShippingSummaryFragment prices{...TaxSummaryFragment ...DiscountSummaryFragment ...GrandTotalFragment subtotal_excluding_tax{currency value __typename}__typename}...GiftCardSummaryFragment __typename}fragment DiscountSummaryFragment on CartPrices{discounts{amount{currency value __typename}label __typename}__typename}fragment GiftCardSummaryFragment on Cart{id applied_gift_cards{code applied_balance{value currency __typename}__typename}__typename}fragment GrandTotalFragment on CartPrices{grand_total{currency value __typename}__typename}fragment ShippingSummaryFragment on Cart{id shipping_addresses{selected_shipping_method{amount{currency value __typename}__typename}street __typename}__typename}fragment TaxSummaryFragment on CartPrices{applied_taxes{amount{currency value __typename}__typename}__typename}fragment AvailablePaymentMethodsFragment on Cart{id available_payment_methods{code title __typename}__typename}';
      return resolve(args).then(result => {
        const errors = result.errors[0].message;
        expect(errors).to.deep.equals(validResponseInvalidMesasageCode);
      });
    });

    it('Mutation: validate response should contain invalid region code found', () => {
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/addresses`)
        .query({ fields: 'DEFAULT', query: '' })
        .reply(200, hybrisGetCustomerAddress);
      scope
        .post(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000016/addresses/delivery`
        )
        .query({
          fields: 'DEFAULT',
          access_token: `${TestUtils.getContextData().context.settings.bearer}`,
        })
        .reply(400, invalidRegionCode);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000016/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/carts/00000016`)
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisCartData);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000016/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);

      args.variables = {
        cartId: '00000016',
        addressId: 0,
      };
      args.query =
        'mutation SetCustomerAddressOnCart($cartId:String!$addressId:Int!){setShippingAddressesOnCart(input:{cart_id:$cartId shipping_addresses:[{customer_address_id:$addressId}]}){cart{id ...ShippingInformationFragment ...ShippingMethodsCheckoutFragment ...PriceSummaryFragment ...AvailablePaymentMethodsFragment __typename}__typename}}fragment ShippingInformationFragment on Cart{id email shipping_addresses{city country{code label __typename}firstname lastname postcode region{code label region_id __typename}street telephone __typename}__typename}fragment ShippingMethodsCheckoutFragment on Cart{id ...AvailableShippingMethodsCheckoutFragment ...SelectedShippingMethodCheckoutFragment shipping_addresses{country{code __typename}postcode region{code __typename}street __typename}__typename}fragment AvailableShippingMethodsCheckoutFragment on Cart{id shipping_addresses{available_shipping_methods{amount{currency value __typename}available carrier_code carrier_title method_code method_title __typename}street __typename}__typename}fragment SelectedShippingMethodCheckoutFragment on Cart{id shipping_addresses{selected_shipping_method{amount{currency value __typename}carrier_code method_code method_title __typename}street __typename}__typename}fragment PriceSummaryFragment on Cart{id items{id quantity __typename}...ShippingSummaryFragment prices{...TaxSummaryFragment ...DiscountSummaryFragment ...GrandTotalFragment subtotal_excluding_tax{currency value __typename}__typename}...GiftCardSummaryFragment __typename}fragment DiscountSummaryFragment on CartPrices{discounts{amount{currency value __typename}label __typename}__typename}fragment GiftCardSummaryFragment on Cart{id applied_gift_cards{code applied_balance{value currency __typename}__typename}__typename}fragment GrandTotalFragment on CartPrices{grand_total{currency value __typename}__typename}fragment ShippingSummaryFragment on Cart{id shipping_addresses{selected_shipping_method{amount{currency value __typename}__typename}street __typename}__typename}fragment TaxSummaryFragment on CartPrices{applied_taxes{amount{currency value __typename}__typename}__typename}fragment AvailablePaymentMethodsFragment on Cart{id available_payment_methods{code title __typename}__typename}';
      return resolve(args).then(result => {
        const errors = result.errors[0].message;
        expect(errors).to.deep.equals(validResponseInvalidMesasageCode);
      });
    });

    it('Mutation: validate response should contain invalid country code', () => {
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/addresses`)
        .query({ fields: 'DEFAULT', query: '' })
        .reply(200, hybrisGetCustomerAddress);
      scope
        .post(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000016/addresses/delivery`
        )
        .query({
          fields: 'DEFAULT',
          access_token: `${TestUtils.getContextData().context.settings.bearer}`,
        })
        .reply(400, invalidCountryCode);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000016/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/carts/00000016`)
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisCartData);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000016/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);

      args.variables = {
        cartId: '00000016',
        addressId: 0,
      };
      args.query =
        'mutation SetCustomerAddressOnCart($cartId:String!$addressId:Int!){setShippingAddressesOnCart(input:{cart_id:$cartId shipping_addresses:[{customer_address_id:$addressId}]}){cart{id ...ShippingInformationFragment ...ShippingMethodsCheckoutFragment ...PriceSummaryFragment ...AvailablePaymentMethodsFragment __typename}__typename}}fragment ShippingInformationFragment on Cart{id email shipping_addresses{city country{code label __typename}firstname lastname postcode region{code label region_id __typename}street telephone __typename}__typename}fragment ShippingMethodsCheckoutFragment on Cart{id ...AvailableShippingMethodsCheckoutFragment ...SelectedShippingMethodCheckoutFragment shipping_addresses{country{code __typename}postcode region{code __typename}street __typename}__typename}fragment AvailableShippingMethodsCheckoutFragment on Cart{id shipping_addresses{available_shipping_methods{amount{currency value __typename}available carrier_code carrier_title method_code method_title __typename}street __typename}__typename}fragment SelectedShippingMethodCheckoutFragment on Cart{id shipping_addresses{selected_shipping_method{amount{currency value __typename}carrier_code method_code method_title __typename}street __typename}__typename}fragment PriceSummaryFragment on Cart{id items{id quantity __typename}...ShippingSummaryFragment prices{...TaxSummaryFragment ...DiscountSummaryFragment ...GrandTotalFragment subtotal_excluding_tax{currency value __typename}__typename}...GiftCardSummaryFragment __typename}fragment DiscountSummaryFragment on CartPrices{discounts{amount{currency value __typename}label __typename}__typename}fragment GiftCardSummaryFragment on Cart{id applied_gift_cards{code applied_balance{value currency __typename}__typename}__typename}fragment GrandTotalFragment on CartPrices{grand_total{currency value __typename}__typename}fragment ShippingSummaryFragment on Cart{id shipping_addresses{selected_shipping_method{amount{currency value __typename}__typename}street __typename}__typename}fragment TaxSummaryFragment on CartPrices{applied_taxes{amount{currency value __typename}__typename}__typename}fragment AvailablePaymentMethodsFragment on Cart{id available_payment_methods{code title __typename}__typename}';
      return resolve(args).then(result => {
        const errors = result.errors[0].message;
        expect(errors).to.deep.equals(validResponseInvalidMesasageCode);
      });
    });
  });
});
