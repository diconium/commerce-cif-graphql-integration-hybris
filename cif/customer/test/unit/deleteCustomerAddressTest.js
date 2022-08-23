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

const sinon = require('sinon');
const chai = require('chai');
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
const nock = require('nock');
const hybrisGetCustomerAddress = require('../resources/hybrisGetCustomerAddress.json');
const hybrisInvalidDeleteCustomerAddressId = require('../resources/hybrisInvalidDeleteCustomerAddressId.json');
const resolve = require('../../src/customerResolver.js').main;
chai.use(chaiShallowDeepEqual);
const TestUtils = require('../../../utils/TestUtils.js');
const DeleteCustomerAddressLoader = require('../../src/DeleteCustomerAddressLoader.js');
const AddressLoader = require('../../src/AddressLoader.js');
const { assert } = require('chai');

describe('delete Customer Address Resolver', function() {
  const scope = nock(TestUtils.getHybrisInstance());
  let deleteCustomerAddress;
  let getCustomer;
  before(() => {
    // Disable console debugging
    sinon.stub(console, 'debug');
    sinon.stub(console, 'error');
  });

  after(() => {
    console.debug.restore();
    console.error.restore();
  });

  beforeEach(() => {
    // We "spy" all the loading functions
    deleteCustomerAddress = sinon.spy(
      DeleteCustomerAddressLoader.prototype,
      '_deleteCustomerAddress'
    );
    // We "spy" all the loading functions
    getCustomer = sinon.spy(AddressLoader.prototype, 'getCustomer');
  });

  afterEach(() => {
    deleteCustomerAddress.restore();
    getCustomer.restore();
  });

  describe('Unit Tests', () => {
    //Returns object with hybris url and configuaration data
    let args = TestUtils.getContextData();

    //Returns hybris configured api base path
    const HB_API_BASE_PATH = TestUtils.getYmlData().HB_API_BASE_PATH;

    it('delete customer Address mutation', () => {
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/addresses`)
        .query({ fields: 'DEFAULT', query: '' })
        .reply(200, hybrisGetCustomerAddress);
      scope
        .delete(
          `${HB_API_BASE_PATH}electronics/users/current/addresses/8796127297559`
        )
        .reply(200);
      args.variables = {
        addressId: 8,
      };
      args.query =
        'mutation DeleteCustomerAddressFromAddressBook($addressId:Int!){deleteCustomerAddress(id:$addressId)}';
      return resolve(args).then(result => {
        let response = result.data;
        assert.equal(response.deleteCustomerAddress, true);
      });
    });

    it('delete customer Address mutation invalid addressid', () => {
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/addresses`)
        .query({ fields: 'DEFAULT', query: '' })
        .reply(200, hybrisGetCustomerAddress);
      scope
        .delete(
          `${HB_API_BASE_PATH}electronics/users/current/addresses/8796127297559`
        )
        .reply(400, hybrisInvalidDeleteCustomerAddressId);
      args.variables = {
        addressId: 8,
      };
      args.query =
        'mutation DeleteCustomerAddressFromAddressBook($addressId:Int!){deleteCustomerAddress(id:$addressId)}';
      return resolve(args).then(result => {
        let errors = result.errors[0].message;
        assert.equal(errors, '"Request failed with status code 400"');
      });
    });
  });
});
