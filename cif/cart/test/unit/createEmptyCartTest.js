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
const bearer = 'bb84cb05-9d99-4655-8f39-7d6ca7e0b22c';

describe('SetGuestEmailOnCart', function() {
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
          bearer: '',
          customerId: 'current',
          HB_PROTOCOL: 'https',
          HB_API_HOST: 'hybris.example.com',
          HB_API_BASE_PATH: '/rest/v2',
          HB_BASESITEID: '/electronics',
        },
      },
    };

    it('Mutation: response should return new cart Id', () => {
      scope
        .post('/rest/v2/electronics/users/current/carts')
        .query({ fields: 'DEFAULT', access_token: `${bearer}` })
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
        .post('/rest/v2/electronics/users/anonymous/carts')
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
