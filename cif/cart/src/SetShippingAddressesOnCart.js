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
const SetShippingAddressOnCartLoader = require('./SetShippingAddressOnCartLoader.js');

class SetShippingAddressesOnCart {
  /**
   * @param {Object} parameters parameter object contains the cartId,shippingAddress,graphqlContext & actionParameters
   * @param {String} parameters.cartId parameter contains the cartId
   * @param {Object} parameters.shippingAddress parameter contains the shippingaddress details
   * @param {Object} [parameters.graphqlContext] The optional GraphQL execution context passed to the resolver.
   * @param {Object} [parameters.actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info.
   */
  constructor(parameters) {
    this.cartId = parameters.cartId;
    this.shippingAddresses = parameters.shippingAddress;
    this.graphqlContext = parameters.graphqlContext;
    this.actionParameters = parameters.actionParameters;
    this.setShippingAddressOnCartLoader = new SetShippingAddressOnCartLoader(
      parameters
    );
    /**
     * This class returns a Proxy to avoid having to implement a getter for all properties.
     */
    return new LoaderProxy(this);
  }

  /**
   * method used to call load method from setshippingaddressoncart loader class
   */
  __load() {
    return this.setShippingAddressOnCartLoader.load(this.cartId);
  }

  /**
   * Converts shipping Address data from the 3rd-party commerce system into the Magento GraphQL format.
   * @param {Object} data parameter data contains shippingAddress details from hybris
   * @returns {Object} convert the hybris data into magento graphQL schema and return the shippingAddresss object
   */
  __convertData(data) {
    return {
      cart: {
        shipping_addresses: [
          {
            firstname: data.firstName,
            lastname: data.lastName,
            street: [data.line1, data.line2],
            city: data.town,
            region: {
              code: data.region.isocode,
            },
            postcode: data.postalCode,
            telephone: data.phone,
            country: {
              code: data.country.isocode,
            },
          },
        ],
      },
    };
  }
}

module.exports = SetShippingAddressesOnCart;
