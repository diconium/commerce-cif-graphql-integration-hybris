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
const AddressLoader = require('../../customer/src/AddressLoader.js');
const Cart = require('./Cart.js');
const SetShippingAddressOnCartLoader = require('./SetShippingAddressOnCartLoader.js');
const ShippingMethodsLoader = require('./ShippingMethodsLoader.js');

class SetShippingAddressesOnCart {
  /**
   * @param {Object} parameters parameter object contains the cartId,shippingAddress,graphqlContext & actionParameters
   * @param {String} parameters.cartId parameter contains the cartId
   * @param {Object} parameters.shippingAddress parameter contains the shippingaddress details
   * @param {Object} [parameters.graphqlContext] The optional GraphQL execution context passed to the resolver.
   * @param {Object} [parameters.actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info.
   * LoaderProxy class returns a Proxy to avoid having to implement a getter for all properties.
   */
  constructor(parameters) {
    this.cartId = parameters.cartId;
    this.shippingAddresses = parameters.shippingAddress;
    this.graphqlContext = parameters.graphqlContext;
    this.actionParameters = parameters.actionParameters;
    this.setShippingAddressOnCartLoader = new SetShippingAddressOnCartLoader(
      parameters
    );
    this.addressLoader = new AddressLoader(parameters.actionParameters);
    this.shippingMethodsLoader = new ShippingMethodsLoader(
      parameters.actionParameters
    );
    return new LoaderProxy(this);
  }

  /**
   * method used to call load method from setshippingaddressoncart loader class
   */
  __load() {
    return this.addressLoader.load(this.cartId).then(address => {
      return this.setShippingAddressOnCartLoader
        .load(this.cartId, address[0])
        .then(data => {
          return this.shippingMethodsLoader.load(this.cartId).then(result => {
            data.deliveryModes = result.deliveryModes;
            return data;
          });
        });
    });
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
          cartId: this.cartId,
        });
      })
      .catch(errorOutput => Promise.reject(errorOutput));
  }
}

module.exports = SetShippingAddressesOnCart;
