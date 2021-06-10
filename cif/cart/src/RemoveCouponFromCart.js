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
const RemoveCouponFromCartLoader = require('./RemoveCouponFromCartLoader.js');
const Cart = require('../../cart/src/Cart.js');
const CartLoader = require('../../cart/src/CartLoader.js');

class RemoveCouponFromCart {
  /**
   * @param {Object} parameters parameter object contains the cartId,couponCode,graphqlContext & actionParameters
   * @param {String} parameters.cartId parameter contains the cartId
   * @param {String} parameters.vouchersList parameter contains the vouchersList
   * @param {Object} [parameters.graphqlContext] The optional GraphQL execution context passed to the resolver.
   * @param {Object} [parameters.actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info.
   * LoaderProxy class returns a Proxy to avoid having to implement a getter for all properties.
   */
  constructor(parameters) {
    this.cartId = parameters.cartId;
    this.vouchersList = parameters.vouchersList;
    this.graphqlContext = parameters.graphqlContext;
    this.actionParameters = parameters.actionParameters;
    this.removeCouponFromCartLoader = new RemoveCouponFromCartLoader(
      parameters
    );
    this.cartLoader = new CartLoader(parameters.actionParameters);
    return new LoaderProxy(this);
  }

  /**
   * method used to get the cart details based on the cart Id
   * @returns {Promise} a promise return null after resolved successfully other wise return the error.
   */
  get cart() {
    return this.__load()
      .then(() => {
        return new Cart({
          graphqlContext: this.graphqlContext,
          actionParameters: this.actionParameters,
          cartLoader: this.cartLoader,
          cartId: this.cartId,
        });
      })
      .catch(errorOutput => Promise.reject(errorOutput));
  }

  /**
   * method used to call load method of removeCouponFromCartLoader class
   */
  __load() {
    return this.removeCouponFromCartLoader.load(this.cartId);
  }
}

module.exports = RemoveCouponFromCart;
