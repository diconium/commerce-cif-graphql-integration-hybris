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
const CustomerOrderLoader = require('./CustomerOrderLoader.js');

class CustomerOrder {
  /**
   * @param {Object} parameters parameter object contains the graphqlContext & actionParameters
   * @param {Object} [parameters.graphqlContext] The optional GraphQL execution context passed to the resolver.
   * @param {Object} [parameters.actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info.
   * LoaderProxy class returns a Proxy to avoid having to implement a getter for all properties.
   */
  constructor(parameters) {
    this.graphqlContext = parameters.graphqlContext;
    this.actionParameters = parameters.actionParameters;
    this.customerOrderLoader = new CustomerOrderLoader(
      parameters.actionParameters
    );

    return new LoaderProxy(this);
  }

  /**
   * method used to call load method from customerorder loader class
   */
  __load() {
    return this.customerOrderLoader.load(this.actionParameters.query);
  }

  /**
   * Converts post order data from the 3rd-party commerce system into the Magento GraphQL format.
   * @param {Object} data parameter data contains order details from hybris
   * @returns {Object} convert the hybris data into magento graphQL schema and return the post order object
   */
  __convertData(data) {
    return {
      items: data.orders.map(order => {
        return {
          order_number: order.code,
          id: order.guid,
          grand_total: order.total.value,
          status: order.status,
        };
      }),
    };
  }
}

module.exports = CustomerOrder;
