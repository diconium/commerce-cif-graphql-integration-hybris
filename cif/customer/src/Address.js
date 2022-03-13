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

const AddressLoader = require('./AddressLoader.js');

class Address {
  /**
   * @param {Object} parameters parameters object contains the input, graphqlContext & actionParameters
   * @param {String} parameters.input input parameter contains the customer details like firstname, lastname, street details
   * @param {Object} [parameters.graphqlContext] The optional GraphQL execution context passed to the resolver.
   * @param {Object} [parameters.actionParameters] Some optional actionParameters of the I/O Runtime action, like for example bearer token, query and url info.
   */
  constructor(parameters) {
    this.graphqlContext = parameters.graphqlContext;
    this.actionParameters = parameters.actionParameters;
    this.addressLoader =
      parameters.addressLoader ||
      new AddressLoader(parameters.actionParameters);

    return this.addresses;
  }

  get addresses() {
    return this.addressLoader.load(this.actionParameters.query).then(data => {
      return this.__convertData(data);
    });
  }

  /**
   * Converts data from the 3rd-party hybris system into the Magento GraphQL format.
   * @param {Object} data parameter data contains customer Address.
   * @returns {Object} convert the hybris data into magento graphQL schema and return the object
   */
  __convertData(data) {
    if (!data || data.length === 0) {
      return [];
    }

    return data.map((address, index) => {
      const {
        firstName,
        lastName,
        line1,
        line2,
        town: city,
        country,
        defaultAddress,
        postalCode: postcode,
        region,
        phone: telephone,
      } = address;
      return {
        firstname: firstName,
        lastname: lastName,
        street: [line1, line2],
        id: index,
        city,
        country_code: country.isocode,
        default_shipping: defaultAddress,
        postcode,
        region: {
          region_id: 1,
          label: region.isocode,
          code: region.isocode,
          region_code: region.isocode,
          region: region.isocode,
        },
        telephone,
      };
    });
  }
}

module.exports = Address;
