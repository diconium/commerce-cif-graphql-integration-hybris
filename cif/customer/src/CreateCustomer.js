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
const CreateCustomerLoader = require('./CreateCustomerLoader.js');

class CreateCustomer {
  constructor(parameters) {
    this.graphqlContext = parameters.graphqlContext;
    this.actionParameters = parameters.actionParameters;
    this.input = parameters.input;
    this.createCustomerLoader = new CreateCustomerLoader(
      parameters.actionParameters
    );

    return new LoaderProxy(this);
  }

  __load() {
    return this.createCustomerLoader.load(this.input);
  }

  __convertData(data) {
    return {
      customer: {
        firstname: data.firstName,
        lastname: data.lastName,
        email: data.uid,
        is_subscribed: true,
      },
    };
  }
}

module.exports = CreateCustomer;
