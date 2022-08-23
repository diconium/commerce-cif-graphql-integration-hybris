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
const chai = require('chai');
const expect = require('chai').expect;
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
const nock = require('nock');
const resolve = require('../../../customer/src/customerResolver.js').main;
chai.use(chaiShallowDeepEqual);
const TestUtils = require('../../../utils/TestUtils.js');
const updateCustomerLoader = require('../../src/UpdateCustomerLoader.js');
const HybrisUpdateCustomer = require('../resources/hybrisUpdatedCustomerResponse.json');
const validUpdateCustomer = require('../resources/validUpdateCustomerResponse.json');

describe('Update Customer Resolver', function() {
  const scope = nock(TestUtils.getHybrisInstance());
  let updateCustomer;
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
    updateCustomer = sinon.spy(
      updateCustomerLoader.prototype,
      '_updateCustomer'
    );
  });

  afterEach(() => {
    updateCustomer.restore();
  });

  describe('Unit Tests', () => {
    //Returns object with hybris url and configuaration data
    let args = TestUtils.getContextData();

    //Returns hybris configured api base path
    const HB_API_BASE_PATH = TestUtils.getYmlData().HB_API_BASE_PATH;

    it('Update customer  mutation', () => {
      scope.patch(`${HB_API_BASE_PATH}electronics/users/current`).reply(200);
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current`)
        .query({ fields: 'DEFAULT', query: '' })
        .reply(200, HybrisUpdateCustomer);
      args.variables = {
        customerInput: {
          email: 'abc.xyz@123.com',
          firstname: 'abc',
          lastname: 'xyz',
          password: 'abc123@',
        },
      };
      args.query =
        'mutation SetCustomerInformation($customerInput:CustomerInput!){updateCustomer(input:$customerInput){customer{id ...AccountInformationPageFragment __typename}__typename}}fragment AccountInformationPageFragment on Customer{id firstname lastname email __typename}';
      return resolve(args).then(result => {
        let response = result.data;
        assert.equal(updateCustomer.callCount, 1);
        expect(response).to.exist.and.to.deep.equal(validUpdateCustomer.data);
      });
    });
  });
});
