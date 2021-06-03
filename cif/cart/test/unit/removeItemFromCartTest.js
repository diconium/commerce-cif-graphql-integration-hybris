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
const resolve = require('../../../cart/src/cartResolver.js').main;
const nock = require('nock');
chai.use(chaiShallowDeepEqual);
const hybrisRemoveItemCart = require('../resources/hybrisRemoveItemCart.json');
const validResponseRemoveItemCart = require('../resources/validResponseRemoveItemCart');
const hybrisDeliveryModes = require('../resources/hybrisDeliveryModes.json');
const cartNotFound = require('../resources/cartNotFound.json');
const itemNotFound = require('../resources/cartNotFound.json');
const TestUtils = require('../../../utils/TestUtils.js');
const bearer = 'df808bac-0353-4883-a7cc-67583ebb2532';
const ymlData = require('../../../common/options.json');

describe('RemoveItemFromCart', () => {
  const scope = nock(`${ymlData.HB_PROTOCOL}://${ymlData.HB_API_HOST}`);

  before(() => {
    // Disable console debugging
    sinon.stub(console, 'debug');
    sinon.stub(console, 'error');
  });

  after(() => {
    console.debug.restore();
    console.error.restore();
  });

  describe('Unit Tests', () => {
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

    it('Remove item from cart with valid cartId', () => {
      scope
        .delete(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/00000035/entries/1`
        )
        .query({ fields: 'DEFAULT', query: '' })
        .reply(200);
      scope
        .get(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/00000035`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisRemoveItemCart);
      scope
        .get(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/00000035/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation {removeItemFromCart(input:{cart_id: "00000035",cart_item_uid: "1"}){cart{items{uid,product{name}quantity}prices{grand_total{value,currency}}}}}';
      return resolve(args).then(result => {
        let response = result.data.removeItemFromCart.cart;
        const { errors } = result;
        assert.isUndefined(result.errors);
        expect(errors).to.be.undefined;
        expect(response).to.deep.equals(validResponseRemoveItemCart);
      });
    });

    it('Mutation: validate response should contain cart not found', () => {
      scope
        .delete(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/INVALID-CART-ID/entries/1`
        )
        .query({ fields: 'DEFAULT', query: '' })
        .reply(400, cartNotFound);
      scope
        .get(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/INVALID-CART-ID`
        )
        .query({ fields: 'DEFAULT', access_token: `${bearer}` })
        .reply(200, hybrisRemoveItemCart);
      scope
        .get(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/00000035/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation {removeItemFromCart(input:{cart_id: "INVALID-CART-ID",cart_item_uid: "1"}){cart{items{uid,product{name}quantity}prices{grand_total{value,currency}}}}}';
      return resolve(args).then(result => {
        const errors = result.errors[0];
        expect(errors).shallowDeepEqual({
          message: 'Error: Request failed with status code 400',
          source: {
            name: 'GraphQL request',
          },
        });
      });
    });

    // todo add test case for entry not found -- Done
    it('Mutation: validate response should contain cart not found', () => {
      scope
        .delete(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/00000035/entries/0`
        )
        .query({ fields: 'DEFAULT', query: '' })
        .reply(400, itemNotFound);
      scope
        .get(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/00000035`
        )
        .query({ fields: 'DEFAULT', access_token: `${bearer}` })
        .reply(200, hybrisRemoveItemCart);
      scope
        .get(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/00000035/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation {removeItemFromCart(input:{cart_id: "00000035",cart_item_uid:"0"}){cart{items{uid,product{name}quantity}prices{grand_total{value,currency}}}}}';
      return resolve(args).then(result => {
        const errors = result.errors[0];
        expect(errors).shallowDeepEqual({
          message: 'Error: Request failed with status code 400',
          source: {
            name: 'GraphQL request',
          },
        });
      });
    });
  });
});
