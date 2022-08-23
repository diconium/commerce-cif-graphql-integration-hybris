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

const TestUtils = require('../../../utils/TestUtils.js');
const hybrisUpdateCartItems = require('../resources/hybrisUpdateCartItems');
const validUpdateCartItems = require('../resources/validUpdateCartItems');
const cartNotFound = require('../resources/cartNotFound');
const entryNotFoundUpdateCartItems = require('../resources/entryNotFoundUpdateCartItems');
const UpdateCartLoader = require('../../src/UpdateCartItemsLoader');
const hybrisCartData = require('../resources/hybrisCartQuery.json');
const hybrisDeliveryModes = require('../resources/hybrisDeliveryModes.json');

chai.use(chaiShallowDeepEqual);

describe('Update Cart Items Resolver', () => {
  const scope = nock(TestUtils.getHybrisInstance());
  let UpdateCart;
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
    UpdateCart = sinon.spy(UpdateCartLoader.prototype, '_updateMethod');
  });

  afterEach(() => {
    UpdateCart.restore();
  });

  describe('Unit Tests', () => {
    //Returns object with hybris url and configuaration data
    let args = TestUtils.getContextData();

    //Returns hybris configured api base path
    const HB_API_BASE_PATH = TestUtils.getYmlData().HB_API_BASE_PATH;

    it('Update cart items unit test case', () => {
      scope
        .patch(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000016/entries/0`
        )
        .query({ fields: 'FULL' })
        .reply(200, hybrisUpdateCartItems);
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
        itemId: 0,
        quantity: 3,
      };
      args.query =
        'mutation updateItemQuantity($cartId:String!$itemId:Int!$quantity:Float!){updateCartItems(input:{cart_id:$cartId cart_items:[{cart_item_id:$itemId quantity:$quantity}]}){cart{id ...CartPageFragment ...AvailableShippingMethodsCartFragment __typename}__typename}}fragment CartPageFragment on Cart{id total_quantity ...AppliedCouponsFragment ...GiftCardFragment ...ProductListingFragment ...PriceSummaryFragment __typename}fragment AppliedCouponsFragment on Cart{id applied_coupons{code __typename}__typename}fragment GiftCardFragment on Cart{applied_gift_cards{code current_balance{currency value __typename}__typename}id __typename}fragment ProductListingFragment on Cart{id items{id product{id name sku url_key url_suffix thumbnail{url __typename}small_image{url __typename}stock_status ...on ConfigurableProduct{variants{attributes{uid __typename}product{id small_image{url __typename}__typename}__typename}__typename}__typename}prices{price{currency value __typename}__typename}quantity ...on ConfigurableCartItem{configurable_options{id configurable_product_option_value_uid option_label value_id value_label __typename}__typename}__typename}__typename}fragment PriceSummaryFragment on Cart{id items{id quantity __typename}...ShippingSummaryFragment prices{...TaxSummaryFragment ...DiscountSummaryFragment ...GrandTotalFragment subtotal_excluding_tax{currency value __typename}__typename}...GiftCardSummaryFragment __typename}fragment DiscountSummaryFragment on CartPrices{discounts{amount{currency value __typename}label __typename}__typename}fragment GiftCardSummaryFragment on Cart{id applied_gift_cards{code applied_balance{value currency __typename}__typename}__typename}fragment GrandTotalFragment on CartPrices{grand_total{currency value __typename}__typename}fragment ShippingSummaryFragment on Cart{id shipping_addresses{selected_shipping_method{amount{currency value __typename}__typename}street __typename}__typename}fragment TaxSummaryFragment on CartPrices{applied_taxes{amount{currency value __typename}__typename}__typename}fragment AvailableShippingMethodsCartFragment on Cart{id shipping_addresses{available_shipping_methods{amount{currency value __typename}available carrier_code carrier_title method_code method_title __typename}street __typename}__typename}';
      return resolve(args).then(result => {
        let response = result.data.updateCartItems.cart;
        const { errors } = result;
        assert.isUndefined(result.errors);
        expect(errors).to.be.undefined;
        assert.equal(UpdateCart.callCount, 1);
        expect(response).to.deep.equals(
          validUpdateCartItems.data.updateCartItems.cart
        );
      });
    });

    it('Mutation: Cart not found', () => {
      scope
        .patch(
          `${HB_API_BASE_PATH}electronics/users/current/carts/INVALID-CART-ID/entries/0`
        )
        .query({ fields: 'FULL' })
        .reply(400, cartNotFound);
      args.variables = {
        cartId: 'INVALID-CART-ID',
        itemId: 0,
        quantity: 3,
      };
      args.query =
        'mutation updateItemQuantity($cartId:String!$itemId:Int!$quantity:Float!){updateCartItems(input:{cart_id:$cartId cart_items:[{cart_item_id:$itemId quantity:$quantity}]}){cart{id ...CartPageFragment ...AvailableShippingMethodsCartFragment __typename}__typename}}fragment CartPageFragment on Cart{id total_quantity ...AppliedCouponsFragment ...GiftCardFragment ...ProductListingFragment ...PriceSummaryFragment __typename}fragment AppliedCouponsFragment on Cart{id applied_coupons{code __typename}__typename}fragment GiftCardFragment on Cart{applied_gift_cards{code current_balance{currency value __typename}__typename}id __typename}fragment ProductListingFragment on Cart{id items{id product{id name sku url_key url_suffix thumbnail{url __typename}small_image{url __typename}stock_status ...on ConfigurableProduct{variants{attributes{uid __typename}product{id small_image{url __typename}__typename}__typename}__typename}__typename}prices{price{currency value __typename}__typename}quantity ...on ConfigurableCartItem{configurable_options{id configurable_product_option_value_uid option_label value_id value_label __typename}__typename}__typename}__typename}fragment PriceSummaryFragment on Cart{id items{id quantity __typename}...ShippingSummaryFragment prices{...TaxSummaryFragment ...DiscountSummaryFragment ...GrandTotalFragment subtotal_excluding_tax{currency value __typename}__typename}...GiftCardSummaryFragment __typename}fragment DiscountSummaryFragment on CartPrices{discounts{amount{currency value __typename}label __typename}__typename}fragment GiftCardSummaryFragment on Cart{id applied_gift_cards{code applied_balance{value currency __typename}__typename}__typename}fragment GrandTotalFragment on CartPrices{grand_total{currency value __typename}__typename}fragment ShippingSummaryFragment on Cart{id shipping_addresses{selected_shipping_method{amount{currency value __typename}__typename}street __typename}__typename}fragment TaxSummaryFragment on CartPrices{applied_taxes{amount{currency value __typename}__typename}__typename}fragment AvailableShippingMethodsCartFragment on Cart{id shipping_addresses{available_shipping_methods{amount{currency value __typename}available carrier_code carrier_title method_code method_title __typename}street __typename}__typename}';
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

    it('Mutation: Entry not found', () => {
      scope
        .patch(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000016/entries/10`
        )
        .query({ fields: 'FULL' })
        .reply(400, entryNotFoundUpdateCartItems);
      args.variables = {
        cartId: '00000016',
        itemId: 10,
        quantity: 3,
      };
      args.query =
        'mutation updateItemQuantity($cartId:String!$itemId:Int!$quantity:Float!){updateCartItems(input:{cart_id:$cartId cart_items:[{cart_item_id:$itemId quantity:$quantity}]}){cart{id ...CartPageFragment ...AvailableShippingMethodsCartFragment __typename}__typename}}fragment CartPageFragment on Cart{id total_quantity ...AppliedCouponsFragment ...GiftCardFragment ...ProductListingFragment ...PriceSummaryFragment __typename}fragment AppliedCouponsFragment on Cart{id applied_coupons{code __typename}__typename}fragment GiftCardFragment on Cart{applied_gift_cards{code current_balance{currency value __typename}__typename}id __typename}fragment ProductListingFragment on Cart{id items{id product{id name sku url_key url_suffix thumbnail{url __typename}small_image{url __typename}stock_status ...on ConfigurableProduct{variants{attributes{uid __typename}product{id small_image{url __typename}__typename}__typename}__typename}__typename}prices{price{currency value __typename}__typename}quantity ...on ConfigurableCartItem{configurable_options{id configurable_product_option_value_uid option_label value_id value_label __typename}__typename}__typename}__typename}fragment PriceSummaryFragment on Cart{id items{id quantity __typename}...ShippingSummaryFragment prices{...TaxSummaryFragment ...DiscountSummaryFragment ...GrandTotalFragment subtotal_excluding_tax{currency value __typename}__typename}...GiftCardSummaryFragment __typename}fragment DiscountSummaryFragment on CartPrices{discounts{amount{currency value __typename}label __typename}__typename}fragment GiftCardSummaryFragment on Cart{id applied_gift_cards{code applied_balance{value currency __typename}__typename}__typename}fragment GrandTotalFragment on CartPrices{grand_total{currency value __typename}__typename}fragment ShippingSummaryFragment on Cart{id shipping_addresses{selected_shipping_method{amount{currency value __typename}__typename}street __typename}__typename}fragment TaxSummaryFragment on CartPrices{applied_taxes{amount{currency value __typename}__typename}__typename}fragment AvailableShippingMethodsCartFragment on Cart{id shipping_addresses{available_shipping_methods{amount{currency value __typename}available carrier_code carrier_title method_code method_title __typename}street __typename}__typename}';
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
