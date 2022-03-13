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
const CreateCustomerAddressLoader = require('./CreateCustomerAddressLoader.js');

class CreateCustomerAddress {
  /**
   * @param {Object} parameters parameters object contains the input, graphqlContext & actionParameters
   * @param {String} parameters.input input parameter contains the customer details like firstname, lastname, email,  password details
   * @param {Object} [parameters.graphqlContext] The optional GraphQL execution context passed to the resolver.
   * @param {Object} [parameters.actionParameters] Some optional actionParameters of the I/O Runtime action, like for example bearer token, query and url info.
   * LoaderProxy class returns a Proxy to avoid having to implement a getter for all properties.
   */
  constructor(parameters) {
    this.graphqlContext = parameters.graphqlContext;
    this.actionParameters = parameters.actionParameters;
    this.input = parameters.input;
    this.createCustomerAddressLoader = new CreateCustomerAddressLoader(
      parameters.actionParameters
    );

    return new LoaderProxy(this);
  }

  /**
   * method used to call load method from createCustomerLoader loader class
   */
  __load() {
    return this.createCustomerAddressLoader.load(this.input);
  }

  /**
   * Converts data from the 3rd-party hybris system into the Magento GraphQL format.
   * @param {Object} data parameter data contains customer details
   * @returns {Object} convert the hybris data into magento graphQL schema and return the object
   */
  __convertData(data) {
    return {
      id: 1,
      firstname: data.firstName,
      lastname: data.lastName,
      email: data.email,
      is_subscribed: true,
      city: data.town,
      country_code: data.country.isocode,
      street: [data.line1],
      default_shipping: data.defaultAddress,
      postcode: data.postalCode,
      region: {
        region_code: data.region.isocode,
        region_id: 1,
      },

      telephone: data.phone,
    };
  }
}

module.exports = CreateCustomerAddress;
