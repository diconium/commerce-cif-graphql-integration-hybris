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
const customerDataGraphqlResponse = require('../resources/createCustomer.json');
const createCustomerHybris = require('../resources/createCustomerHybris.json');
const hybrisAuthLoginMock = require('../resources/hybris-token.json');
const resolve = require('../../../customer/src/customerResolver.js').main;
chai.use(chaiShallowDeepEqual);
const TestUtils = require('../../../utils/TestUtils.js');
const createCustomerLoader = require('../../src/CreateCustomerLoader.js');

describe('Create Customer Resolver', function() {
  const scope = nock(TestUtils.getHybrisInstance());
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

  describe('Unit Tests', () => {
    //Returns object with hybris url and configuaration data
    let args = TestUtils.getContextData();

    //Returns hybris configured api base path
    const HB_API_BASE_PATH = TestUtils.getYmlData().HB_API_BASE_PATH;

    it('Create customer mutation', () => {
      scope
        .post('/authorizationserver/oauth/token')
        .query({ operationType: 'oAuth' })
        .reply(200, hybrisAuthLoginMock);

      scope
        .post(`${HB_API_BASE_PATH}electronics/users`)
        .query({ fields: 'DEFAULT' })
        .reply(200, createCustomerHybris);
      args.variables = {
        email: 'abc.xyz@123.com',
        firstname: ' abc',
        lastname: 'k',
        password: ' abc123@',
        is_subscribed: false,
      };
      args.query =
        'mutation CreateAccount($email:String!$firstname:String!$lastname:String!$password:String!$is_subscribed:Boolean!){createCustomer(input:{email:$email firstname:$firstname lastname:$lastname password:$password is_subscribed:$is_subscribed}){customer{id firstname lastname email __typename}__typename}}';
      return resolve(args).then(result => {
        let response = result.data.createCustomer.customer;
        assert.equal(createCustomer.callCount, 1);
        expect(response).to.exist.and.to.deep.equal(
          customerDataGraphqlResponse.data.createCustomer.customer
        );
      });
    });

    it('Create customer mutation with data of email, name validation', () => {
      scope
        .post('/authorizationserver/oauth/token')
        .query({ operationType: 'oAuth' })
        .reply(200, hybrisAuthLoginMock);

      scope
        .post(`${HB_API_BASE_PATH}electronics/users`)
        .query({ fields: 'DEFAULT' })
        .reply(200, createCustomerHybris);

      args.variables = {
        email: 'abc.xyz@123.com',
        firstname: ' abc',
        lastname: 'k',
        password: ' abc123@',
        is_subscribed: false,
      };
      args.query =
        'mutation CreateAccount($email:String!$firstname:String!$lastname:String!$password:String!$is_subscribed:Boolean!){createCustomer(input:{email:$email firstname:$firstname lastname:$lastname password:$password is_subscribed:$is_subscribed}){customer{id firstname lastname email __typename}__typename}}';
      return resolve(args).then(result => {
        let response = result.data.createCustomer.customer;
        assert.ok(response.firstname);
        assert.ok(response.lastname);
        assert.ok(response.email);
      });
    });

    it('Mutation: create customer response should always contain object', () => {
      scope
        .post('/authorizationserver/oauth/token')
        .query({ operationType: 'oAuth' })
        .reply(200, hybrisAuthLoginMock);

      scope
        .post(`${HB_API_BASE_PATH}electronics/users`)
        .query({ fields: 'DEFAULT' })
        .reply(200, createCustomerHybris);

      args.variables = {
        email: 'abc.xyz@123.com',
        firstname: ' abc',
        lastname: 'k',
        password: ' abc123@',
        is_subscribed: false,
      };
      args.query =
        'mutation CreateAccount($email:String!$firstname:String!$lastname:String!$password:String!$is_subscribed:Boolean!){createCustomer(input:{email:$email firstname:$firstname lastname:$lastname password:$password is_subscribed:$is_subscribed}){customer{id firstname lastname email __typename}__typename}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        let response = result.data.createCustomer;
        assert.notEqual(response, null);
        expect(response).to.be.not.empty;
        assert.equal(createCustomer.callCount, 1);
        expect(response).to.exist.and.to.deep.equal(
          customerDataGraphqlResponse.data.createCustomer
        );
        expect(response.customer).to.be.an('object');
      });
    });
  });
});
