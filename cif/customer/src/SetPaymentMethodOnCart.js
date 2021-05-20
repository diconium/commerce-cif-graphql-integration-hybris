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
const SetPaymentMethodOnCartLoader = require('./SetPaymentMethodOnCartLoader.js');
const Cart = require('../../cart/src/Cart.js');
const CartLoader = require('../../cart/src/CartLoader.js');
const AddressLoader = require('./AddressLoader.js');

class SetPaymentMethodOnCart {
  /**
   * @param {Object} parameters parameters object contains the input, graphqlContext & actionParameters
   * @param {String} parameters.input input parameter contains the cart_id and payment_method.
   * @param {Object} [parameters.graphqlContext] The optional GraphQL execution context passed to the resolver.
   * @param {Object} [parameters.actionParameters] Some optional actionParameters of the I/O Runtime action, like for example bearer token, query and url info.
   */
  constructor(parameters) {
    this.input = parameters.input;
    this.graphqlContext = parameters.graphqlContext;
    this.actionParameters = parameters.actionParameters;
    this.setPaymentMethodOnCartLoader = new SetPaymentMethodOnCartLoader(
      parameters.actionParameters
    );
    this.cartLoader = new CartLoader(parameters.actionParameters);
    this._addressLoader = new AddressLoader(parameters.actionParameters);

    /**
     * This class returns a Proxy to avoid having to implement a getter for all properties.
     */
    return new LoaderProxy(this);
  }

  /**
   * method used to call load method from paymentmethod Loader loader class
   */
  __load() {
    return this._addressLoader.load(this.input.cart_id).then(address => {
      return this.setPaymentMethodOnCartLoader.load(this.input, address);
    });
  }

  /**
   * get cart method call cart loader to get the cart entries
   */
  get cart() {
    return this.__load().then(() => {
      return new Cart({
        graphqlContext: this.graphqlContext,
        actionParameters: this.actionParameters,
        cartLoader: this.cartLoader,
        cartId: this.input.cart_id,
      });
    });
  }
}

module.exports = SetPaymentMethodOnCart;
