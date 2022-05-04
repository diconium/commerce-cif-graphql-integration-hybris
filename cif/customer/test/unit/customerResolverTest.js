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
const assert = require('chai').assert;
const expect = require('chai').expect;
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
const resolve = require('../../src/customerResolver.js').main;
const nock = require('nock');
const TestUtils = require('../../../utils/TestUtils.js');

const hybrisCustomer = require('../resources/hybrisGetCustomer');
const hybrisGetCustomerAddress = require('../resources/hybrisGetCustomerAddress');
const validResponseCustomer = require('../resources/validResponseCustomer');
const CustomerLoader = require('../../src/CustomerLoader.js');
const AddressLoader = require('../../src/AddressLoader.js');
const CustomerCartLoader = require('../../src/CustomerCartLoader.js');

chai.use(chaiShallowDeepEqual);

describe('Customer Resolver', () => {
  const scope = nock(TestUtils.getHybrisInstance());
  let customerDetails;
  let addressDetails;
  let customerCart;

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
    customerDetails = sinon.spy(CustomerLoader.prototype, 'getCustomer');
    addressDetails = sinon.spy(AddressLoader.prototype, 'getCustomer');
    customerCart = sinon.spy(CustomerCartLoader.prototype, 'getCustomerCart');
  });

  afterEach(() => {
    customerDetails.restore();
    addressDetails.restore();
    customerCart.restore();
  });

  describe('Unit Tests', () => {
    //Returns object with hybris url and configuaration data
    let args = TestUtils.getContextData();

    //Returns hybris configured api base path
    const HB_API_BASE_PATH = TestUtils.getYmlData().HB_API_BASE_PATH;

    it('Basic Customer search', () => {
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current`)
        .query({ fields: 'DEFAULT', query: '' })
        .reply(200, hybrisCustomer);

      args.query = '{customer{firstname, lastname}}';
      return resolve(args).then(result => {
        let customer = result.data.customer;
        const { errors } = result;
        assert.equal(customer.firstname, 'xyz');
        assert.equal(customer.lastname, '');
        assert.isUndefined(result.errors);
        assert.equal(customerDetails.callCount, 1);
        assert.equal(customerCart.callCount, 0);
        expect(errors).to.be.undefined;
        expect(customer).to.deep.equals(validResponseCustomer);
      });
    });

    it('Basic Customer search with addresses', () => {
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current`)
        .query({ fields: 'DEFAULT', query: '' })
        .reply(200, hybrisCustomer);

      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/addresses`)
        .query({ fields: 'DEFAULT', query: '' })
        .reply(200, hybrisGetCustomerAddress);

      args.query =
        '{customer{firstname, lastname, addresses{firstname, lastname, street}}}';
      return resolve(args).then(result => {
        let addresses = result.data.customer.addresses;
        let street = addresses[0].street;
        assert.equal(addressDetails.callCount, 1);
        expect(addresses[0].firstname).to.be.equal(' abc');
        expect(street[0]).to.be.equal('Magento Shipping');
        expect(result.errors).to.be.undefined;
      });
    });
  });
});
