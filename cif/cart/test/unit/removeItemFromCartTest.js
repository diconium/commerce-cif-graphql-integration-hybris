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
const cartNotFound = require('../resources/cartNotFound.json');
const bearer = 'efa24b05-8b84-4f3a-a72c-61cc9aa10a70';

describe('RemoveItemFromCart', () => {
  const scope = nock('https://hybris.example.com');

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
      url: 'https://hybris.example.com',
      context: {
        settings: {
          bearer: '',
          customerId: 'current',
          HB_PROTOCOL: 'https',
          HB_API_HOST: 'hybris.example.com',
          HB_API_BASE_PATH: '/rest/v2',
          HB_BASESITEID: '/electronics',
        },
      },
    };

    it('Remove item from cart with valid cartId', () => {
      scope
        .delete('/rest/v2/electronics/users/current/carts/00000058/entries/0')
        .query({ fields: 'DEFAULT', access_token: `${bearer}` })
        .reply(200);
      scope
        .get('/rest/v2/electronics/users/current/carts/00000058')
        .query({ fields: 'FULL', access_token: `${bearer}` })
        .reply(200, hybrisRemoveItemCart);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation {removeItemFromCart(input:{cart_id: "00000058",cart_item_id: 0}){cart{items{id,product{name}quantity}prices{grand_total{value,currency}}}}}';
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
        .delete('/rest/v2/electronics/users/current/carts/0000004/entries/0')
        .query({ fields: 'DEFAULT', access_token: `${bearer}` })
        .reply(400, cartNotFound);
      scope
        .get('/rest/v2/electronics/users/current/carts/0000004')
        .query({ fields: 'DEFAULT', access_token: `${bearer}` })
        .reply(200, hybrisRemoveItemCart);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation {removeItemFromCart(input:{cart_id: "0000004",cart_item_id: 0}){cart{items{id,product{name}quantity}prices{grand_total{value,currency}}}}}';
      return resolve(args).then(result => {
        const errors = result.errors[0];
        expect(errors).shallowDeepEqual({
          message: 'Cart not found.',
          source: {
            name: 'GraphQL request',
          },
        });
      });
    });

    // todo add test case for entry not found
  });
});
