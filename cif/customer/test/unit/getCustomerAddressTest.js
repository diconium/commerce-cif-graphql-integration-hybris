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
const validResponseGetCustomerAddress = require('../resources/validResponseGetCustomerAddress.json');
const hybrisGetCustomerAddress = require('../../../customer/test/resources/hybrisGetCustomerAddress.json');
// const hybrisAuthLoginMock = require('../resources/hybris-token.json');
const resolve = require('../../../customer/src/customerResolver.js').main;
chai.use(chaiShallowDeepEqual);
const TestUtils = require('../../../utils/TestUtils.js');
const AddressLoader = require('../../src/AddressLoader.js');
// const invalidRegionCode = require('../../../cart/test/resources/invalidRegionCode.json');
// const invalidCountryCode = require('../../../cart/test/resources/invalidCountryCode.json');

describe('Get Customer Address Resolver', function() {
  const scope = nock(TestUtils.getHybrisInstance());
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
    getCustomer = sinon.spy(AddressLoader.prototype, 'getCustomer');
  });

  afterEach(() => {
    getCustomer.restore();
  });

  describe('Unit Tests', () => {
    //Returns object with hybris url and configuaration data
    let args = TestUtils.getContextData();

    //Returns hybris configured api base path
    const HB_API_BASE_PATH = TestUtils.getYmlData().HB_API_BASE_PATH;

    it('Get customer Address mutation', () => {
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/addresses`)
        .query({ fields: 'DEFAULT', query: '' })
        .reply(200, hybrisGetCustomerAddress);
      args.query =
        'query GetCustomerAddresses{customer{id addresses{id ...CustomerAddressFragment __typename}__typename}}fragment CustomerAddressFragment on CustomerAddress{id city country_code default_shipping firstname lastname postcode region{region region_code region_id __typename}street telephone __typename}';
      return resolve(args).then(result => {
        let response = result.data.customer;
        assert.equal(getCustomer.callCount, 1);
        expect(response).to.exist.and.to.deep.equal(
          validResponseGetCustomerAddress.data.customer
        );
      });
    });
  });
});
