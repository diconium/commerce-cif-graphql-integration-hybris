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
const chai = require('chai');
const { expect } = chai;
const nock = require('nock');
const assert = require('chai').assert;
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
chai.use(chaiShallowDeepEqual);
const resolve = require('../../src/cartResolver.js').main;
const hybrisCreateEmptyCart = require('../resources/hybrisCreateEmptyCart.json');
const validResponseCreateEmptyCart = require('../resources/validResponseCreateEmptyCart.json');
const validResponseCreateEmptyCartGuid = require('../resources/validResponseCreateEmptyCartGuid.json');
const TestUtils = require('../../../utils/TestUtils.js');
const bearer = '40b612bb-d64a-461d-8279-3b853c124fb8';
const ymlData = require('../../../common/options.json');

describe('create empty cart', function() {
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

    it('Mutation: response should return new cart Id', () => {
      scope
        .post(`${ymlData.HB_API_BASE_PATH}electronics/users/current/carts`)
        .query({ fields: 'DEFAULT' })
        .reply(200, hybrisCreateEmptyCart);
      args.context.settings.bearer = bearer;
      args.query = 'mutation {createEmptyCart}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        let response = result.data;
        expect(response).to.deep.equals(validResponseCreateEmptyCart);
      });
    });

    it('Mutation: validate create empty cart for anonymous user', () => {
      scope
        .post(`${ymlData.HB_API_BASE_PATH}electronics/users/anonymous/carts`)
        .query({ fields: 'DEFAULT' })
        .reply(200, hybrisCreateEmptyCart);
      args.context.settings.customerId = 'anonymous';
      args.query = 'mutation {createEmptyCart}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        let response = result.data;
        expect(response).to.deep.equals(validResponseCreateEmptyCartGuid);
      });
    });
  });
});
