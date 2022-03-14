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
const resolve = require('../../src/customerResolver.js').main;
const chai = require('chai');
const { expect } = chai;
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
chai.use(chaiShallowDeepEqual);
const nock = require('nock');
const assert = require('chai').assert;
const hybrisGenerateCustomerToken = require('../resources/hybrisGenerateCustomerToken.json');
const validGenerateCustomerToken = require('../resources/validGenerateCustomerToken.json');
//const badClientCredentials = require('../resources/badClientCredentials.json');
const TokenLoader = require('../../src/GenerateCustomerTokenLoader.js');
const TestUtils = require('../../../utils/TestUtils.js');

describe('GenerateCustomerToken', () => {
  const scope = nock(TestUtils.getHybrisInstance());
  let customerToken;
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
    customerToken = sinon.spy(TokenLoader.prototype, '_generateCustomerToken');
  });

  afterEach(() => {
    customerToken.restore();
  });

  describe('Unit Tests', () => {
    //Returns object with hybris url and configuaration data
    let args = TestUtils.getContextData();

    it('Mutation: Generate customer token unit', () => {
      scope
        .post('/authorizationserver/oauth/token')
        .query({ operationType: 'oAuth' })
        .reply(200, hybrisGenerateCustomerToken);
      args.query =
        'mutation {generateCustomerToken(email: "abc.xyz@123.com", password: "123456"){token}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        let response = result.data.generateCustomerToken.token;
        assert.equal(customerToken.callCount, 1);
        expect(response).to.deep.equals(validGenerateCustomerToken.token);
      });
    });
  });
});
