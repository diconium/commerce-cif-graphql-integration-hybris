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
const VouchersListLoader = require('./VouchersListLoader.js');
const RemoveCouponFromCart = require('./RemoveCouponFromCart.js');
const RemoveCouponFromCartLoader = require('../../cart/src/RemoveCouponFromCartLoader.js');

class VoucherList {
  /**
   * @param {Object} parameters parameter object contains the cartId,couponCode,graphqlContext & actionParameters
   * @param {String} parameters.input parameter contains the cartId
   * @param {Object} [parameters.graphqlContext] The optional GraphQL execution context passed to the resolver.
   * @param {Object} [parameters.actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info.
   */
  constructor(parameters) {
    this.input = parameters.input;
    this.graphqlContext = parameters.graphqlContext;
    this.actionParameters = parameters.actionParameters;
    this.vouchersListLoader = new VouchersListLoader(
      parameters.actionParameters
    );
    this.removeCouponFromCartLoader = new RemoveCouponFromCartLoader(
      parameters.actionParameters
    );

    /**
     * This class returns a Proxy to avoid having to implement a getter for all properties.
     */
    return new LoaderProxy(this);
  }

  /**
   * method used to call load method of vouchersListLoader class
   */
  __load() {
    const { cart_id: cartId } = this.input;
    return this.vouchersListLoader.load(cartId);
  }

  __convertData(vouchersList) {
    const { cart_id: cartId } = this.input;
    return new RemoveCouponFromCart({
      graphqlContext: this.graphqlContext,
      actionParameters: this.actionParameters,
      removeCouponFromCartLoader: this.removeCouponFromCartLoader,
      cartId: cartId,
      vouchersList: vouchersList,
    });
  }
}

module.exports = VoucherList;
