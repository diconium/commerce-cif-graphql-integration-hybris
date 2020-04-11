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

describe('RevokeCustomerToken', function() {
  before(() => {
    sinon.stub(console, 'debug');
    sinon.stub(console, 'error');
  });

  after(() => {
    console.debug.restore();
    console.error.restore();
  });

  describe('Integration tests', () => {
    let args = {
      url: TestUtils.getHybrisInstance(),
      context: {
        settings: {
          bearer: '',
          customerId: 'current',
          HB_CLIENTSECRET: 'oauth-client-secret',
          HB_CLIENTID: 'oauth-clientid',
          HB_OAUTH_PATH: '/authorizationserver/oauth/token',
        },
      },
    };

    it('Mutation: Validate revoke customer token', () => {
      args.query = 'mutation { revokeCustomerToken { result } }';
      return TestUtils.getRefreshToken().then(refreshToken => {
        args.context.settings.bearer = refreshToken;
        return resolve(args).then(result => {
          const { errors } = result;
          let responseData = result.data.revokeCustomerToken.result;
          assert.equal(responseData, true);
          expect(errors).to.be.undefined;
        });
      });
    });
  });
});
