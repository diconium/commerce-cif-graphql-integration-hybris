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

class SetPaymentMethodOnCart {
  constructor(parameters) {
    this.input = parameters.input;
    this.graphqlContext = parameters.graphqlContext;
    this.actionParameters = parameters.actionParameters;
    this.setPaymentMethodOnCartLoader = new SetPaymentMethodOnCartLoader(
      parameters.actionParameters
    );
    this.cartLoader = new CartLoader(parameters.actionParameters);

    return new LoaderProxy(this);
  }

  __load() {
    return this.setPaymentMethodOnCartLoader.load(this.input);
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
