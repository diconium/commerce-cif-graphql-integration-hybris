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
const resolve = require('../../src/customerResolver.js').main;
const TestUtils = require('../../../utils/TestUtils.js');

describe('Customer Resolver', () => {
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
      url: 'https://mybackendserver.com/rest',
      context: {
        settings: {
          bearer: '',
          customerId: 'current',
        },
      },
    };

    it('Basic Customer search with valid bearer token', () => {
      args.query = '{customer{firstname, lastname}}';
      //todo check async await support so that this variable can be stored earlier
      return TestUtils.getBearer().then(accessToken => {
        args.context.settings.bearer = accessToken;
        return resolve(args).then(result => {
          // todo add more integration related use cases here
          assert.isUndefined(result.errors);
        });
      });
    });

    it('Basic Customer search query with addresses and with valid bearer token', () => {
      args.query =
        '{customer{firstname, lastname, addresses{firstname, lastname, street}}}';
      //todo check async await support so that this variable can be stored earlier
      return TestUtils.getBearer().then(accessToken => {
        args.context.settings.bearer = accessToken;
        return resolve(args).then(result => {
          // todo add more integration related use cases here
          assert.isUndefined(result.errors);
        });
      });
    });

    it('Basic Customer search with empty bearer token should give null values', () => {
      args.context.settings.customerId = 'anonymous';
      args.context.settings.bearer = '';
      args.query = '{customer{firstname, lastname}}';
      return resolve(args).then(result => {
        let customer = result.data.customer;
        assert.equal(customer.firstname, null);
        assert.equal(customer.lastname, null);
        assert.isUndefined(result.errors);
      });
    });
  });
});
