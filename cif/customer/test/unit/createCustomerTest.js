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
const customerData = require('../resources/createCustomer.json');
const createCustomerHybris = require('../resources/createCustomerHybris.json');
const hybrisAuthLoginMock = require('../resources/hybris-token.json');
const resolve = require('../../../customer/src/customerResolver.js').main;
chai.use(chaiShallowDeepEqual);
const bearer = 'a7db795c-b1c2-46d9-a201-16130b6099af';

describe('Create Customer Resolver', function() {
  const scope = nock('https://hybris.example.com');

  before(() => {
    // Disable console debugging
    sinon.stub(console, 'debug');
    sinon.stub(console, 'error');
  });

  after(() => {
    console.debug.restore();
    console.error.restore();
  });

  describe('Integration Tests', () => {
    let args = {
      url: 'https://hybris.example.com',
      context: {
        settings: {
          bearer: '',
          customerId: 'current',
          HB_PROTOCOL: 'https',
          HB_API_HOST: 'hybris.example.com',
          HB_API_BASE_PATH: '/rest/v2',
          HB_BASESITEID: '/electronics',
          HB_OAUTH_PATH: '/authorizationserver/oauth/token',
        },
      },
    };

    it('Create customer mutation', () => {
      scope
        .post('/authorizationserver/oauth/token')
        .query({ operationType: 'oAuth' })
        .reply(200, hybrisAuthLoginMock);

      scope
        .post('/rest/v2/electronics/users')
        .query({ fields: 'DEFAULT', access_token: `${bearer}` })
        .reply(200, createCustomerHybris);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation {createCustomer(input: {firstname: "Amaresh", lastname: "muni", email: "amar@test.com", password: "Test@1234", is_subscribed: true}) {customer {firstname,lastname,email,is_subscribed}}}';
      return resolve(args).then(result => {
        let response = result.data.createCustomer.customer;
        expect(response).to.exist.and.to.deep.equal(customerData.customer);
      });
    });

    it('Create customer mutation with data of email, name validation', () => {
      scope
        .post('/authorizationserver/oauth/token')
        .query({ operationType: 'oAuth' })
        .reply(200, hybrisAuthLoginMock);

      scope
        .post('/rest/v2/electronics/users')
        .query({ fields: 'DEFAULT', access_token: `${bearer}` })
        .reply(200, createCustomerHybris);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation {createCustomer(input: {firstname: "Amaresh", lastname: "muni", email: "amar@test.com", password: "Test@1234", is_subscribed: true}) {customer {firstname,lastname,email,is_subscribed}}}';
      return resolve(args).then(result => {
        let response = result.data.createCustomer.customer;
        assert.ok(response.firstname);
        assert.ok(response.lastname);
        assert.ok(response.email);
      });
    });
  });
});
