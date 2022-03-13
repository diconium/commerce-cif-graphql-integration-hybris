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
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
const nock = require('nock');
const assert = require('chai').assert;
chai.use(chaiShallowDeepEqual);
const TestUtils = require('../../../utils/TestUtils.js');
const { expect } = chai;
const ChangePasswordLoader = require('../../src/ChangeCustomerPasswordLoader.js');

describe('changeCustomerPassword', () => {
  const scope = nock(TestUtils.getHybrisInstance());
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

  afterEach(() => {
    changePassword.restore();
  });

  describe('Unit Tests', () => {
    //Returns object with hybris url and configuaration data
    let args = TestUtils.getContextData();

    //Returns hybris configured api base path
    const HB_API_BASE_PATH = TestUtils.getYmlData().HB_API_BASE_PATH;

    it('Mutation: change customer password', () => {
      scope
        .put(`${HB_API_BASE_PATH}electronics/users/current/password`)
        .query({
          new: '123@123',
          old: '123@123',
        })
        .reply(202);

      args.query =
        'mutation{changeCustomerPassword(currentPassword: "123@123" newPassword: "123@123"){id email}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        assert.equal(changePassword.callCount, 1);
      });
    });

    it('Mutation: old password mismatch response', () => {
      scope
        .put(`${HB_API_BASE_PATH}electronics/users/current/password`)
        .query({
          new: '123@123',
          old: '1234567890',
        })
        .reply(400);

      args.query =
        'mutation{changeCustomerPassword(currentPassword: "1234567890" newPassword: "123@123"){id email}}';
      return resolve(args).then(result => {
        const errors = result.errors[0];
        expect(errors).shallowDeepEqual({
          message: 'Request failed with status code 400',
          source: {
            name: 'GraphQL request',
          },
        });
      });
    });
  });
});
