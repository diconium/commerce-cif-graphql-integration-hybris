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

class SetBillingAddressOnCartLoader {
  /**
   * @param {Object} parameters parameter object contains the cartId,billingAddress,graphqlContext & actionParameters
   * @param {Object} parameters.billingAddress parameter contains the billingaddress details
   * @param {Object} [parameters.actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info.
   * @returns {loadingFunction}  -This loader loads each cart one by one, but if the 3rd party backend allows it,
   * it could also fetch all carts in one single request. In this case, the method
   * must still return an Array of carts with the same order as the keys.
   * @param {Array} [cartIds] is an Array of cart ids
   */
  constructor(parameters) {
    this.billingAddressObj = parameters.billingAddress;
    this.actionParameters = parameters.actionParameters;

    const loadingFunction = cartIds => {
      return Promise.resolve(
        cartIds.map(cartId => {
          return this._setBillingAddressOnCart(
            cartId,
            this.billingAddressObj,
            this.actionParameters
          ).catch(error => {
            throw new Error(error.message);
          });
        })
      );
    };
    this.loader = new DataLoader(keys => loadingFunction(keys));
  }

  /**
   * method used to call the loadingFunction using dataloader
   * @param {*} cartId parameter cartId
   * @returns {Promise} a promise return billingAddress after resolved successfully other wise return the error.
   */
  load(cartId) {
    return this.loader.load(cartId);
  }

  /**
   * In a real 3rd-party integration, this method would query the 3rd-party system
   * in order to post billingAddress details based on the cart id. This method returns a Promise,
   * for example to simulate some HTTP REST call being performed to the 3rd-party commerce system.
   * @param {Object} parameters.billingAddress parameter contains the billingaddress details
   * @param {Object} [parameters.actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info.
   * @returns {Promise} a promise with the billingaddress data.
   */
  _setBillingAddressOnCart(cartId, billingAddress, actionParameters) {
    const {
      customerId,
      bearer,
      HB_API_BASE_PATH,
      HB_API_HOST,
      HB_PROTOCOL,
      HB_BASESITEID,
    } = actionParameters.context.settings;

    const setBillingAddressesObj = billingAddress.address;
    const body = {
      companyName: setBillingAddressesObj.company,
      country: {
        isocode: setBillingAddressesObj.country_code,
      },
      firstName: setBillingAddressesObj.firstname,
      lastName: setBillingAddressesObj.lastname,
      line1: setBillingAddressesObj.street[0],
      line2: setBillingAddressesObj.street[1],
      phone: setBillingAddressesObj.telephone,
      postalCode: setBillingAddressesObj.postcode,
      region: {
        countryIso: setBillingAddressesObj.country_code,
        isocode: `${setBillingAddressesObj.country_code}-${setBillingAddressesObj.region}`,
      },
      billingAddress: true,
      town: setBillingAddressesObj.city,
      visibleInAddressBook: setBillingAddressesObj.save_in_address_book,
      defaultAddress: true,
    };
    const config = {
      headers: {
        Authorization: `Bearer ${bearer}`,
      },
    };
    const uri = `${HB_PROTOCOL}://${HB_API_HOST}${HB_API_BASE_PATH}${HB_BASESITEID}/users/${customerId}/addresses?fields=DEFAULT`;
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
}

module.exports = SetBillingAddressOnCartLoader;
