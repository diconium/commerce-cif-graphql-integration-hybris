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
const ShippingMethodsLoader = require('./ShippingMethodsLoader.js');

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
    this.shippingMethodsLoader = new ShippingMethodsLoader(
      parameters.actionParameters
    );
    /**
     * This class returns a Proxy to avoid having to implement a getter for all properties.
     */
    return new LoaderProxy(this);
  }

  /**
   * @returns {Promise<T>}
   * @private
   */
  __load() {
    console.debug(`Loading cart for ${this.cartId}`);
    return this.cartLoader.load(this.cartId).then(data => {
      return this.shippingMethodsLoader.load(this.cartId).then(result => {
        data.deliveryModes = result.deliveryModes;
        return data;
      });
    });
  }

  /**
   * @param address
   * @returns {*|string}
   */
  getRegionCode(address) {
    let code = address !== undefined ? address.region.isocode.split('-') : '';
    if (code !== '') {
      code = code.length === 2 ? code[1] : code[0];
    } else {
      code = '';
    }
    return code;
  }

  /**
   * @param deliveryModes
   * @returns {[]}
   */
  getShippingMethods(deliveryModes) {
    const shippingMethods = [];
    deliveryModes.map(shippingMethod => {
      if (shippingMethod.code !== 'pickup') {
        shippingMethods.push({
          amount: {
            currency: shippingMethod.deliveryCost.currencyIso,
            value: shippingMethod.deliveryCost.value,
          },
          available: true,
          carrier_code: shippingMethod.code,
          carrier_title: shippingMethod.description
            ? shippingMethod.description
            : shippingMethod.code,
          error_message: '',
          method_code: shippingMethod.code,
          method_title: shippingMethod.name,
          price_excl_tax: {
            value: shippingMethod.deliveryCost.value,
            currency: shippingMethod.deliveryCost.currencyIso,
          },
          price_incl_tax: {
            value: shippingMethod.deliveryCost.value,
            currency: shippingMethod.deliveryCost.currencyIso,
          },
        });
      }
    });
    return shippingMethods;
  }
  /**
   * @param {Object} data parameter data contains the cart entries
   * @returns {Object} The backend cart data converted into a GraphQL "Cart" data.
   */
  __convertData(data) {
    const {
      paymentInfo,
      deliveryAddress,
      user,
      totalPrice,
      totalDiscounts,
      totalPriceWithTax,
      totalTax,
      deliveryModes,
      deliveryMode,
    } = data;
    const regionCode = this.getRegionCode(deliveryAddress);
    const billingRegionCode =
      paymentInfo !== undefined
        ? this.getRegionCode(paymentInfo.billingAddress)
        : '';
    const availableShippingMethods =
      deliveryModes !== undefined ? this.getShippingMethods(deliveryModes) : [];
    const { appliedVouchers } = data;
    const { items } = new CartItemInterface(data.entries);
    return {
      items: items,
      email: user && user.uid,
      is_virtual: false,
      total_quantity: data.totalUnitCount,
      billing_address: paymentInfo &&
        paymentInfo.billingAddress && {
          email: data.paymentInfo.billingAddress.email,
          city: data.paymentInfo.billingAddress.town,
          country: {
            code: data.paymentInfo.billingAddress.country.isocode,
            label: data.paymentInfo.billingAddress.country.name,
          },
          firstname: data.paymentInfo.billingAddress.firstName,
          lastname: data.paymentInfo.billingAddress.lastName,
          postcode: data.paymentInfo.billingAddress.postalCode,
          region: {
            code: billingRegionCode,
            label: data.paymentInfo.billingAddress.region.name,
          },
          street: [data.paymentInfo.billingAddress.formattedAddress],
          telephone: data.paymentInfo.billingAddress.phone
            ? data.paymentInfo.billingAddress.phone
            : '',
        },
      shipping_addresses:
        deliveryAddress !== undefined
          ? [
              {
                email: user && user.uid,
                firstname: data.deliveryAddress.firstName,
                lastname: data.deliveryAddress.lastName,
                street: [data.deliveryAddress.formattedAddress],
                city: data.deliveryAddress.town,
                region: {
                  code: regionCode,
                  label: data.deliveryAddress.region.name,
                },
                country: {
                  code: data.deliveryAddress.country.isocode,
                  label: data.deliveryAddress.country.name,
                },
                postcode: data.deliveryAddress.postalCode,
                telephone: data.deliveryAddress.phone,
                available_shipping_methods:
                  deliveryModes && availableShippingMethods,
                selected_shipping_method: deliveryMode && {
                  amount: {
                    value: data.deliveryMode.deliveryCost.value,
                    currency: data.deliveryMode.deliveryCost.currencyIso,
                  },
                  carrier_code: data.deliveryMode.code,
                  carrier_title: data.deliveryMode.description
                    ? data.deliveryMode.description
                    : data.deliveryMode.code,
                  method_code: data.deliveryMode.code,
                  method_title: data.deliveryMode.name,
                },
              },
            ]
          : [],
      available_payment_methods: [
        {
          code:
            paymentInfo && paymentInfo.cardType && paymentInfo.cardType.code
              ? paymentInfo.cardType.code
              : 'visa',
          title:
            paymentInfo && paymentInfo.cardType && paymentInfo.cardType.name
              ? paymentInfo.cardType.name
              : 'Credit Card',
        },
      ],
      selected_payment_method: {
        code:
          paymentInfo && paymentInfo.cardType && paymentInfo.cardType.code
            ? paymentInfo.cardType.code
            : '',
        title:
          paymentInfo && paymentInfo.cardType && paymentInfo.cardType.code
            ? paymentInfo.cardType.code
            : '',
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
        discounts: [
          {
            amount: {
              currency:
                totalDiscounts === undefined
                  ? ''
                  : data.totalDiscounts.currencyIso,
              value:
                totalDiscounts === undefined ? '' : data.totalDiscounts.value,
            },
            label: '',
          },
        ],
        subtotal_with_discount_excluding_tax: {
          currency: totalPrice === undefined ? '' : data.totalPrice.currencyIso,
          value:
            totalPriceWithTax === undefined && totalTax === undefined
              ? ''
              : totalTax === undefined
              ? totalPriceWithTax.value
              : totalPriceWithTax === undefined
              ? ''
              : totalPriceWithTax.value - totalTax.value,
        },
        subtotal_excluding_tax: {
          currency: totalPrice === undefined ? '' : data.totalPrice.currencyIso,
          value:
            totalPriceWithTax === undefined && totalTax === undefined
              ? ''
              : totalTax === undefined
              ? totalPriceWithTax.value
              : totalPriceWithTax.value - totalTax.value,
        },
      },
    };
  }
}

module.exports = Cart;
