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

describe('Cart Resolver', () => {
  let getCart;
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
    getCart = sinon.spy(CartLoader.prototype, '__getCartById');
  });

  describe('Integration Tests', () => {
    //Returns object with hybris url and configuaration data
    let args = TestUtils.getContextData();

    before(async () => {
      args.context.settings.bearer = await TestUtils.getBearer();
    });

    it('Cart query', () => {
      args.query =
        '{cart(cart_id: "00000000") {email,billing_address {city,country {code,label},firstname,lastname,postcode, region {code,label},street,telephone},shipping_addresses{firstname,lastname,street,city,region{code,label},country{code,label},available_shipping_methods{amount{currency,value},available,carrier_code,carrier_title,error_message,method_code,method_title,price_excl_tax{value,currency},price_incl_tax{value,currency}},selected_shipping_method{amount{value,currency},carrier_code,carrier_title,method_code,method_title}},items{id,product{name,sku},quantity},available_payment_methods{code,title},selected_payment_method{code,title},applied_coupon{code},prices{grand_total{value,currency}}}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        let response = result.data.cart;
        assert.notEqual(response, null);
        expect(response).to.be.not.empty;
        assert.equal(getCart.callCount, 1);
      });
    });
  });
});
