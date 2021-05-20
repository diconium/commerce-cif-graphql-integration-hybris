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

const DataLoader = require('dataloader');
const axios = require('axios');

class SetPaymentMethodOnCartLoader {
  /**
   * @param {Object} [actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info.
   */
  constructor(actionParameters) {
    this.addresses = {};
    let loadingFunction = inputs => {
      return Promise.resolve(
        inputs.map(input => {
          return this._postPaymentMethodOnCart(input, actionParameters).catch(
            error => {
              console.error(
                `Failed loading cart ${JSON.stringify(
                  input
                )}, got error ${JSON.stringify(error, null, 0)}`
              );
              throw new Error(error.message);
            }
          );
        })
      );
    };
    this.loader = new DataLoader(keys => loadingFunction(keys));
  }

  /**
   * method used to call the loadingFunction using dataloader
   * @param {*} input parameter contains the cart_id,payment_method details
   * @returns {Promise} a promise return PaymentMethod after resolved successfully other wise return the error.
   */
  load(key, addresses) {
    this.addresses = addresses;
    return this.loader.load(key);
  }

  /**
   * In a real 3rd-party integration, this method would query the 3rd-party system
   * in order to post PaymentMethod details based on the cart id. This method returns a Promise,
   * for example to simulate some HTTP REST call being performed to the 3rd-party commerce system.
   * @param {Object} parameters.input parameter contains the cart_id and payment_method details
   * @param {Object} [parameters.actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info.
   * @returns {Promise} a promise with the paymentmethod data.
   */
  _postPaymentMethodOnCart(input, actionParameters) {
    const {
      customerId,
      bearer,
      HB_API_BASE_PATH,
      HB_API_HOST,
      HB_PROTOCOL,
      HB_BASESITEID,
    } = actionParameters.context.settings;

    const { cart_id: cartId, payment_method: paymentMethod } = input;
    const { code } = paymentMethod;
    let billingAddress = this.getBillingAddress(this.addresses);
    console.log(billingAddress);

    const body = {
      accountHolderName: 'testuser',
      expiryMonth: '11',
      expiryYear: '2027',
      billingAddress: billingAddress,
      cardNumber: `************1234`,
      cardType: {
        code: code,
      },
    };
    const config = {
      headers: {
        Authorization: `Bearer ${bearer}`,
      },
    };
    const uri = `${HB_PROTOCOL}://${HB_API_HOST}${HB_API_BASE_PATH}${HB_BASESITEID}/users/${customerId}/carts/${cartId}/paymentdetails?fields=DEFAULT`;
    return new Promise((resolve, reject) => {
      axios
        .post(uri, body, config)
        .then(response => {
          if (response.data) {
            resolve(response.data);
          } else {
            reject(response);
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  getBillingAddress(addresses) {
    return addresses.find(address => this.isBillingAddress(address));
  }

  isBillingAddress(address) {
    return address.defaultAddress === true;
  }
}

module.exports = SetPaymentMethodOnCartLoader;
