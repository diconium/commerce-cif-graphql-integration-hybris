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
const ApplyCouponToCartLoader = require('./ApplyCouponToCartLoader.js');
const CartLoader = require('./CartLoader.js');
const Cart = require('./Cart.js');

class ApplyCouponToCart {
  /**
   * @param {Object} parameters parameter object contains the cartId,couponCode,graphqlContext & actionParameters
   * @param {String} parameters.cartId parameter contains the cartId
   * @param {String} parameters.couponCode parameter contains the couponCode
   * @param {Object} [parameters.graphqlContext] The optional GraphQL execution context passed to the resolver.
   * @param {Object} [parameters.actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info.
   */
  constructor(parameters) {
    this.input = parameters.input;
    this.graphqlContext = parameters.graphqlContext;
    this.actionParameters = parameters.actionParameters;
    this.applyCouponToCartLoader = new ApplyCouponToCartLoader(
      parameters.actionParameters
    );
    this.cartLoader = new CartLoader(parameters.actionParameters);
    /**
     * This class returns a Proxy to avoid having to implement a getter for all properties.
     */
    return new LoaderProxy(this);
  }

  /**
   * method used to call load method from applyCouponToCart loader class
   */
  __load() {
    return this.applyCouponToCartLoader.load(this.input);
  }

  /**
   * get cart method call cart loader to get the cart entries
   */
  get cart() {
    const { cart_id: cartId } = this.input;

    return this.__load().then(() => {
      return new Cart({
        graphqlContext: this.graphqlContext,
        actionParameters: this.actionParameters,
        cartLoader: this.cartLoader,
        cartId: cartId,
      });
    });
  }
}

module.exports = ApplyCouponToCart;
