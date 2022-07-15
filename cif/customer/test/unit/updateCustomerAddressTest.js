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
const validUpdateCustomerAddressResponse = require('../resources/validUpdateCustomerAddressResponse.json');
const hybrisGetCustomerAddress = require('../resources/hybrisGetCustomerAddress.json');
const resolve = require('../../../customer/src/customerResolver.js').main;
chai.use(chaiShallowDeepEqual);
const TestUtils = require('../../../utils/TestUtils.js');
const UpdateCustomerAddressLoader = require('../../src/UpdateCustomerAddressLoader.js');

describe('Get Customer Address Resolver', function() {
  const scope = nock(TestUtils.getHybrisInstance());
  let updateCustomerAddress;
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
    updateCustomerAddress = sinon.spy(
      UpdateCustomerAddressLoader.prototype,
      '_updateCustomerAddress'
    );
  });

  afterEach(() => {
    updateCustomerAddress.restore();
  });

  describe('Unit Tests', () => {
    //Returns object with hybris url and configuaration data
    let args = TestUtils.getContextData();

    //Returns hybris configured api base path
    const HB_API_BASE_PATH = TestUtils.getYmlData().HB_API_BASE_PATH;

    it('update customer Address mutation', () => {
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/addresses`)
        .query({ fields: 'DEFAULT', query: '' })
        .reply(200, hybrisGetCustomerAddress);
      scope
        .patch(
          `${HB_API_BASE_PATH}electronics/users/current/addresses/8796127297559`
        )
        .reply(200);
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/addresses`)
        .query({ fields: 'DEFAULT', query: '' })
        .reply(200, hybrisGetCustomerAddress);
      args.variables = {
        addressId: 8,
        updated_address: {
          firstname: 'abc',
          lastname: 'xyz',
          country_code: 'US',
          street: ['Magento Shipping'],
          city: 'Austin',
          postcode: '73331',
          telephone: '1234567890',
          default_shipping: false,
          region: {
            region: 'US-NY',
          },
          middlename: '',
        },
      };
      args.query =
        'mutation UpdateCustomerAddressInAddressBook($addressId:Int!$updated_address:CustomerAddressInput!){updateCustomerAddress(id:$addressId input:$updated_address){id ...CustomerAddressBookAddressFragment __typename}}fragment CustomerAddressBookAddressFragment on CustomerAddress{__typename id city country_code default_billing default_shipping firstname lastname middlename postcode region{region region_code region_id __typename}street telephone}';
      return resolve(args).then(result => {
        let response = result.data;
        assert.equal(updateCustomerAddress.callCount, 1);
        expect(response).to.exist.and.to.deep.equal(
          validUpdateCustomerAddressResponse.data
        );
      });
    });
  });
});
