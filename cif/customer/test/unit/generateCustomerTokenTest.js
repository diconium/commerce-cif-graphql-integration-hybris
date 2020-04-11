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
const unSupportedGrantType = require('../resources/unSupportedGrantType.json');
const badClientCredentials = require('../resources/badClientCredentials.json');

describe('GenerateCustomerToken', () => {
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

  describe('Unit Tests', () => {
    let args = {
      url: 'https://hybris.example.com',
      context: {
        settings: {
          HB_PROTOCOL: 'https',
          HB_CLIENTSECRET: 'oauth-client-secret',
          HB_CLIENTID: 'oauth-clientid',
          HB_API_HOST: 'hybris.example.com',
          HB_OAUTH_PATH: '/authorizationserver/oauth/token',
        },
      },
    };

    it('Mutation: Generate customer token ', () => {
      scope
        .post('/authorizationserver/oauth/token')
        .query({ operationType: 'oAuth' })
        .reply(200, hybrisGenerateCustomerToken);
      args.query =
        'mutation {generateCustomerToken(email: "test4@test.com", password: "12341234"){token}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        let response = result.data.generateCustomerToken.token;
        expect(response).to.deep.equals(validGenerateCustomerToken.token);
      });
    });

    it('Mutation: validate response should return unsupported grant type', () => {
      scope
        .post('/authorizationserver/oauth/token')
        .query({ operationType: 'oAuth' })
        .reply(400, unSupportedGrantType);
      args.query =
        'mutation {generateCustomerToken(email: "test4@test.com", password: "12341234"){token}}';
      args.context.settings.grant_type = 'pass';
      return resolve(args).then(result => {
        const errors = result.errors[0];
        expect(errors).shallowDeepEqual({
          message:
            '400 - {"errors":[{"message":"Unsupported grant type: pass"}]}',
          source: {
            name: 'GraphQL request',
          },
        });
      });
    });

    it('Mutation: validate response should return bad client credentials ', () => {
      scope
        .post('/authorizationserver/oauth/token')
        .query({ operationType: 'oAuth' })
        .reply(400, badClientCredentials);
      args.query =
        'mutation {generateCustomerToken(email: "test4@test.com", password: "12341234"){token}}';
      args.context.settings.client_secret = 'ADOBE_';
      return resolve(args).then(result => {
        const errors = result.errors[0];
        expect(errors).shallowDeepEqual({
          message: '400 - {"errors":[{"message":"Bad client credentials"}]}',
          source: {
            name: 'GraphQL request',
          },
        });
      });
    });
  });
});
