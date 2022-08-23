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
const validResponseCreateCustomerAddress = require('../resources/validResponseCreateCustomerAddress.json');
const createCustomerAddressHybris = require('../resources/hybrisCreateCustomerAddress.json');
// const hybrisAuthLoginMock = require('../resources/hybris-token.json');
const resolve = require('../../../customer/src/customerResolver.js').main;
chai.use(chaiShallowDeepEqual);
const TestUtils = require('../../../utils/TestUtils.js');
const createCustomerAddressLoader = require('../../src/CreateCustomerAddressLoader.js');
const invalidRegionCode = require('../../../cart/test/resources/invalidRegionCode.json');
const invalidCountryCode = require('../../../cart/test/resources/invalidCountryCode.json');
const validResponseInvalidMesasageCode = require('../../../cart/test/resources/validResponseInvalidMessageCode.json');

describe('Create Customer Address Resolver', function() {
  const scope = nock(TestUtils.getHybrisInstance());
  let createCustomerAddress;
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
    createCustomerAddress = sinon.spy(
      createCustomerAddressLoader.prototype,
      '_createCustomerAddress'
    );
  });

  afterEach(() => {
    createCustomerAddress.restore();
  });

  describe('Unit Tests', () => {
    //Returns object with hybris url and configuaration data
    let args = TestUtils.getContextData();

    //Returns hybris configured api base path
    const HB_API_BASE_PATH = TestUtils.getYmlData().HB_API_BASE_PATH;

    it('Create customer Address mutation', () => {
      scope
        .post(`${HB_API_BASE_PATH}electronics/users/current/addresses`)
        .query({ fields: 'DEFAULT' })
        .reply(200, createCustomerAddressHybris);
      args.variables = {
        address: {
          firstname: 'abc',
          lastname: 'xyz',
          street: ['Magento Shipping'],
          telephone: '9999998899',
          city: 'Austin',
          region: {
            region: 'Newyork',
            region_code: 'US-WA',
          },
          postcode: '78756',
          country_code: 'US',
        },
      };
      args.query =
        'mutation CreateCustomerAddress($address:CustomerAddressInput!){createCustomerAddress(input:$address){id ...CustomerAddressFragment __typename}}fragment CustomerAddressFragment on CustomerAddress{id city country_code default_shipping firstname lastname postcode region{region region_code region_id __typename}street telephone __typename}';
      return resolve(args).then(result => {
        let response = result.data.createCustomerAddress;
        assert.equal(createCustomerAddress.callCount, 1);
        expect(response).to.exist.and.to.deep.equal(
          validResponseCreateCustomerAddress.data.createCustomerAddress
        );
      });
    });

    it('Mutation: validate response should contain invalid region code found', () => {
      scope
        .post(`${HB_API_BASE_PATH}electronics/users/current/addresses`)
        .query({ fields: 'DEFAULT' })
        .reply(400, invalidRegionCode);
      args.variables = {
        address: {
          firstname: 'abc',
          lastname: 'xyz',
          street: ['Magento Shipping'],
          telephone: '123456789',
          city: 'Austin',
          region: {
            region: 'Newyork',
            region_code: 'DEFAULT',
          },
          postcode: '123456',
          country_code: 'US',
        },
      };
      args.query =
        'mutation CreateCustomerAddress($address:CustomerAddressInput!){createCustomerAddress(input:$address){id ...CustomerAddressFragment __typename}}fragment CustomerAddressFragment on CustomerAddress{id city country_code default_shipping firstname lastname postcode region{region region_code region_id __typename}street telephone __typename}';
      return resolve(args).then(result => {
        const errors = result.errors[0].message;
        expect(errors).to.deep.equals(validResponseInvalidMesasageCode);
      });
    });
    it('Mutation: validate response should contain invalid country code found', () => {
      scope
        .post(`${HB_API_BASE_PATH}electronics/users/current/addresses`)
        .query({ fields: 'DEFAULT' })
        .reply(400, invalidCountryCode);
      args.variables = {
        address: {
          firstname: 'abc',
          lastname: 'xyz',
          street: ['Magento Shipping'],
          telephone: '123456789',
          city: 'Austin',
          region: {
            region: 'Newyork',
            region_code: 'US-WA',
          },
          postcode: '123456',
          country_code: 'US',
        },
      };
      args.query =
        'mutation CreateCustomerAddress($address:CustomerAddressInput!){createCustomerAddress(input:$address){id ...CustomerAddressFragment __typename}}fragment CustomerAddressFragment on CustomerAddress{id city country_code default_shipping firstname lastname postcode region{region region_code region_id __typename}street telephone __typename}';
      return resolve(args).then(result => {
        const errors = result.errors[0].message;
        expect(errors).to.deep.equals(validResponseInvalidMesasageCode);
      });
    });
  });
});
