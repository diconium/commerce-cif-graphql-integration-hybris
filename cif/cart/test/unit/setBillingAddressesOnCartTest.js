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
const resolve = require('../../../cart/src/cartResolver.js').main;
const chai = require('chai');
const { expect } = chai;
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
chai.use(chaiShallowDeepEqual);
const nock = require('nock');
const assert = require('chai').assert;
const hybrisBillingAddress = require('../resources/hybrisBillingAddress.json');
const validResponseSetBillingAddress = require('../resources/validResponseSetBillingAddress.json');
const cartNotFound = require('../resources/cartNotFound.json');
const invalidRegionCode = require('../resources/invalidRegionCode.json');
const invalidCountryCode = require('../resources/invalidCountryCode.json');
const BillingAddressLoader = require('../../src/SetBillingAddressOnCartLoader');
const TestUtils = require('../../../utils/TestUtils.js');

describe('SetBillingAddress OnCart', function() {
  const scope = nock(TestUtils.getHybrisInstance());
  let BillingAddress;
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
    BillingAddress = sinon.spy(
      BillingAddressLoader.prototype,
      '_setBillingAddressOnCart'
    );
  });

  afterEach(() => {
    BillingAddress.restore();
  });

  //Returns object with hybris url and configuaration data
  let args = TestUtils.getContextData();

  //Returns hybris configured api base path
  const HB_API_BASE_PATH = TestUtils.getYmlData().HB_API_BASE_PATH;

  it('Mutation: Should successfully post billing address for the cart', () => {
    scope
      .post(`${HB_API_BASE_PATH}electronics/users/current/addresses`)
      .query({ fields: 'DEFAULT' })
      .reply(200, hybrisBillingAddress);

    args.query =
      'mutation {setBillingAddressOnCart(input: {cart_id: "00000035", billing_address: {address: {firstname: "Bob", lastname: "Roll", company: "Magento", street: ["Magento Pkwy", "Main Street"], city: "Austin", region: "US-WA", postcode: "78758", country_code: "US", telephone: "9999998899", save_in_address_book: true}, use_for_shipping: false}}) {cart { billing_address {firstname,lastname,company,street,city, region {code, label}, postcode,telephone,country {code,label}}}}}';
    return resolve(args).then(result => {
      assert.isUndefined(result.errors);
      assert.equal(BillingAddress.callCount, 1);
      let setBillingAddressesOnCart =
        result.data.setBillingAddressOnCart.cart.billing_address;
      expect(setBillingAddressesOnCart).to.deep.equals(
        validResponseSetBillingAddress
      );
    });
  });

  it('Mutation: validate response should contain cart not found', () => {
    scope
      .post(`${HB_API_BASE_PATH}electronics/users/current/addresses`)
      .query({ fields: 'DEFAULT' })
      .reply(400, cartNotFound);

    args.query =
      'mutation {setBillingAddressOnCart(input: {cart_id: "00000002", billing_address: {address: {firstname: "Bob", lastname: "Roll", company: "Magento", street: ["Magento Pkwy", "Main Street"], city: "Austin", region: "US-WA", postcode: "78758", country_code: "US", telephone: "9999998899", save_in_address_book: true}, use_for_shipping: false}}) {cart { billing_address {firstname,lastname,company,street,city, region {code, label}, postcode,telephone,country {code,label}}}}}';
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

  it('Mutation: validate response should contain invalid region code found', () => {
    scope
      .post(`${HB_API_BASE_PATH}electronics/users/current/addresses`)
      .query({ fields: 'DEFAULT' })
      .reply(400, invalidRegionCode);

    args.query =
      'mutation {setBillingAddressOnCart(input: {cart_id: "00000004", billing_address: {address: {firstname: "Bob", lastname: "Roll", company: "Magento", street: ["Magento Pkwy", "Main Street"], city: "Austin", region: "US-WA", postcode: "78758", country_code: "US", telephone: "9999998899", save_in_address_book: true}, use_for_shipping: false}}) {cart { billing_address {firstname,lastname,company,street,city, region {code, label}, postcode,telephone,country {code,label}}}}}';
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

  it('Mutation: validate response should contain invalid country code', () => {
    scope
      .post(`${HB_API_BASE_PATH}electronics/users/current/addresses`)
      .query({ fields: 'DEFAULT' })
      .reply(400, invalidCountryCode);

    args.query =
      'mutation {setBillingAddressOnCart(input: {cart_id: "00000004", billing_address: {address: {firstname: "Bob", lastname: "Roll", company: "Magento", street: ["Magento Pkwy", "Main Street"], city: "Austin", region: "US-WA", postcode: "78758", country_code: "US", telephone: "9999998899", save_in_address_book: true}, use_for_shipping: false}}) {cart { billing_address {firstname,lastname,company,street,city, region {code, label}, postcode,telephone,country {code,label}}}}}';
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
