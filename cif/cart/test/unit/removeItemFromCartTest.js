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
const chai = require('chai');
const assert = require('chai').assert;
const expect = require('chai').expect;
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
const resolve = require('../../../cart/src/cartResolver.js').main;
const nock = require('nock');
chai.use(chaiShallowDeepEqual);
const hybrisRemoveItemCart = require('../resources/hybrisRemoveItemCart.json');
const hybrisCartData = require('../resources/hybrisCartQuery.json');
const validResponseRemoveItemCart = require('../resources/validResponseRemoveItemCart');
const hybrisDeliveryModes = require('../resources/hybrisDeliveryModes.json');
const cartNotFound = require('../resources/cartNotFound.json');
const itemNotFound = require('../resources/cartNotFound.json');
const RemoveItemLoader = require('../../src/RemoveItemFromCartLoader');
const TestUtils = require('../../../utils/TestUtils.js');

describe('RemoveItemFromCart', () => {
  const scope = nock(TestUtils.getHybrisInstance());
  let RemoveItem;
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
    RemoveItem = sinon.spy(RemoveItemLoader.prototype, '_removeItemFromCart');
  });

  afterEach(() => {
    RemoveItem.restore();
  });

  describe('Unit Tests', () => {
    //Returns object with hybris url and configuaration data
    let args = TestUtils.getContextData();

    //Returns hybris configured api base path
    const HB_API_BASE_PATH = TestUtils.getYmlData().HB_API_BASE_PATH;

    it('Remove item from cart with valid cartId', () => {
      scope
        .delete(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000035/entries/1`
        )
        .query({ fields: 'DEFAULT', query: '' })
        .reply(200);
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
        itemId: 1,
      };
      args.query =
        'mutation removeItem($cartId:String!$itemId:Int!){removeItemFromCart(input:{cart_id:$cartId cart_item_id:$itemId}){cart{id ...CartPageFragment ...AvailableShippingMethodsCartFragment __typename}__typename}}fragment CartPageFragment on Cart{id total_quantity ...AppliedCouponsFragment ...GiftCardFragment ...ProductListingFragment ...PriceSummaryFragment __typename}fragment AppliedCouponsFragment on Cart{id applied_coupons{code __typename}__typename}fragment GiftCardFragment on Cart{applied_gift_cards{code current_balance{currency value __typename}__typename}id __typename}fragment ProductListingFragment on Cart{id items{id product{id name sku url_key url_suffix thumbnail{url __typename}small_image{url __typename}stock_status ...on ConfigurableProduct{variants{attributes{uid __typename}product{id small_image{url __typename}__typename}__typename}__typename}__typename}prices{price{currency value __typename}__typename}quantity ...on ConfigurableCartItem{configurable_options{id configurable_product_option_value_uid option_label value_id value_label __typename}__typename}__typename}__typename}fragment PriceSummaryFragment on Cart{id items{id quantity __typename}...ShippingSummaryFragment prices{...TaxSummaryFragment ...DiscountSummaryFragment ...GrandTotalFragment subtotal_excluding_tax{currency value __typename}__typename}...GiftCardSummaryFragment __typename}fragment DiscountSummaryFragment on CartPrices{discounts{amount{currency value __typename}label __typename}__typename}fragment GiftCardSummaryFragment on Cart{id applied_gift_cards{code applied_balance{value currency __typename}__typename}__typename}fragment GrandTotalFragment on CartPrices{grand_total{currency value __typename}__typename}fragment ShippingSummaryFragment on Cart{id shipping_addresses{selected_shipping_method{amount{currency value __typename}__typename}street __typename}__typename}fragment TaxSummaryFragment on CartPrices{applied_taxes{amount{currency value __typename}__typename}__typename}fragment AvailableShippingMethodsCartFragment on Cart{id shipping_addresses{available_shipping_methods{amount{currency value __typename}available carrier_code carrier_title method_code method_title __typename}street __typename}__typename}';
      return resolve(args).then(result => {
        let response = result.data.removeItemFromCart.cart;
        const { errors } = result;
        assert.isUndefined(result.errors);
        assert.equal(RemoveItem.callCount, 1);
        expect(errors).to.be.undefined;
        expect(response).to.deep.equals(
          validResponseRemoveItemCart.data.removeItemFromCart.cart
        );
      });
    });

    it('Mutation: validate response should contain cart not found', () => {
      scope
        .delete(
          `${HB_API_BASE_PATH}electronics/users/current/carts/INVALID-CART-ID/entries/1`
        )
        .query({ fields: 'DEFAULT', query: '' })
        .reply(400, cartNotFound);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/users/current/carts/INVALID-CART-ID`
        )
        .query({
          fields: 'DEFAULT',
          access_token: `${TestUtils.getContextData().context.settings.bearer}`,
        })
        .reply(200, hybrisRemoveItemCart);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000035/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);
      args.variables = {
        cartId: 'INVALID-CART-ID',
        itemId: 1,
      };

      args.query =
        'mutation removeItem($cartId:String!$itemId:Int!){removeItemFromCart(input:{cart_id:$cartId cart_item_id:$itemId}){cart{id ...CartPageFragment ...AvailableShippingMethodsCartFragment __typename}__typename}}fragment CartPageFragment on Cart{id total_quantity ...AppliedCouponsFragment ...GiftCardFragment ...ProductListingFragment ...PriceSummaryFragment __typename}fragment AppliedCouponsFragment on Cart{id applied_coupons{code __typename}__typename}fragment GiftCardFragment on Cart{applied_gift_cards{code current_balance{currency value __typename}__typename}id __typename}fragment ProductListingFragment on Cart{id items{id product{id name sku url_key url_suffix thumbnail{url __typename}small_image{url __typename}stock_status ...on ConfigurableProduct{variants{attributes{uid __typename}product{id small_image{url __typename}__typename}__typename}__typename}__typename}prices{price{currency value __typename}__typename}quantity ...on ConfigurableCartItem{configurable_options{id configurable_product_option_value_uid option_label value_id value_label __typename}__typename}__typename}__typename}fragment PriceSummaryFragment on Cart{id items{id quantity __typename}...ShippingSummaryFragment prices{...TaxSummaryFragment ...DiscountSummaryFragment ...GrandTotalFragment subtotal_excluding_tax{currency value __typename}__typename}...GiftCardSummaryFragment __typename}fragment DiscountSummaryFragment on CartPrices{discounts{amount{currency value __typename}label __typename}__typename}fragment GiftCardSummaryFragment on Cart{id applied_gift_cards{code applied_balance{value currency __typename}__typename}__typename}fragment GrandTotalFragment on CartPrices{grand_total{currency value __typename}__typename}fragment ShippingSummaryFragment on Cart{id shipping_addresses{selected_shipping_method{amount{currency value __typename}__typename}street __typename}__typename}fragment TaxSummaryFragment on CartPrices{applied_taxes{amount{currency value __typename}__typename}__typename}fragment AvailableShippingMethodsCartFragment on Cart{id shipping_addresses{available_shipping_methods{amount{currency value __typename}available carrier_code carrier_title method_code method_title __typename}street __typename}__typename}';
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

    it('Mutation: validate response should contain cart not found', () => {
      scope
        .delete(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000035/entries/0`
        )
        .query({ fields: 'DEFAULT', query: '' })
        .reply(400, itemNotFound);
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/carts/00000035`)
        .query({
          fields: 'DEFAULT',
          access_token: `${TestUtils.getContextData().context.settings.bearer}`,
        })
        .reply(200, hybrisRemoveItemCart);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000035/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);
      args.variables = {
        cartId: '00000035',
        itemId: 0,
      };
      args.query =
        'mutation removeItem($cartId:String!$itemId:Int!){removeItemFromCart(input:{cart_id:$cartId cart_item_id:$itemId}){cart{id ...CartPageFragment ...AvailableShippingMethodsCartFragment __typename}__typename}}fragment CartPageFragment on Cart{id total_quantity ...AppliedCouponsFragment ...GiftCardFragment ...ProductListingFragment ...PriceSummaryFragment __typename}fragment AppliedCouponsFragment on Cart{id applied_coupons{code __typename}__typename}fragment GiftCardFragment on Cart{applied_gift_cards{code current_balance{currency value __typename}__typename}id __typename}fragment ProductListingFragment on Cart{id items{id product{id name sku url_key url_suffix thumbnail{url __typename}small_image{url __typename}stock_status ...on ConfigurableProduct{variants{attributes{uid __typename}product{id small_image{url __typename}__typename}__typename}__typename}__typename}prices{price{currency value __typename}__typename}quantity ...on ConfigurableCartItem{configurable_options{id configurable_product_option_value_uid option_label value_id value_label __typename}__typename}__typename}__typename}fragment PriceSummaryFragment on Cart{id items{id quantity __typename}...ShippingSummaryFragment prices{...TaxSummaryFragment ...DiscountSummaryFragment ...GrandTotalFragment subtotal_excluding_tax{currency value __typename}__typename}...GiftCardSummaryFragment __typename}fragment DiscountSummaryFragment on CartPrices{discounts{amount{currency value __typename}label __typename}__typename}fragment GiftCardSummaryFragment on Cart{id applied_gift_cards{code applied_balance{value currency __typename}__typename}__typename}fragment GrandTotalFragment on CartPrices{grand_total{currency value __typename}__typename}fragment ShippingSummaryFragment on Cart{id shipping_addresses{selected_shipping_method{amount{currency value __typename}__typename}street __typename}__typename}fragment TaxSummaryFragment on CartPrices{applied_taxes{amount{currency value __typename}__typename}__typename}fragment AvailableShippingMethodsCartFragment on Cart{id shipping_addresses{available_shipping_methods{amount{currency value __typename}available carrier_code carrier_title method_code method_title __typename}street __typename}__typename}';
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
