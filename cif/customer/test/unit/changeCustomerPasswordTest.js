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
const bearer = '55af3c02-6dd3-4b45-92c2-38db35a2c43d';
const { expect } = chai;
const ymlData = require('../../../common/options.json');

describe('changeCustomerPassword', () => {
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
        },
      },
    };

    it('Mutation: change customer password', () => {
      scope
        .put(`${ymlData.HB_API_BASE_PATH}electronics/users/current/password`)
        .query({
          new: 'Test@123',
          old: 'Test@123',
        })
        .reply(202);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation{changeCustomerPassword(currentPassword: "Test@123" newPassword: "Test@123"){id email}}';
      return resolve(args).then(result => {
        console.log(result);
        assert.isUndefined(result.errors);
      });
    });

    it('Mutation: old password mismatch response', () => {
      scope
        .put(`${ymlData.HB_API_BASE_PATH}electronics/users/current/password`)
        .query({
          new: 'Test@123',
          old: '1234567890',
        })
        .reply(400);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation{changeCustomerPassword(currentPassword: "1234567890" newPassword: "Test@123"){id email}}';
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
