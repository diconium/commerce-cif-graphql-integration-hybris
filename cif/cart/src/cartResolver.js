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

const magentoSchema = require('../../resources/magento-schema-2.3.2.min.json');
const { graphql } = require('graphql');
const SchemaBuilder = require('../../common/SchemaBuilder.js');
const Cart = require('./Cart.js');
const SetShippingAddressesOnCart = require('./SetShippingAddressesOnCart.js');
const SetGuestEmailOnCart = require('./SetGuestEmailOnCart.js');
const SetBillingAddressesOnCart = require('./SetBillingAddressesOnCart.js');
const ApplyCouponToCart = require('./ApplyCouponToCart.js');
const CreateEmptyCart = require('./CreateEmptyCart.js');
const VoucherList = require('./VoucherList.js');
const UpdateCartItems = require('./UpdateCartItems.js');
const AddProductToCart = require('./AddProductToCart.js');
const RemoveItemFromCart = require('./RemoveItemFromCart.js');
const SetShippingMethodsOnCart = require('./SetShippingMethodsOnCart.js');

let cachedSchema = null;

function resolve(args) {
  if (cachedSchema == null) {
    let schemaBuilder = new SchemaBuilder(magentoSchema)
      .filterMutationFields(
        new Set([
          'createEmptyCart',
          'applyCouponToCart',
          'setGuestEmailOnCart',
          'setBillingAddressOnCart',
          'setShippingAddressesOnCart',
          'removeCouponFromCart',
          'updateCartItems',
          'addSimpleProductsToCart',
          'removeItemFromCart',
          'setShippingMethodsOnCart',
        ])
      )
      .filterQueryFields(new Set(['cart']));

    cachedSchema = schemaBuilder.build();
  }

  // Builds the resolvers object
  let resolvers = {
    cart: (params, context) => {
      return new Cart({
        cartId: params.cart_id,
        graphqlContext: context,
        actionParameters: args,
      });
    },
    createEmptyCart: () => {
      const createEmptyCartResolver = new CreateEmptyCart({
        actionParameters: args,
      });
      return createEmptyCartResolver.createEmptyCart.then(cart => cart);
    },
    setGuestEmailOnCart: (params, context) => {
      return new SetGuestEmailOnCart({
        cartId: params.input.cart_id,
        guestEmail: params.input.email,
        graphqlContext: context,
        actionParameters: args,
      });
    },
    setBillingAddressOnCart: (params, context) => {
      return new SetBillingAddressesOnCart({
        cartId: params.input.cart_id,
        billingAddress: params.input.billing_address,
        graphqlContext: context,
        actionParameters: args,
      });
    },
    setShippingAddressesOnCart: (params, context) => {
      return new SetShippingAddressesOnCart({
        cartId: params.input.cart_id,
        shippingAddress: params.input.shipping_addresses,
        graphqlContext: context,
        actionParameters: args,
      });
    },
    applyCouponToCart: (params, context) => {
      const { input } = params;
      return new ApplyCouponToCart({
        input,
        couponCode: params.input.coupon_code,
        graphqlContext: context,
        actionParameters: args,
      });
    },
    removeCouponFromCart: (params, context) => {
      const { input } = params;
      return new VoucherList({
        input,
        graphqlContext: context,
        actionParameters: args,
      });
    },

    updateCartItems: (params, context) => {
      const { input } = params;
      return new UpdateCartItems({
        graphqlContext: context,
        actionParameters: args,
        input,
      });
    },
    addSimpleProductsToCart: (params, context) => {
      const { input } = params;
      return new AddProductToCart({
        input,
        graphqlContext: context,
        actionParameters: args,
      });
    },
    removeItemFromCart: (params, context) => {
      const { input } = params;
      return new RemoveItemFromCart({
        input,
        graphqlContext: context,
        actionParameters: args,
      });
    },
    setShippingMethodsOnCart: (params, context) => {
      const { input } = params;
      return new SetShippingMethodsOnCart({
        graphqlContext: context,
        actionParameters: args,
        input,
      });
    },
  };
  // The resolver for this action
  return graphql(
    cachedSchema,
    args.query,
    resolvers,
    args.context,
    args.variables,
    args.operationName
  )
    .then(response => {
      return response;
    })
    .catch(error => {
      console.error(error);
    });
}

module.exports.main = resolve;
