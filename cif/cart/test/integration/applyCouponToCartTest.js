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
const TestUtils = require('../../../utils/TestUtils.js');
const resolve = require('../../../cart/src/cartResolver.js').main;
const chai = require('chai');
const expect = require('chai').expect;
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
chai.use(chaiShallowDeepEqual);
const ApplyCouponLoader = require('../../src/ApplyCouponToCartLoader');
const ymlData = require('../../../common/options.json');

describe('ApplyCouponToCart', () => {
  let ApplyCoupon;
  before(() => {
    sinon.stub(console, 'debug');
    sinon.stub(console, 'error');
  });

  after(() => {
    console.debug.restore();
    console.error.restore();
  });

  beforeEach(() => {
    // We "spy" all the loading functions
    ApplyCoupon = sinon.spy(ApplyCouponLoader.prototype, '_applyCouponToCart');
  });

  describe('Integration Tests', () => {
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

    it('Mutation: validate apply coupon to cart', () => {
      args.query =
        'mutation {applyCouponToCart(input: {cart_id: "00000035",coupon_code: "BUYMORE16"}){cart{items{product{name}quantity}applied_coupon{code}prices{grand_total{value,currency}}}}}';
      return resolve(args).then(result => {
        const { errors } = result;
        assert.isUndefined(result.errors); // N
        let responseData = result.data.applyCouponToCart;
        assert.notEqual(responseData, null);
        expect(errors).to.be.undefined;
        assert.equal(ApplyCoupon.callCount, 1);
      });
    });
  });
});
