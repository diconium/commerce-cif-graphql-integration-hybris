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
const expect = require('chai').expect;
const TestUtils = require('../../../utils/TestUtils.js');
const SetGuestEmailLoader = require('../../src/SetGuestEmailOnCartLoader.js');

// The cart resolver
const resolve = require('../../src/cartResolver.js').main;
const ymlData = require('../../../common/options.json');

describe('set email cart', () => {
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

  describe('Integration Tests', () => {
    let args = {
      url: TestUtils.getHybrisInstance(),
      context: {
        settings: {
          bearer: '',
          customerId: 'anonymous',
          HB_PROTOCOL: ymlData.HB_PROTOCOL,
          HB_API_HOST: ymlData.HB_API_HOST,
          HB_API_BASE_PATH: ymlData.HB_API_BASE_PATH,
          HB_BASESITEID: ymlData.HB_BASESITEID,
        },
      },
    };
    before(async () => {
      args.context.settings.bearer = await TestUtils.getOAuthClientBearer();
    });

    it('set email on cart - guest user', () => {
      args.query =
        'mutation { setGuestEmailOnCart(input: {cart_id: "37ada5ad-3fd7-4f4d-9818-5ada248797b0", email: "mytestemail@hybris.com"}) { cart { email}}}';
      return resolve(args).then(result => {
        const { errors } = result;
        assert.isUndefined(result.errors);
        expect(errors).to.be.undefined;
        assert.equal(SetGuestEmail.callCount, 1);
      });
    });
  });
});
