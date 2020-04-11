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
const RevokeCustomerTokenLoader = require('./RevokeCustomerTokenLoader.js');

class RevokeCustomerToken {
  /**
   * @param {Object} parameters parameter object contains the graphqlContext & actionParameters
   * @param {Object} [parameters.graphqlContext] The optional GraphQL execution context passed to the resolver.
   * @param {Object} [parameters.actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info.
   */
  constructor(parameters) {
    this.graphqlContext = parameters.graphqlContext;
    this.actionParameters = parameters.actionParameters;
    this.revokeCustomerTokenLoader = new RevokeCustomerTokenLoader(
      this.actionParameters
    );
    /**
     * This class returns a Proxy to avoid having to implement a getter for all properties.
     */
    return new LoaderProxy(this);
  }

  /**
   * method used to call load method of revokeCustomerTokenLoader class
   */
  __load() {
    return this.revokeCustomerTokenLoader.load();
  }

  /**
   * method used to convert revokeCustomerToken hybris data into magento GraphQL response
   * @param {*} data parameter data contains the generateCustomerToken data
   */
  __convertData(data) {
    if (data) {
      return {
        result: true,
      };
    }
  }
}

module.exports = RevokeCustomerToken;
