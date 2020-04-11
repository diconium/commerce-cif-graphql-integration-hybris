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

const LoaderProxy = require('../../common/LoaderProxy.js');
const CartLoader = require('./CartLoader.js');
const CartItemInterface = require('./Interface/CartItemInterface.js');

class Cart {
  /**
   * @param {Object} parameters parameter object contains the cartId,couponCode,graphqlContext & actionParameters
   * @param {String} parameters.cartId parameter contain cart Id
   * @param {String} parameters.couponCode parameter contain couponCode
   * @param {Object} [parameters.graphqlContext] The optional GraphQL execution context passed to the resolver.
   * @param {Object} [parameters.actionParameters] Some optional parameters of the I/O Runtime action, like for example authentication info.
   */
  constructor(parameters) {
    this.cartId = parameters.cartId;
    this.graphqlContext = parameters.graphqlContext;
    this.actionParameters = parameters.actionParameters;
    this.cartLoader =
      parameters.cartLoader || new CartLoader(parameters.actionParameters);
    /**
     * This class returns a Proxy to avoid having to implement a getter for all properties.
     */
    return new LoaderProxy(this);
  }

  __load() {
    console.debug(`Loading cart for ${this.cartId}`);
    return this.cartLoader.load(this.cartId);
  }

  /**
   * @param {Object} data parameter data contains the cart entries
   * @returns {Object} The backend cart data converted into a GraphQL "Cart" data.
   */
  __convertData(data) {
    const { paymentInfo, deliveryAddress, user, totalPrice } = data;
    const { appliedVouchers } = data;

    const { items } = new CartItemInterface(data.entries);
    return {
      items,
      email: user && user.uid,
      billing_address: paymentInfo &&
        paymentInfo.billingAddress && {
          city: data.paymentInfo.billingAddress.town,
          country: {
            code: data.paymentInfo.billingAddress.country.isocode,
            label: data.paymentInfo.billingAddress.country.name,
          },
          firstname: data.paymentInfo.billingAddress.firstName,
          lastname: data.paymentInfo.billingAddress.lastName,
          postcode: data.paymentInfo.billingAddress.postalCode,
          region: {
            code: data.paymentInfo.billingAddress.title,
            label: data.paymentInfo.billingAddress.title,
          },
          street: [data.paymentInfo.billingAddress.formattedAddress],
          telephone: data.paymentInfo.billingAddress.phone,
        },
      shipping_addresses: deliveryAddress && [
        {
          firstname: data.deliveryAddress.firstName,
          lastname: data.deliveryAddress.lastName,
          street: [data.deliveryAddress.formattedAddress],
          city: data.deliveryAddress.town,
          region: {
            code: data.deliveryAddress.title,
            label: data.deliveryAddress.title,
          },
          country: {
            code: data.deliveryAddress.country.isocode,
            label: data.deliveryAddress.country.name,
          },
          telephone: data.deliveryAddress.phone,
          available_shipping_methods: [
            {
              amount: {
                currency: data.deliveryMode.deliveryCost.currencyIso,
                value: data.deliveryMode.deliveryCost.value,
              },
              available: data.deliveryAddress.shippingAddress,
              carrier_code: data.deliveryMode.code,
              carrier_title: data.deliveryMode.description,
              error_message: '',
              method_code: data.deliveryMode.code,
              method_title: data.deliveryMode.name,
              price_excl_tax: {
                value: data.deliveryMode.deliveryCost.value,
                currency: data.deliveryMode.deliveryCost.currencyIso,
              },
              price_incl_tax: {
                value: data.deliveryMode.deliveryCost.value,
                currency: data.deliveryMode.deliveryCost.currencyIso,
              },
            },
          ],
          selected_shipping_method: {
            amount: {
              value: data.deliveryMode.deliveryCost.value,
              currency: data.deliveryMode.deliveryCost.currencyIso,
            },
            carrier_code: data.deliveryMode.code,
            carrier_title: data.deliveryMode.description,
            method_code: data.deliveryMode.code,
            method_title: data.deliveryMode.name,
          },
        },
      ],
      available_payment_methods: [
        {
          code:
            paymentInfo && paymentInfo.cardType && paymentInfo.cardType.code,
          title:
            paymentInfo && paymentInfo.cardType && paymentInfo.cardType.name,
        },
      ],
      selected_payment_method: {
        code: paymentInfo && paymentInfo.cardType && paymentInfo.cardType.code,
        title: paymentInfo && paymentInfo.cardType && paymentInfo.cardType.code,
      },
      applied_coupon: {
        code:
          (appliedVouchers &&
            appliedVouchers.length > 0 &&
            appliedVouchers[0].code) ||
          '',
      },
      prices: {
        grand_total: {
          value: totalPrice && data.totalPrice.value,
          currency: totalPrice && data.totalPrice.currencyIso,
        },
      },
    };
  }
}

module.exports = Cart;
