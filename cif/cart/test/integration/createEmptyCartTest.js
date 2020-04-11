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
const resolve = require('../../src/cartResolver.js').main;
const TestUtils = require('../../../utils/TestUtils.js');
const chai = require('chai');
const { expect } = chai;
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
chai.use(chaiShallowDeepEqual);

describe('CreateEmptyCart', function() {
  before(() => {
    sinon.stub(console, 'debug');
    sinon.stub(console, 'error');
  });

  after(() => {
    console.debug.restore();
    console.error.restore();
  });

  describe('Integration Tests', () => {
    let args = {
      url: TestUtils.getHybrisInstance(),
      context: {
        settings: {
          bearer: '',
          customerId: 'current',
        },
      },
    };

    it('Mutation: validate response should return new cart id', () => {
      args.query = 'mutation {createEmptyCart}';
      return TestUtils.getBearer().then(accessToken => {
        args.context.settings.bearer = accessToken;
        return resolve(args).then(result => {
          const { errors } = result;
          assert.isUndefined(result.errors);
          let responseData = result.data.createEmptyCart;
          assert.notEqual(responseData, '');
          expect(errors).to.be.undefined;
        });
      });
    });

    it('Mutation: validate response should return guid for anonymous user ', () => {
      args.query = 'mutation {createEmptyCart}';
      args.context.settings.customerId = 'anonymous';
      return resolve(args).then(result => {
        const { errors } = result;
        assert.isUndefined(result.errors);
        let responseData = result.data.createEmptyCart;
        assert.notEqual(responseData, '');
        expect(errors).to.be.undefined;
      });
    });
  });
});
