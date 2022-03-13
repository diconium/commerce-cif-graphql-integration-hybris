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
const resolve = require('../../../order/src/orderResolver.js').main;
const nock = require('nock');
const assert = require('chai').assert;
const chai = require('chai');
const { expect } = chai;
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
chai.use(chaiShallowDeepEqual);
const hybrisPlaceOrder = require('../resources/hybrisPlaceOrder.json');
const cartNotFound = require('../../../cart/test/resources/cartNotFound.json');
const deliveryAddressNotSet = require('../resources/deliveryAddressNotSet.json');
const paymentInfoNotSet = require('../resources/paymentInfoNotSet.json');
const PlaceOrderLoader = require('../../src/PlaceOrderLoader');
const TestUtils = require('../../../utils/TestUtils.js');
const hybrisGetCustomerAddress = require('../../../customer/test/resources/hybrisGetCustomerAddress.json');
const hybrisSetPaymentMethodOnCart = require('../../../cart/test/resources/hybrisSetPaymentMethodOnCart.json');

describe('Place order', function() {
  const scope = nock(TestUtils.getHybrisInstance());
  let PlaceOrder;
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
    PlaceOrder = sinon.spy(PlaceOrderLoader.prototype, '_placeOrder');
  });

  afterEach(() => {
    PlaceOrder.restore();
  });

  describe('Validation', () => {
    //Returns object with hybris url and configuaration data
    let args = TestUtils.getContextData();

    //Returns hybris configured api base path
    const HB_API_BASE_PATH = TestUtils.getYmlData().HB_API_BASE_PATH;

    it('Mutation: validate response should return valid order id', () => {
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/addresses`)
        .query({ fields: 'DEFAULT', query: '' })
        .reply(200, hybrisGetCustomerAddress);
      scope
        .post(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000040/paymentdetails`
        )
        .query({ fields: 'DEFAULT' })
        .reply(200, hybrisSetPaymentMethodOnCart);
      scope
        .post(`${HB_API_BASE_PATH}electronics/users/current/orders`)
        .query({
          fields: 'DEFAULT',
          cartId: '00000040',
          access_token: `${TestUtils.getContextData().context.settings.bearer}`,
        })
        .reply(200, hybrisPlaceOrder);
      args.variables = {
        cartId: '00000040',
      };
      args.query =
        'mutation placeOrder($cartId:String!){placeOrder(input:{cart_id:$cartId}){order{order_number __typename}__typename}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        assert.equal(PlaceOrder.callCount, 1);
        let responseData = result.data.placeOrder.order;
        expect(responseData)
          .to.be.ok.and.to.haveOwnProperty('order_number')
          .and.to.equal('00000041');
      });
    });

    it('Mutation: validate response should contain cart not found', () => {
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/addresses`)
        .query({ fields: 'DEFAULT', query: '' })
        .reply(200, hybrisGetCustomerAddress);
      scope
        .post(
          `${HB_API_BASE_PATH}electronics/users/current/carts/CART-NOT-FOUND/paymentdetails`
        )
        .query({ fields: 'DEFAULT' })
        .reply(200, hybrisSetPaymentMethodOnCart);
      scope
        .post(`${HB_API_BASE_PATH}electronics/users/current/orders`)
        .query({
          fields: 'DEFAULT',
          cartId: 'CART-NOT-FOUND',
          access_token: `${TestUtils.getContextData().context.settings.bearer}`,
        })
        .reply(400, cartNotFound);

      args.variables = {
        cartId: 'CART-NOT-FOUND',
      };
      args.query =
        'mutation placeOrder($cartId:String!){placeOrder(input:{cart_id:$cartId}){order{order_number __typename}__typename}}';
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

    it('Mutation: validate response should contain Delivery mode is not set', () => {
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/addresses`)
        .query({ fields: 'DEFAULT', query: '' })
        .reply(200, hybrisGetCustomerAddress);
      scope
        .post(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000040/paymentdetails`
        )
        .query({ fields: 'DEFAULT' })
        .reply(200, hybrisSetPaymentMethodOnCart);
      scope
        .post(`${HB_API_BASE_PATH}electronics/users/current/orders`)
        .query({
          fields: 'DEFAULT',
          cartId: '00000040',
          access_token: `${TestUtils.getContextData().context.settings.bearer}`,
        })
        .reply(400, deliveryAddressNotSet);

      args.query =
        'mutation { placeOrder(input: {cart_id: "00000040"}) {order { order_id}}}';
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

    it('Mutation: validate response should contain Payment info is not set', () => {
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/addresses`)
        .query({ fields: 'DEFAULT', query: '' })
        .reply(200, hybrisGetCustomerAddress);
      scope
        .post(
          `${HB_API_BASE_PATH}electronics/users/current/carts/00000040/paymentdetails`
        )
        .query({ fields: 'DEFAULT' })
        .reply(200, hybrisSetPaymentMethodOnCart);
      scope
        .post(`${HB_API_BASE_PATH}electronics/users/current/orders`)
        .query({
          fields: 'DEFAULT',
          cartId: '00000040',
          access_token: `${TestUtils.getContextData().context.settings.bearer}`,
        })
        .reply(400, paymentInfoNotSet);

      args.query =
        'mutation { placeOrder(input: {cart_id: "00000040"}) {order { order_id}}}';
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
