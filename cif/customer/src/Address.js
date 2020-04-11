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

const AddressLoader = require('./AddressLoader.js');

class Address {
  constructor(parameters) {
    this.graphqlContext = parameters.graphqlContext;
    this.actionParameters = parameters.actionParameters;
    this.addressLoader =
      parameters.addressLoader ||
      new AddressLoader(parameters.actionParameters);

    return this.addresses;
  }

  get addresses() {
    return this.addressLoader.load(this.actionParameters.query).then(data => {
      return this.__convertData(data);
    });
  }

  __convertData(data) {
    if (!data || data.length === 0) {
      return [];
    }

    return data.map(address => {
      const { firstName, lastName, line1, line2 } = address;
      return {
        firstname: firstName,
        lastname: lastName,
        street: [line1, line2],
      };
    });
  }
}

module.exports = Address;
