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
const bearer = '25ef07a8-2793-4bb9-bb96-b9e1984f9549';
const TestUtils = require('../../../utils/TestUtils.js');
const ymlData = require('../../../common/options.json');

describe('Place order', function() {
  const scope = nock(`${ymlData.HB_PROTOCOL}://${ymlData.HB_API_HOST}`);
  before(() => {
    sinon.stub(console, 'debug');
    sinon.stub(console, 'error');
  });

  after(() => {
    console.debug.restore();
    console.error.restore();
  });

  describe('Validation', () => {
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

    it('Mutation: validate response should return valid order id', () => {
      scope
        .post(`${ymlData.HB_API_BASE_PATH}electronics/users/current/orders`)
        .query({
          fields: 'DEFAULT',
          cartId: '00000040',
          access_token: `${bearer}`,
        })
        .reply(200, hybrisPlaceOrder);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation { placeOrder(input: {cart_id: "00000040"}) {order { order_id}}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        let responseData = result.data.placeOrder.order;
        expect(responseData)
          .to.be.ok.and.to.haveOwnProperty('order_id')
          .and.to.equal('00000041');
      });
    });

    it('Mutation: validate response should contain cart not found', () => {
      scope
        .post(`${ymlData.HB_API_BASE_PATH}electronics/users/current/orders`)
        .query({
          fields: 'DEFAULT',
          cartId: 'CART NOT FOUND',
          access_token: `${bearer}`,
        })
        .reply(400, cartNotFound);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation { placeOrder(input: {cart_id: "CART NOT FOUND"}) {order { order_id}}}';
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
        .post(`${ymlData.HB_API_BASE_PATH}electronics/users/current/orders`)
        .query({
          fields: 'DEFAULT',
          cartId: '00000040',
          access_token: `${bearer}`,
        })
        .reply(400, deliveryAddressNotSet);
      args.context.settings.bearer = bearer;
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
        .post(`${ymlData.HB_API_BASE_PATH}electronics/users/current/orders`)
        .query({
          fields: 'DEFAULT',
          cartId: '00000040',
          access_token: `${bearer}`,
        })
        .reply(400, paymentInfoNotSet);
      args.context.settings.bearer = bearer;
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
