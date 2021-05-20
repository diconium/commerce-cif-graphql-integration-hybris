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
const resolve = require('../../../customer/src/customerResolver.js').main;
const chai = require('chai');
const expect = require('chai').expect;
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
chai.use(chaiShallowDeepEqual);
const TestUtils = require('../../../utils/TestUtils.js');
const TokenLoader = require('../../src/GenerateCustomerTokenLoader.js');
const ymlData = require('../../../common/options.json');

describe('GenerateCustomerToken', function() {
  let customerToken;
  before(() => {
    sinon.stub(console, 'debug');
    sinon.stub(console, 'error');
  });

  after(() => {
    console.debug.restore();
    console.error.restore();
  });

  beforeEach(() => {
    // We "spy" all the loading functions
    customerToken = sinon.spy(TokenLoader.prototype, '_generateCustomerToken');
  });

  describe('Integration tests', () => {
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
          HB_CLIENTSECRET: ymlData.HB_CLIENTSECRET,
          HB_CLIENTID: ymlData.HB_CLIENTID,
          HB_OAUTH_PATH: ymlData.HB_OAUTH_PATH,
        },
      },
    };

    it('Mutation: Validate generate customer token', () => {
      args.query =
        'mutation {generateCustomerToken(email: "test.user@example.com", password: "Test@123"){token}}';
      return resolve(args).then(result => {
        const { errors } = result;
        assert.isUndefined(result.errors);
        let responseData = result.data.generateCustomerToken.token;
        assert.notEqual(responseData, '');
        expect(errors).to.be.undefined;
        assert.equal(customerToken.callCount, 1);
      });
    });
  });
});
