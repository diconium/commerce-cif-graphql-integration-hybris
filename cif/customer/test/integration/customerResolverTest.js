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
const resolve = require('../../src/customerResolver.js').main;
const CustomerLoader = require('../../src/CustomerLoader.js');
const AddressLoader = require('../../src/AddressLoader.js');
const CustomerCartLoader = require('../../src/CustomerCartLoader.js');
const TestUtils = require('../../../utils/TestUtils.js');
const expect = require('chai').expect;
const ymlData = require('../../../common/options.json');

describe('Customer Resolver', () => {
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

  describe('Integration Tests', () => {
    let args = {
      url: TestUtils.getHybrisInstance(),
      context: {
        settings: {
          bearer: '',
          customerId: 'current',
          HB_PROTOCOL: ymlData.HB_PROTOCOL,
          HB_API_HOST: ymlData.HB_API_HOST,
          HB_API_BASE_PATH: ymlData.HB_API_BASE_PATH,
          HB_BASESITEID: ymlData.HB_BASESITEID,
        },
      },
    };
    before(async () => {
      args.context.settings.bearer = await TestUtils.getBearer();
    });

    it('Basic Customer search with valid bearer token', () => {
      args.query = '{customer{firstname, lastname}}';
      //todo check async await support so that this variable can be stored earlier -- Done

      return resolve(args).then(result => {
        // todo add more integration related use cases here - Done
        assert.isUndefined(result.errors);
        let responseData = result.data;
        assert.notEqual(responseData, null);
        expect(result.errors).to.be.undefined;
        assert.equal(customerDetails.callCount, 1);
        assert.equal(customerCart.callCount, 0);
      });
    });

    it('Basic Customer search query with addresses and with valid bearer token', () => {
      args.query =
        '{customer{firstname, lastname, addresses{firstname, lastname, street}}}';
      //todo check async await support so that this variable can be stored earlier -- Done
      return resolve(args).then(result => {
        // todo add more integration related use cases here - Done
        assert.isUndefined(result.errors);
        let responseData = result.data;
        assert.notEqual(responseData, null);
        expect(result.errors).to.be.undefined;
        assert.equal(addressDetails.callCount, 1);
      });
    });

    it('Basic Customer search with empty bearer token should give null values', () => {
      args.context.settings.customerId = 'anonymous';
      args.context.settings.bearer = '';
      args.query = '{customer{firstname, lastname}}';
      return resolve(args).then(result => {
        let customer = result.data.customer;
        assert.equal(customer.firstname, null);
        assert.equal(customer.lastname, null);
        assert.isDefined(result.errors);
      });
    });
  });
});
