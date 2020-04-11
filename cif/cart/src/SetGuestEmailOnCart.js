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
const SetGuestEmailOnCartLoader = require('./SetGuestEmailOnCartLoader.js');

class SetGuestEmailOnCart {
  /**
   * @param {Object} parameters parameter object contains the cartId,guestEmail,graphqlContext & actionParameters
   * @param {String} parameters.cartId parameter contains the cartId
   * @param {Object} parameters.guestEmail parameter contains the guest email
   * @param {Object} [parameters.graphqlContext] The optional GraphQL execution context passed to the resolver.
   * @param {Object} [parameters.actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info.
   */
  constructor(parameters) {
    this.cartId = parameters.cartId;
    this.guestEmail = parameters.guestEmail;
    this.graphqlContext = parameters.graphqlContext;
    this.actionParameters = parameters.actionParameters;
    this.setGuestEmailOnCartLoader = new SetGuestEmailOnCartLoader(parameters);
    /**
     * This class returns a Proxy to avoid having to implement a getter for all properties.
     */
    return new LoaderProxy(this);
  }

  /**
   * method used to call load method from setGuestEmailOnCart loader class
   */
  __load() {
    return this.setGuestEmailOnCartLoader.load(this.cartId);
  }

  /**
   * Converts datam from the 3rd-party commerce system into the Magento GraphQL format.
   * @returns {Object} return the guest email
   */
  __convertData() {
    return {
      cart: {
        email: this.guestEmail,
      },
    };
  }
}
module.exports = SetGuestEmailOnCart;
