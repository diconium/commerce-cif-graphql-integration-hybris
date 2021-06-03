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
const TestUtils = require('../../../utils/TestUtils.js');
const ChangePasswordLoader = require('../../src/ChangeCustomerPasswordLoader.js');
const ymlData = require('../../../common/options.json');

describe('Change Customer Password', function() {
  let changePassword;
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
    changePassword = sinon.spy(
      ChangePasswordLoader.prototype,
      '_generateCustomerToken'
    );
  });

  describe('Integration Tests', () => {
    let args = {
      url: TestUtils.getHybrisInstance(),
      context: {
        settings: {
          bearer: '',
          HB_CLIENTID: ymlData.HB_CLIENTID,
          HB_CLIENTSECRET: ymlData.HB_CLIENTSECRET,
          customerId: 'current',
          HB_OAUTH_PATH: ymlData.HB_OAUTH_PATH,
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
    // todo move such test to unit test -- Done
    it('Mutation: change customer password response should always contain object', () => {
      args.query =
        'mutation{changeCustomerPassword(currentPassword: "Embitel@123" newPassword: "Embitel@123"){id email}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        assert.equal(changePassword.callCount, 1);
      });
    });
  });
});
