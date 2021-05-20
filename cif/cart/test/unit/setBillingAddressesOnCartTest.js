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
const TestUtils = require('../../../utils/TestUtils.js');
const bearer = 'a7db795c-b1c2-46d9-a201-16130b6099af';
const ymlData = require('../../../common/options.json');

describe('SetBillingAddress OnCart', function() {
  const scope = nock(`${ymlData.HB_PROTOCOL}://${ymlData.HB_API_HOST}`);
  before(() => {
    sinon.stub(console, 'debug');
    sinon.stub(console, 'error');
  });

  after(() => {
    console.debug.restore();
    console.error.restore();
  });

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

  it('Mutation: Should successfully post billing address for the cart', () => {
    scope
      .post(`${ymlData.HB_API_BASE_PATH}electronics/users/current/addresses`)
      .query({ fields: 'DEFAULT' })
      .reply(200, hybrisBillingAddress);
    args.context.settings.bearer = bearer;
    args.query =
      'mutation {setBillingAddressOnCart(input: {cart_id: "00000035", billing_address: {address: {firstname: "Bob", lastname: "Roll", company: "Magento", street: ["Magento Pkwy", "Main Street"], city: "Austin", region: "US-WA", postcode: "78758", country_code: "US", telephone: "9999998899", save_in_address_book: true}, use_for_shipping: false}}) {cart { billing_address {firstname,lastname,company,street,city, region {code, label}, postcode,telephone,country {code,label}}}}}';
    return resolve(args).then(result => {
      assert.isUndefined(result.errors);
      let setBillingAddressesOnCart =
        result.data.setBillingAddressOnCart.cart.billing_address;
      expect(setBillingAddressesOnCart).to.deep.equals(
        validResponseSetBillingAddress
      );
    });
  });

  it('Mutation: validate response should contain cart not found', () => {
    scope
      .post(`${ymlData.HB_API_BASE_PATH}electronics/users/current/addresses`)
      .query({ fields: 'DEFAULT' })
      .reply(400, cartNotFound);
    args.context.settings.bearer = bearer;
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
      .post(`${ymlData.HB_API_BASE_PATH}electronics/users/current/addresses`)
      .query({ fields: 'DEFAULT' })
      .reply(400, invalidRegionCode);
    args.context.settings.bearer = bearer;
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
      .post(`${ymlData.HB_API_BASE_PATH}electronics/users/current/addresses`)
      .query({ fields: 'DEFAULT' })
      .reply(400, invalidCountryCode);
    args.context.settings.bearer = bearer;
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
