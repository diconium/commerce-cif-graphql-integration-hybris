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
const resolve = require('../../../cart/src/cartResolver.js').main;
const validResponseSetGuestEmail = require('../resources/validResponseSetGuestEmail.json');
const cartNotFound = require('../resources/cartNotFound.json');
const hybrisAuthLoginMock = require('../resources/hybris-token.json');
const SetGuestEmailLoader = require('../../src/SetGuestEmailOnCartLoader.js');
const TestUtils = require('../../../utils/TestUtils.js');

describe('SetGuestEmailOnCart', function() {
  const scope = nock(TestUtils.getHybrisInstance());
  let SetGuestEmail;
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
    SetGuestEmail = sinon.spy(
      SetGuestEmailLoader.prototype,
      '_setGuestEmailOnCart'
    );
  });

  afterEach(() => {
    SetGuestEmail.restore();
  });

  describe('Unit Tests', () => {
    //Returns object with hybris url and configuaration data
    let args = TestUtils.getContextData();

    //Returns hybris configured api base path
    const HB_API_BASE_PATH = TestUtils.getYmlData().HB_API_BASE_PATH;

    it('Mutation: set guest email on cart', () => {
      scope
        .post('/authorizationserver/oauth/token')
        .query({ operationType: 'oAuth' })
        .reply(200, hybrisAuthLoginMock);

      scope
        .put(
          `${HB_API_BASE_PATH}electronics/users/anonymous/carts/96f344f0-367d-4893-92ce-16531e889169/email`
        )
        .query({
          email: 'guestemail@test.com',
          fields: 'DEFAULT',
        })
        .reply(200);
      args.context.settings.customerId = 'anonymous';
      args.query =
        'mutation { setGuestEmailOnCart(input: {cart_id: "96f344f0-367d-4893-92ce-16531e889169", email: "guestemail@test.com"}) { cart { email}}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        assert.equal(SetGuestEmail.callCount, 1);
        let response = result.data.setGuestEmailOnCart;
        expect(response).to.deep.equals(validResponseSetGuestEmail);
      });
    });

    it('Mutation: validate response should contain cart not found', () => {
      scope
        .put(`${HB_API_BASE_PATH}electronics/users/anonymous/carts/22/email`)
        .query({
          email: 'guestemail@test.com',
          fields: 'DEFAULT',
        })
        .reply(400, cartNotFound);

      args.context.settings.customerId = 'anonymous';
      args.query =
        'mutation { setGuestEmailOnCart(input: {cart_id: "22", email: "guestemail@test.com"}) { cart { email}}}';
      return resolve(args).then(result => {
        const errors = result.errors[0];
        expect(errors).to.shallowDeepEqual({
          message: 'Request failed with status code 400',
          source: {
            name: 'GraphQL request',
          },
        });
      });
    });
  });
});
