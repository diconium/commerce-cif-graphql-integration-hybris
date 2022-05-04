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
const chai = require('chai');
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
const nock = require('nock');
chai.use(chaiShallowDeepEqual);
//const { expect } = chai;
const resolve = require('../../src/cartResolver.js').main;
const hybrisCartData = require('../resources/hybrisCartQuery.json');
const hybrisDeliveryModes = require('../resources/hybrisDeliveryModes.json');
const CartLoader = require('../../../cart/src/CartLoader');
//const validMergeCartResponse = require('../resources/validMergeCartResponse.json');

const TestUtils = require('../../../utils/TestUtils.js');

describe('Merge Cart', function() {
  const scope = nock(TestUtils.getHybrisInstance());
  let getCartById;
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
    getCartById = sinon.spy(CartLoader.prototype, '__getCartById');
  });

  afterEach(() => {
    getCartById.restore();
  });

  describe('Unit Tests', () => {
    //Returns object with hybris url and configuaration data
    let args = TestUtils.getContextData();

    //Returns hybris configured api base path
    const HB_API_BASE_PATH = TestUtils.getYmlData().HB_API_BASE_PATH;

    it('Mutation: Merge Cart query unit', () => {
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/carts/00000035`)
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisCartData);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000035/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);
      args.variables = {
        destinationCartId: '00000035',
        sourceCartId: '4bf26eec-69f8-4f04-b9a1-2d7959777b8f',
      };
      args.query =
        'mutation MergeCartsAfterSignIn($sourceCartId:String!$destinationCartId:String!){mergeCarts(source_cart_id:$sourceCartId destination_cart_id:$destinationCartId){id items{id __typename}__typename}}';

      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        let response = result.data;
        assert.equal(response.mergeCarts.id, '00000035');
      });
    });
  });
});
