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
const RemoveItemFromCartLoader = require('./RemoveItemFromCartLoader.js');
const Cart = require('./Cart.js');
const CartLoader = require('./CartLoader.js');

class RemoveItemFromCart {
  /**
   * @param {Object} parameters parameter object contains the cartId,graphqlContext & actionParameters
   * @param {String} parameters.cartId parameter contains the cartId
   * @param {Object} [parameters.graphqlContext] The optional GraphQL execution context passed to the resolver.
   * @param {Object} [parameters.actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info.
   * LoaderProxy class returns a Proxy to avoid having to implement a getter for all properties.
   */
  constructor(parameters) {
    this.actionParameters = parameters.actionParameters;
    this.graphqlContext = parameters.graphqlContext;
    this.input = parameters.input;
    this.removeItemFromCartLoader = new RemoveItemFromCartLoader(
      parameters.actionParameters
    );
    this.cartLoader = new CartLoader(parameters.actionParameters);
    return new LoaderProxy(this);
  }

  /**
   * method used to call load method from removeItemFromCartLoader loader class
   */
  __load() {
    return this.removeItemFromCartLoader.load(this.input);
  }

  /**
   * get cart method call cart loader to get the cart entries
   * @returns {Promise} a promise return null after resolved successfully other wise return the error.
   */
  get cart() {
    return this.__load()
      .then(() => {
        return new Cart({
          graphqlContext: this.graphqlContext,
          actionParameters: this.actionParameters,
          cartLoader: this.cartLoader,
          cartId: this.input.cart_id,
        });
      })
      .catch(errorOutput => Promise.reject(errorOutput));
  }
}

module.exports = RemoveItemFromCart;
