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
const resolve = require('../../../customer/src/customerResolver.js').main;
const TestUtils = require('../../../utils/TestUtils.js');
const PaymentMethodLoader = require('../../../customer/src/SetPaymentMethodOnCartLoader');

describe('Set Payment method on Cart', () => {
  let PaymentMethod;

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
    PaymentMethod = sinon.spy(
      PaymentMethodLoader.prototype,
      '_postPaymentMethodOnCart'
    );
  });

  afterEach(() => {
    PaymentMethod.restore();
  });

  describe('Integration Tests', () => {
    //Returns object with hybris url and configuaration data
    let args = TestUtils.getContextData();

    before(async () => {
      args.context.settings.bearer = await TestUtils.getBearer();
    });

    // commented to avoid unnecessary failures on running integration tests
    it('set payment method on cart', () => {
      args.query =
        'mutation{setPaymentMethodOnCart(input:{cart_id:"00000035",payment_method:{code:"visa"}}){cart{selected_payment_method{code,title}}}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        assert.equal(PaymentMethod.callCount, 1);
      });
    });

    it('set payment method on cart with cart not found', () => {
      args.query =
        'mutation{setPaymentMethodOnCart(input:{cart_id:"INVALID-CART-ID",payment_method:{code:"visa"}}){cart{selected_payment_method{code,title}}}}';
      return resolve(args).then(result => {
        assert.equal(
          result.errors[0].message,
          'Request failed with status code 400'
        );
      });
    });
  });
});
