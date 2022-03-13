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
const assert = require('chai').assert;
const expect = require('chai').expect;
const resolve = require('../../../customer/src/customerResolver.js').main;
const TestUtils = require('../../../utils/TestUtils.js');
const createCustomerLoader = require('../../src/CreateCustomerLoader.js');

describe('Create Customer Resolver', function() {
  let createCustomer;
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
    createCustomer = sinon.spy(
      createCustomerLoader.prototype,
      '_createCustomer'
    );
  });

  afterEach(() => {
    createCustomer.restore();
  });

  describe('Integration Tests', () => {
    //Returns object with hybris url and configuaration data
    let args = TestUtils.getContextData();
    it('Mutation: create customer response should always contain object', () => {
      args.query =
        'mutation {createCustomer(input: {firstname: "abc", lastname: "xyz", email: "abc.xyz@123.com", password: "Test@1234", is_subscribed: true}) {customer {firstname,lastname,email,is_subscribed}}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        let customer = result.data.createCustomer;
        assert.notEqual(customer, null);
        expect(customer).to.be.not.empty;
        assert.equal(createCustomer.callCount, 1);
      });
    });
  });
});
