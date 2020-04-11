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
const rp = require('request-promise');

class SetPaymentMethodOnCartLoader {
  constructor(actionParameters) {
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

  load(key) {
    return this.loader.load(key);
  }

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

    const body = {
      accountHolderName: 'testuser',
      expiryMonth: '11',
      expiryYear: '2027',
      billingAddress: {
        country: {
          isocode: 'DE',
        },
        email: 'user@example.com',
        firstName: 'test',
        lastName: 'user',
        line1: 'Strasse 11',
        postalCode: '70376',
        shippingAddress: false,
        title: 'mr',
        titleCode: 'mr',
        town: 'stuttgart',
        visibleInAddressBook: true,
      },
      cardNumber: `************1234`,
      cardType: {
        code: code,
      },
    };

    return rp({
      method: 'POST',
      uri: `${HB_PROTOCOL}://${HB_API_HOST}${HB_API_BASE_PATH}${HB_BASESITEID}/users/${customerId}/carts/${cartId}/paymentdetails?fields=DEFAULT&access_token=${bearer}`,
      body: body,
      json: true,
    })
      .then(response => response)
      .catch(err => {
        throw new Error(err.error.errors[0].message);
      });
  }
}

module.exports = SetPaymentMethodOnCartLoader;
