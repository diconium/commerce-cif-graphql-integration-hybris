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
const assert = require('chai').assert;
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
chai.use(chaiShallowDeepEqual);
const resolve = require('../../src/cartResolver.js').main;
const TestUtils = require('../../../utils/TestUtils.js');
const { expect } = chai;
const RemoveCouponLoader = require('../../src/RemoveCouponFromCartLoader');

describe('RemoveCouponFromCart', function() {
  let RemoveCoupon;
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
    RemoveCoupon = sinon.spy(
      RemoveCouponLoader.prototype,
      '_removeCouponsFromCart'
    );
  });

  afterEach(() => {
    RemoveCoupon.restore();
  });

  describe('Integration Tests', () => {
    //Returns object with hybris url and configuaration data
    let args = TestUtils.getContextData();

    before(async () => {
      args.context.settings.bearer = await TestUtils.getBearer();
    });

    it('Mutation: Remove coupon from cart', () => {
      args.query =
        'mutation {removeCouponFromCart(input:{ cart_id: "00000035"}){cart{items{product{name}quantity}applied_coupon{code}prices{grand_total{value,currency}}}}}';
      return resolve(args).then(result => {
        const { errors } = result;
        assert.isUndefined(result.errors);
        expect(errors).to.be.undefined;
        assert.equal(RemoveCoupon.callCount, 1);
      });
    });
  });
});
