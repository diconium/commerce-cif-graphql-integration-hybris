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
const SetBillingAddressOnCartLoader = require('./SetBillingAddressOnCartLoader.js');

class SetBillingAddressesOnCart {
  /**
   * @param {Object} parameters parameter object contains the cartId,billingAddress,graphqlContext & actionParameters
   * @param {String} parameters.cartId parameter contains the cartId
   * @param {Object} parameters.billingAddress parameter contains the billingaddress details
   * @param {Object} [parameters.graphqlContext] The optional GraphQL execution context passed to the resolver.
   * @param {Object} [parameters.actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info.
   */
  constructor(parameters) {
    this.cartId = parameters.cartId;
    this.billingAddress = parameters.billingAddress;
    this.graphqlContext = parameters.graphqlContext;
    this.actionParameters = parameters.actionParameters;
    this.setBillingAddressOnCartLoader = new SetBillingAddressOnCartLoader(
      parameters
    );
    /**
     * This class returns a Proxy to avoid having to implement a getter for all properties.
     */
    return new LoaderProxy(this);
  }

  /**
   * method used to call load method from setbillingaddressoncart loader class
   */
  __load() {
    return this.setBillingAddressOnCartLoader.load(this.cartId);
  }

  /**
   * Converts billing Address data from the 3rd-party commerce system into the Magento GraphQL format.
   * @param {Object} data parameter data contains billingAddress details from hybris
   * @returns {Object} convert the hybris data into magento graphQL schema and return the billingAddresss object
   */
  __convertData(data) {
    let regionCode = data.region.isocode.split('-');
    regionCode = regionCode.length === 2 ? regionCode[1] : regionCode[0];
    return {
      cart: {
        billing_address: {
          firstname: data.firstName,
          lastname: data.lastName,
          street: [data.line1, data.line2],
          city: data.town,
          region: {
            code: regionCode,
            label: regionCode,
          },
          postcode: data.postalCode,
          telephone: data.phone,
          country: {
            code: data.country.isocode,
            label: data.country.isocode,
          },
        },
      },
    };
  }
}

module.exports = SetBillingAddressesOnCart;
