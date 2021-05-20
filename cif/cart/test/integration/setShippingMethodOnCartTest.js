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
const resolve = require('../../src/cartResolver.js').main;
const TestUtils = require('../../../utils/TestUtils.js');
const SetShippingMethodLoader = require('../../src/SetShippingMethodsOnCartLoader');
const ymlData = require('../../../common/options.json');

describe('SetShippingMethodOnCart', function() {
  let SetShippingMethod;
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
    SetShippingMethod = sinon.spy(
      SetShippingMethodLoader.prototype,
      '_setShippingMethod'
    );
  });

  describe('Integration Tests', function() {
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
    before(async () => {
      args.context.settings.bearer = await TestUtils.getBearer();
    });

    it('Mutation: set shipping method on cart test case', () => {
      args.query =
        'mutation {setShippingMethodsOnCart(input: {cart_id: "00000035", shipping_methods: [{carrier_code: "standard-gross", method_code: "bestway"}]}) {cart {shipping_addresses {selected_shipping_method { carrier_code,carrier_title,method_code,method_title,amount {value,currency}}}}}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        let response = result.data.setShippingMethodsOnCart.cart;
        assert.notEqual(response, null);
        expect(response).to.be.not.empty;
        assert.equal(SetShippingMethod.callCount, 1);
      });
    });
  });
});
