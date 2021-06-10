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
const expect = require('chai').expect;
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
chai.use(chaiShallowDeepEqual);
const resolve = require('../../../customer/src/customerResolver.js').main;
const nock = require('nock');
const hybrisCustomerAddresses = require('../resources/hybrisCustomerAddresses.json');
const hybrisSetPaymentMethodOnCart = require('../resources/hybrisSetPaymentMethodOnCart.json');
const invalidpaymentmethod = require('../resources/invalidPaymentMethodOnCart.json');
const hybrisCartData = require('../../../cart/test/resources/hybrisCartQuery.json');
const hybrisDeliveryModes = require('../resources/hybrisDeliveryModes.json');
const validResponseSetPaymentMethodOnCart = require('../resources/validResponseSetPaymentMethodOnCart.json');
const inValidCart = require('../resources/inValidCart.json');
const PaymentMethodLoader = require('../../../customer/src/SetPaymentMethodOnCartLoader');
const TestUtils = require('../../../utils/TestUtils.js');

describe('setPaymentMethodOnCart', () => {
  const scope = nock(TestUtils.getHybrisInstance());
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

  describe('Unit Tests', () => {
    //Returns object with hybris url and configuaration data
    let args = TestUtils.getContextData();

    //Returns hybris configured api base path
    const HB_API_BASE_PATH = TestUtils.getYmlData().HB_API_BASE_PATH;

    it('Mutation: validate payment method on cart', () => {
      scope
        .post(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000014/paymentdetails`
        )
        .query({ fields: 'DEFAULT' })
        .reply(200, hybrisSetPaymentMethodOnCart);
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/addresses`)
        .query({ fields: 'DEFAULT', query: '' })
        .reply(200, hybrisCustomerAddresses);
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/carts/00000014`)
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisCartData);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000014/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);

      args.query =
        'mutation{setPaymentMethodOnCart(input:{cart_id:"00000014",payment_method:{code:"visa"}}){cart{selected_payment_method{code,title}}}}';
      return resolve(args).then(result => {
        let res =
          result.data.setPaymentMethodOnCart.cart.selected_payment_method;
        let testData =
          validResponseSetPaymentMethodOnCart.selected_payment_method;
        const { errors } = result;
        assert.isUndefined(result.errors);
        assert.equal(PaymentMethod.callCount, 1);
        expect(errors).to.be.undefined;
        assert.equal(res.code, testData.code);
        assert.equal(res.title, testData.title);
      });
    });

    it('Mutation: validate response should contain cart not found', () => {
      scope
        .post(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000005/paymentdetails`
        )
        .query({ fields: 'DEFAULT' })
        .reply(400, inValidCart);
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/addresses`)
        .query({ fields: 'DEFAULT', query: '' })
        .reply(200, hybrisCustomerAddresses);
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/carts/00000005`)
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisCartData);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000005/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);

      args.query =
        'mutation{setPaymentMethodOnCart(input:{cart_id:"00000005",payment_method:{code:"visa"}}){cart{selected_payment_method{code,title}}}}';
      return resolve(args).then(result => {
        const errors = result.errors[0];
        expect(errors).shallowDeepEqual({
          message: 'Request failed with status code 400',
          source: {
            name: 'GraphQL request',
          },
        });
      });
    });

    it('Mutation: validate Invalid payment method', () => {
      scope
        .post(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000014/paymentdetails`
        )
        .query({ fields: 'DEFAULT' })
        .reply(400, invalidpaymentmethod);
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/addresses`)
        .query({ fields: 'DEFAULT', query: '' })
        .reply(200, hybrisCustomerAddresses);
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/carts/00000014`)
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisCartData);
      scope
        .get(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000014/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);

      args.query =
        'mutation{setPaymentMethodOnCart(input:{cart_id:"00000014",payment_method:{code:"INVALID-PAYMENT-METHOD"}}){cart{selected_payment_method{code,title}}}}';
      return resolve(args).then(result => {
        const errors = result.errors[0];
        expect(errors).shallowDeepEqual({
          message: 'Request failed with status code 400',
          source: {
            name: 'GraphQL request',
          },
        });
      });
    });
  });
});
