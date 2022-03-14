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
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
chai.use(chaiShallowDeepEqual);
const nock = require('nock');
const assert = require('chai').assert;
const hybrisBillingAddress = require('../resources/hybrisBillingAddress.json');
const cartNotFound = require('../resources/cartNotFound.json');
const invalidRegionCode = require('../resources/invalidRegionCode.json');
const invalidCountryCode = require('../resources/invalidCountryCode.json');
const BillingAddressLoader = require('../../src/SetBillingAddressOnCartLoader');
const TestUtils = require('../../../utils/TestUtils.js');
const hybrisCartData = require('../resources/hybrisCartQuery.json');
const hybrisDeliveryModes = require('../resources/hybrisDeliveryModes.json');

describe('SetBillingAddress OnCart', function() {
  const scope = nock(TestUtils.getHybrisInstance());
  scope.log(console.log);
  let BillingAddress;
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
    BillingAddress = sinon.spy(
      BillingAddressLoader.prototype,
      '_setBillingAddressOnCart'
    );
  });

  afterEach(() => {
    BillingAddress.restore();
  });

  //Returns object with hybris url and configuaration data
  let args = TestUtils.getContextData();

  //Returns hybris configured api base path
  const HB_API_BASE_PATH = TestUtils.getYmlData().HB_API_BASE_PATH;

  it('Mutation: Should successfully post billing address for the cart', () => {
    scope
      .post(`${HB_API_BASE_PATH}electronics/users/current/addresses`)
      .query({ fields: 'DEFAULT' })
      .reply(200, hybrisBillingAddress);
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
      firstname: 'abc',
      lastname: 'Roll',
      street: ['Magento Pkwy', 'Main Street'],
      city: 'Austin',
      regionCode: 'US-WA',
      postcode: '78758',
      countryCode: 'US',
      telephone: '9999998899',
    };
    args.query =
      'mutation setBillingAddress($cartId:String!$firstname:String!$lastname:String!$street:[String]!$city:String!$regionCode:String!$postcode:String!$countryCode:String!$telephone:String!){setBillingAddressOnCart(input:{cart_id:$cartId billing_address:{address:{firstname:$firstname lastname:$lastname street:$street city:$city region:$regionCode postcode:$postcode country_code:$countryCode telephone:$telephone save_in_address_book:false}}}){cart{id billing_address{firstname lastname country{code __typename}street city region{code __typename}postcode telephone __typename}...PriceSummaryFragment ...AvailablePaymentMethodsFragment __typename}__typename}}fragment PriceSummaryFragment on Cart{id items{id quantity __typename}...ShippingSummaryFragment prices{...TaxSummaryFragment ...DiscountSummaryFragment ...GrandTotalFragment subtotal_excluding_tax{currency value __typename}__typename}...GiftCardSummaryFragment __typename}fragment DiscountSummaryFragment on CartPrices{discounts{amount{currency value __typename}label __typename}__typename}fragment GiftCardSummaryFragment on Cart{id applied_gift_cards{code applied_balance{value currency __typename}__typename}__typename}fragment GrandTotalFragment on CartPrices{grand_total{currency value __typename}__typename}fragment ShippingSummaryFragment on Cart{id shipping_addresses{selected_shipping_method{amount{currency value __typename}__typename}street __typename}__typename}fragment TaxSummaryFragment on CartPrices{applied_taxes{amount{currency value __typename}__typename}__typename}fragment AvailablePaymentMethodsFragment on Cart{id available_payment_methods{code title __typename}__typename}';

    return resolve(args).then(result => {
      let setBillingAddressesOnCart = result.data.setBillingAddressOnCart;
      assert.equal(setBillingAddressesOnCart.cart.id, '00000035');
    });
  });

  it('Mutation: validate response should contain cart not found', () => {
    scope
      .post(`${HB_API_BASE_PATH}electronics/users/current/addresses`)
      .query({ fields: 'DEFAULT' })
      .reply(400, cartNotFound);
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
      firstname: 'abc',
      lastname: 'Roll',
      street: ['Magento Pkwy', 'Main Street'],
      city: 'Austin',
      regionCode: 'US-WA',
      postcode: '78758',
      countryCode: 'US',
      telephone: '9999998899',
    };
    args.query =
      'mutation setBillingAddress($cartId:String!$firstname:String!$lastname:String!$street:[String]!$city:String!$regionCode:String!$postcode:String!$countryCode:String!$telephone:String!){setBillingAddressOnCart(input:{cart_id:$cartId billing_address:{address:{firstname:$firstname lastname:$lastname street:$street city:$city region:$regionCode postcode:$postcode country_code:$countryCode telephone:$telephone save_in_address_book:false}}}){cart{id billing_address{firstname lastname country{code __typename}street city region{code __typename}postcode telephone __typename}...PriceSummaryFragment ...AvailablePaymentMethodsFragment __typename}__typename}}fragment PriceSummaryFragment on Cart{id items{id quantity __typename}...ShippingSummaryFragment prices{...TaxSummaryFragment ...DiscountSummaryFragment ...GrandTotalFragment subtotal_excluding_tax{currency value __typename}__typename}...GiftCardSummaryFragment __typename}fragment DiscountSummaryFragment on CartPrices{discounts{amount{currency value __typename}label __typename}__typename}fragment GiftCardSummaryFragment on Cart{id applied_gift_cards{code applied_balance{value currency __typename}__typename}__typename}fragment GrandTotalFragment on CartPrices{grand_total{currency value __typename}__typename}fragment ShippingSummaryFragment on Cart{id shipping_addresses{selected_shipping_method{amount{currency value __typename}__typename}street __typename}__typename}fragment TaxSummaryFragment on CartPrices{applied_taxes{amount{currency value __typename}__typename}__typename}fragment AvailablePaymentMethodsFragment on Cart{id available_payment_methods{code title __typename}__typename}';
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

  it('Mutation: validate response should contain invalid region code found', () => {
    scope
      .post(`${HB_API_BASE_PATH}electronics/users/current/addresses`)
      .query({ fields: 'DEFAULT' })
      .reply(400, invalidRegionCode);
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
      firstname: 'abc',
      lastname: 'Roll',
      street: ['Magento Pkwy', 'Main Street'],
      city: 'Austin',
      regionCode: 'DEFAULT',
      postcode: '78758',
      countryCode: 'US',
      telephone: '9999998899',
    };
    args.query =
      'mutation setBillingAddress($cartId:String!$firstname:String!$lastname:String!$street:[String]!$city:String!$regionCode:String!$postcode:String!$countryCode:String!$telephone:String!){setBillingAddressOnCart(input:{cart_id:$cartId billing_address:{address:{firstname:$firstname lastname:$lastname street:$street city:$city region:$regionCode postcode:$postcode country_code:$countryCode telephone:$telephone save_in_address_book:false}}}){cart{id billing_address{firstname lastname country{code __typename}street city region{code __typename}postcode telephone __typename}...PriceSummaryFragment ...AvailablePaymentMethodsFragment __typename}__typename}}fragment PriceSummaryFragment on Cart{id items{id quantity __typename}...ShippingSummaryFragment prices{...TaxSummaryFragment ...DiscountSummaryFragment ...GrandTotalFragment subtotal_excluding_tax{currency value __typename}__typename}...GiftCardSummaryFragment __typename}fragment DiscountSummaryFragment on CartPrices{discounts{amount{currency value __typename}label __typename}__typename}fragment GiftCardSummaryFragment on Cart{id applied_gift_cards{code applied_balance{value currency __typename}__typename}__typename}fragment GrandTotalFragment on CartPrices{grand_total{currency value __typename}__typename}fragment ShippingSummaryFragment on Cart{id shipping_addresses{selected_shipping_method{amount{currency value __typename}__typename}street __typename}__typename}fragment TaxSummaryFragment on CartPrices{applied_taxes{amount{currency value __typename}__typename}__typename}fragment AvailablePaymentMethodsFragment on Cart{id available_payment_methods{code title __typename}__typename}';
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

  it('Mutation: validate response should contain invalid country code', () => {
    scope
      .post(`${HB_API_BASE_PATH}electronics/users/current/addresses`)
      .query({ fields: 'DEFAULT' })
      .reply(400, invalidCountryCode);
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
      firstname: 'abc',
      lastname: 'Roll',
      street: ['Magento Pkwy', 'Main Street'],
      city: 'Austin',
      regionCode: 'US-WA',
      postcode: '78758',
      countryCode: 'DEFAULT',
      telephone: '9999998899',
    };
    args.query =
      'mutation setBillingAddress($cartId:String!$firstname:String!$lastname:String!$street:[String]!$city:String!$regionCode:String!$postcode:String!$countryCode:String!$telephone:String!){setBillingAddressOnCart(input:{cart_id:$cartId billing_address:{address:{firstname:$firstname lastname:$lastname street:$street city:$city region:$regionCode postcode:$postcode country_code:$countryCode telephone:$telephone save_in_address_book:false}}}){cart{id billing_address{firstname lastname country{code __typename}street city region{code __typename}postcode telephone __typename}...PriceSummaryFragment ...AvailablePaymentMethodsFragment __typename}__typename}}fragment PriceSummaryFragment on Cart{id items{id quantity __typename}...ShippingSummaryFragment prices{...TaxSummaryFragment ...DiscountSummaryFragment ...GrandTotalFragment subtotal_excluding_tax{currency value __typename}__typename}...GiftCardSummaryFragment __typename}fragment DiscountSummaryFragment on CartPrices{discounts{amount{currency value __typename}label __typename}__typename}fragment GiftCardSummaryFragment on Cart{id applied_gift_cards{code applied_balance{value currency __typename}__typename}__typename}fragment GrandTotalFragment on CartPrices{grand_total{currency value __typename}__typename}fragment ShippingSummaryFragment on Cart{id shipping_addresses{selected_shipping_method{amount{currency value __typename}__typename}street __typename}__typename}fragment TaxSummaryFragment on CartPrices{applied_taxes{amount{currency value __typename}__typename}__typename}fragment AvailablePaymentMethodsFragment on Cart{id available_payment_methods{code title __typename}__typename}';
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
