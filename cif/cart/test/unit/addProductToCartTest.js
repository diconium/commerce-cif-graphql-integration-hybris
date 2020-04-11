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
const resolve = require('../../src/cartResolver.js').main;
const nock = require('nock');
const hybrisAddSimpleProductToCart = require('../resources/hybrisAddSimpleProductToCart');
const validResponseAddSimpleProductToCart = require('../resources/validResponseAddSimpleProductToCart');
const inValidCart = require('../resources/inValidJsonFileAddSimpleProductToCart.json');
const bearer = '668c6483-ea82-4fcf-b181-06507c683d6c';

describe('AddProductToCart', () => {
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

    it('Add products to cart nock test case', () => {
      scope
        .post('/rest/v2/electronics/users/current/carts/00000000/entries')
        .query({ fields: 'DEFAULT', access_token: `${bearer}` })
        .reply(200, hybrisAddSimpleProductToCart);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation {addSimpleProductsToCart(input: {cart_id: "00000000", cart_items: [{data: {quantity: 1, sku: "3514521"}}]}) {cart {items {id, product {name,sku},quantity}}}}';
      return resolve(args).then(result => {
        let items = result.data.addSimpleProductsToCart.cart.items[0];
        let testData = validResponseAddSimpleProductToCart.items[0];
        const { errors } = result;
        assert.isUndefined(result.errors);
        expect(errors).to.be.undefined;
        assert.equal(items.id, testData.id);
        assert.equal(items.quantity, testData.quantity);
        assert.equal(items.product.name, testData.product.name);
        assert.equal(items.product.sku, testData.product.sku);
      });
    });

    it('Mutation: validate response should contain cart not found', () => {
      scope
        .post('/rest/v2/electronics/users/current/carts/00000002/entries')
        .query({ fields: 'DEFAULT', access_token: `${bearer}` })
        .reply(400, inValidCart);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation {addSimpleProductsToCart(input: {cart_id: "00000002", cart_items: [{data: {quantity: 1, sku: "3514521"}}]}) {cart {items {id, product {name,sku},quantity}}}}';
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
  });
});
