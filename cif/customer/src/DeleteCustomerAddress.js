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
const LoaderProxy = require('../../common/LoaderProxy.js');
const DeleteCustomerAddressLoader = require('./DeleteCustomerAddressLoader.js');

class DeleteCustomerAddress {
  /**
   * @param {Object} parameters parameters object contains the input, graphqlContext & actionParameters
   * @param {String} parameters.input input parameter contains the customer details like addressId, firstname, lastname, street details
   * @param {Object} [parameters.graphqlContext] The optional GraphQL execution context passed to the resolver.
   * @param {Object} [parameters.actionParameters] Some optional actionParameters of the I/O Runtime action, like for example bearer token, query and url info.
   */
  constructor(parameters) {
    this.graphqlContext = parameters.graphqlContext;
    this.actionParameters = parameters.actionParameters;
    this.addressId = parameters.input;
    this.addressLoader = new AddressLoader(parameters.actionParameters);
    this.deleteCustomerAddressLoader = new DeleteCustomerAddressLoader(
      parameters.actionParameters
    );
    return new LoaderProxy(this);
  }

  /**
   * method used to call load method from addressLoader loader class to get address id
   * method used to call load method from deleteCustomerAddressLoader loader class.
   */
  __load() {
    return this.addressLoader.load(this.addressId).then(data => {
      let addressId = data[this.addressId].id;
      return this.deleteCustomerAddressLoader.load(
        addressId,
        this.actionParameters
      );
    });
  }

  /**
   * Converts data from the 3rd-party hybris system into the Magento GraphQL format.
   * @param {Object} data parameter data contains customer Address.
   * @returns {Object} convert the hybris data into magento graphQL schema and return the object
   */
  __convertData() {
    return true;
  }
}

module.exports = DeleteCustomerAddress;
