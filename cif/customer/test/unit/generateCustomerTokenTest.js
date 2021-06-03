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
const TestUtils = require('../../../utils/TestUtils.js');
const ymlData = require('../../../common/options.json');

describe('GenerateCustomerToken', () => {
  const scope = nock(`${ymlData.HB_PROTOCOL}://${ymlData.HB_API_HOST}`);

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
      url: TestUtils.getHybrisInstance(),
      context: {
        settings: {
          bearer: '',
          customerId: 'current',
          HB_PROTOCOL: ymlData.HB_PROTOCOL,
          HB_API_HOST: ymlData.HB_API_HOST,
          HB_API_BASE_PATH: ymlData.HB_API_BASE_PATH,
          HB_BASESITEID: ymlData.HB_BASESITEID,
          HB_CLIENTSECRET: 'adobeio20180605',
          HB_CLIENTID: ymlData.HB_CLIENTID,
          HB_OAUTH_PATH: ymlData.HB_OAUTH_PATH,
        },
      },
    };

    it('Mutation: Generate customer token unit', () => {
      scope
        .post('/authorizationserver/oauth/token')
        .query({ operationType: 'oAuth' })
        .reply(200, hybrisGenerateCustomerToken);
      args.query =
        'mutation {generateCustomerToken(email: "test.user@example.com", password: "123456"){token}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        let response = result.data.generateCustomerToken.token;
        expect(response).to.deep.equals(validGenerateCustomerToken.token);
      });
    });
  });
});
