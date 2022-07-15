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
const ApplyGiftCardToCart = require('./ApplyGiftCardToCart.js');

let cachedSchema = null;
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

function resolve(args) {
  if (cachedSchema == null) {
    const schemaBuilder = new SchemaBuilder()
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
          'addProductsToCart',
          'removeItemFromCart',
          'setShippingMethodsOnCart',
          'mergeCarts',
          'applyGiftCardToCart',
        ])
      )
      .filterQueryFields(new Set(['cart']));

    cachedSchema = schemaBuilder.build();
  }

  const resolvers = {
    cart: (params, context) => {
      return new Cart({
        cartId: params.cart_id,
        graphqlContext: context,
        actionParameters: args,
      });
    },
    /**
     * method used to get the cart
     * @param {Object} params parameter contains input,graphqlContext and actionParameters
     * @param {cachedSchema} context parameter contains the context of the GraphQL Schema
     */
    mergeCarts: (params, context) => {
      return new Cart({
        cartId: params,
        graphqlContext: context,
        actionParameters: args,
      });
    },

    /**
     * method used to createEmptyCart
     * @param {Object} params parameter contains input,graphqlContext and actionParameters
     * @param {cachedSchema} context parameter contains the context of the GraphQL Schema
     */
    createEmptyCart: () => {
      const createEmptyCartResolver = new CreateEmptyCart({
        actionParameters: args,
      });
      return createEmptyCartResolver.createEmptyCart.then(cart => cart);
    },

    /**
     * method used to setGuestEmailOnCart
     * @param {Object} params parameter contains input,graphqlContext and actionParameters
     * @param {cachedSchema} context parameter contains the context of the GraphQL Schema
     */
    setGuestEmailOnCart: (params, context) => {
      return new SetGuestEmailOnCart({
        cartId: params.input.cart_id,
        guestEmail: params.input.email,
        graphqlContext: context,
        actionParameters: args,
      });
    },

    /**
     * method used to setBillingAddressOnCart
     * @param {Object} params parameter contains input,graphqlContext and actionParameters
     * @param {cachedSchema} context parameter contains the context of the GraphQL Schema
     */
    setBillingAddressOnCart: (params, context) => {
      return new SetBillingAddressesOnCart({
        cartId: params.input.cart_id,
        billingAddress: params.input.billing_address,
        graphqlContext: context,
        actionParameters: args,
      });
    },

    /**
     * method used to setShippingAddressesOnCart
     * @param {Object} params parameter contains input,graphqlContext and actionParameters
     * @param {cachedSchema} context parameter contains the context of the GraphQL Schema
     */
    setShippingAddressesOnCart: (params, context) => {
      return new SetShippingAddressesOnCart({
        cartId: params.input.cart_id,
        shippingAddress: params.input.shipping_addresses,
        graphqlContext: context,
        actionParameters: args,
      });
    },

    /**
     * method used to applyCouponToCart
     * @param {Object} params parameter contains input,graphqlContext and actionParameters
     * @param {cachedSchema} context parameter contains the context of the GraphQL Schema
     */
    applyCouponToCart: (params, context) => {
      const { input } = params;
      return new ApplyCouponToCart({
        input,
        couponCode: params.input.coupon_code,
        graphqlContext: context,
        actionParameters: args,
      });
    },

    /**
     * method used to removeCouponFromCart
     * @param {Object} params parameter contains input,graphqlContext and actionParameters
     * @param {cachedSchema} context parameter contains the context of the GraphQL Schema
     */
    removeCouponFromCart: (params, context) => {
      const { input } = params;
      return new VoucherList({
        input,
        graphqlContext: context,
        actionParameters: args,
      });
    },
    /**
     * method used to apply gift Card to cart
     * @param {Object} params parameter contains input,graphqlContext and actionParameters
     * @param {Object} context parameter contains the context of the GraphQL Schema
     */
    applyGiftCardToCart: (params, context) => {
      const { input } = params;
      return new ApplyGiftCardToCart({
        input,
        couponCode: params.input.gift_card_code,
        graphqlContext: context,
        actionParameters: args,
      });
    },

    /**
     * method used to updateCartItems
     * @param {Object} params parameter contains input,graphqlContext and actionParameters
     * @param {cachedSchema} context parameter contains the context of the GraphQL Schema
     */
    updateCartItems: (params, context) => {
      const { input } = params;
      return new UpdateCartItems({
        graphqlContext: context,
        actionParameters: args,
        input,
      });
    },

    /**
     * method used to addSimpleProductsToCart
     * @param {Object} params parameter contains input,graphqlContext and actionParameters
     * @param {cachedSchema} context parameter contains the context of the GraphQL Schema
     */
    addSimpleProductsToCart: (params, context) => {
      const { input } = params;
      return new AddProductToCart({
        input,
        graphqlContext: context,
        actionParameters: args,
      });
    },

    /**
     * method used to addProductsToCart
     * @param {Object} params parameter contains input,graphqlContext and actionParameters
     * @param {cachedSchema} context parameter contains the context of the GraphQL Schema
     */
    addProductsToCart: (params, context) => {
      const input = params;
      return new AddProductToCart({
        input,
        graphqlContext: context,
        actionParameters: args,
      });
    },

    /**
     * method used to removeItemFromCart
     * @param {Object} params parameter contains input,graphqlContext and actionParameters
     * @param {cachedSchema} context parameter contains the context of the GraphQL Schema
     */
    removeItemFromCart: (params, context) => {
      const { input } = params;
      return new RemoveItemFromCart({
        input,
        graphqlContext: context,
        actionParameters: args,
      });
    },

    /**
     * method used to setShippingMethodsOnCart
     * @param {Object} params parameter contains input,graphqlContext and actionParameters
     * @param {cachedSchema} context parameter contains the context of the GraphQL Schema
     */
    setShippingMethodsOnCart: (params, context) => {
      const { input } = params;
      return new SetShippingMethodsOnCart({
        graphqlContext: context,
        actionParameters: args,
        input,
      });
    },
  };

  /**
   * The resolver for this action
   * @param {cachedSchema} cachedSchema parameter contains the catched schema of GraphQL
   * @param {Object} query parameter contains the query of GraphQL
   * @param {cachedSchema} resolvers parameter resolvers of the particular action
   * @param {Object} context parameter contains the context of GraphQL
   * @param {cachedSchema} variables parameter contains the variables of GraphQL
   * @param {Object} operationName parameter contains the operationName of GraphQL context.
   * @returns {Promise} a promise resolves and return the response.
   */
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
