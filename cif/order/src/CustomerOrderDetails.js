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
const CustomerOrderDetailsLoader = require('./CustomerOrderDetailsLoader.js');
const CustomerOrderItemInterface = require('./Interface/CustomerOrderItemInterface.js');

class CustomerOrderDetails {
  /**
   * @param {Object} parameters parameter object contains the graphqlContext & actionParameters
   * @param {Object} [parameters.graphqlContext] The optional GraphQL execution context passed to the resolver.
   * @param {Object} [parameters.actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info.
   * LoaderProxy class returns a Proxy to avoid having to implement a getter for all properties.
   */
  constructor(parameters) {
    this.graphqlContext = parameters.graphqlContext;
    this.actionParameters = parameters.actionParameters;
    this.code = parameters.code;
    this.customerOrderDetailsLoader = new CustomerOrderDetailsLoader({
      code: this.code,
      actionParameters: this.actionParameters,
    });

    return new LoaderProxy(this);
  }

  /**
   * method used to call load method from customerorderDetails loader class
   */
  __load() {
    return this.customerOrderDetailsLoader.load(this.actionParameters);
  }

  /**
   * Converts post order data from the 3rd-party commerce system into the Magento GraphQL format.
   * @param {Object} data parameter data contains order details from hybris
   * @returns {Object} convert the hybris data into magento graphQL schema and return the post order object
   */
  __convertData(data) {
    const { paymentInfo, deliveryAddress } = data;
    return {
      id: data.guid,
      number: data.code,
      order_date: data.created,
      status: data.status,
      invoices: [
        {
          id: data.guid,
        },
      ],
      payment_methods: [
        {
          name: paymentInfo.cardType.name,
          type: paymentInfo.cardType.code,
          additional_data: [],
        },
      ],
      billing_address: paymentInfo &&
        paymentInfo.billingAddress && {
          city: paymentInfo.billingAddress.town,
          country_code: paymentInfo.billingAddress.country.isocode,
          firstname: paymentInfo.billingAddress.firstName,
          lastname: paymentInfo.billingAddress.lastName,
          postcode: paymentInfo.billingAddress.postalCode,
          region: paymentInfo.billingAddress.region.isocode,
          street: [paymentInfo.billingAddress.formattedAddress],
          telephone: deliveryAddress.phone,
        },
      shipping_address: {
        firstname: deliveryAddress.firstName,
        lastname: deliveryAddress.lastName,
        street: [deliveryAddress.formattedAddress],
        city: deliveryAddress.town,
        region: deliveryAddress.region.isocode,
        country_code: deliveryAddress.country.isocode,
        postcode: deliveryAddress.postalCode,
        telephone: deliveryAddress.phone,
      },
      shipping_method: 'Standard Delivery',
      shipments: [],
      total: {
        discounts: [
          {
            amount: {
              currency: data.totalDiscounts.currencyIso,
              value: data.totalDiscounts.value,
            },
          },
        ],
        grand_total: {
          currency: data.totalPrice.currencyIso,
          value: data.totalPrice.value,
        },
        subtotal: {
          currency: data.subTotal.currencyIso,
          value: data.subTotal.value,
        },
        total_shipping: {
          currency: data.deliveryCost.currencyIso,
          value: data.deliveryCost.value,
        },
        total_tax: {
          currency: data.totalPriceWithTax.currencyIso,
          value: data.totalPriceWithTax.value,
        },
      },
    };
  }

  /**
   * items type is interface can't return data directly so created CustomerOrderItem Interface to return Data
   * @returns {*}
   */
  get items() {
    return this.__load().then(data => {
      return data.entries.map(order => {
        const { product, totalPrice } = order;
        return new CustomerOrderItemInterface({
          id: product.code,
          product_name: product.name,
          product_sale_price: {
            currency: totalPrice.currencyIso,
            value: totalPrice.value,
          },
          product_sku: product.code,
          product_url_key: product.url,
          selected_options: [],
          quantity_ordered: order.quantity,
        });
      });
    });
  }
}

module.exports = CustomerOrderDetails;
