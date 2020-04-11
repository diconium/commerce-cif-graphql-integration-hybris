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
const CartLoader = require('../../src/CartLoader.js');
const TestUtils = require('../../../utils/TestUtils.js');

// The cart resolver
const resolve = require('../../src/cartResolver.js').main;

describe('Shipping Address on Cart', () => {
  before(() => {
    // Disable console debugging
    sinon.stub(console, 'debug');
    sinon.stub(console, 'error');
  });

  after(() => {
    console.debug.restore();
    console.error.restore();
  });

  describe('Integration Tests', () => {
    let args = {
      url: TestUtils.getHybrisInstance(),
      context: {
        settings: {
          bearer: '',
          customerId: 'current',
        },
      },
    };

    it('Mutation: set shipping address on cart', () => {
      return TestUtils.getBearer().then(accessToken => {
        args.context.settings.bearer = accessToken;
        args.query =
          'mutation {setShippingAddressesOnCart(input: {cart_id: "00000080", shipping_addresses: [{address: {firstname: "Bob", lastname: "Roll", company: "Magento", street: ["Magento shipping", "Main Street"], city: "Austin", region: "US-WA", postcode: "78758", country_code: "US", telephone: "9999998899", save_in_address_book: false}}]}) { cart {shipping_addresses {firstname,lastname,company,street,city,region {code,label},postcode,telephone,country {code,label} }}}}';
        return resolve(args).then(result => {
          assert.isUndefined(result.errors); // No GraphQL errors
        });
      });
    });

    it('Error when fetching the cart data', () => {
      let stub = sinon
        .stub(CartLoader.prototype, '__getCartById')
        .returns(Promise.reject('Connection failed'));
      args.query = '{cart(cart_id:"abcd"){email}}';
      return resolve(args)
        .then(result => {
          assert.equal(result.errors.length, 1);
          assert.equal(result.errors[0].message, 'Backend data is null');
          expect(result.errors[0].path).to.eql(['cart', 'email']);
        })
        .finally(() => {
          stub.restore();
        });
    });
  });
});
