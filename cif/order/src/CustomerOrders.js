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
const CustomerOrdersLoader = require('./CustomerOrdersLoader.js');
const CustomerOrderDetailsLoader = require('./CustomerOrderDetailsLoader.js');
const CustomerOrderDetails = require('./CustomerOrderDetails.js');

class CustomerOrders {
  /**
   * @param {Object} parameters parameter object contains the graphqlContext & actionParameters
   * @param {Object} [parameters.graphqlContext] The optional GraphQL execution context passed to the resolver.
   * @param {Object} [parameters.actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info.
   * LoaderProxy class returns a Proxy to avoid having to implement a getter for all properties.
   */
  constructor(parameters) {
    this.graphqlContext = parameters.graphqlContext;
    this.actionParameters = parameters.actionParameters;
    this.customerOrdersLoader = new CustomerOrdersLoader(
      parameters.actionParameters
    );
    this.customerOrderDetailsLoader = new CustomerOrderDetailsLoader(
      parameters.actionParameters
    );
    return new LoaderProxy(this);
  }

  /**
   * method used to call load method from customerorders loader class
   */
  __load() {
    return this.customerOrdersLoader.load(this.actionParameters.query);
  }

  /**
   * Converts post order data from the 3rd-party commerce system into the Magento GraphQL format.
   * @param {Object} data parameter data contains order details from hybris
   * @returns {Object} convert the hybris data into magento graphQL schema and return the post order object
   */
  __convertData(data) {
    return {
      page_info: {
        current_page: data.pagination.currentPage,
        total_pages: data.pagination.totalPages,
      },
      total_count: data.pagination.totalResults,
    };
  }

  get items() {
    let orderCode = this.actionParameters.variables.filter.number.match;
    //Check whether order code exist or not
    if (orderCode === '') {
      return this.__load().then(data => {
        return data.orders.map(order => {
          const getCustomerOrder = new CustomerOrderDetails({
            code: order.code,
            graphqlContext: this.graphqlContext,
            actionParameters: this.actionParameters,
            customerOrderDetailsLoader: this.customerOrderDetailsLoader,
          });
          return getCustomerOrder;
        });
      });
    } else
      return this.__load().then(() => {
        const getCustomerOrderDetails = [
          new CustomerOrderDetails({
            code: orderCode,
            graphqlContext: this.graphqlContext,
            actionParameters: this.actionParameters,
            customerOrderDetailsLoader: this.customerOrderDetailsLoader,
          }),
        ];
        return getCustomerOrderDetails;
      });
  }
}
module.exports = CustomerOrders;
