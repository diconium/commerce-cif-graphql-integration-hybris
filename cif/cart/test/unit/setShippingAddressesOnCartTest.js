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
const nock = require('nock');
const assert = require('chai').assert;
const hybrisShippingAddress = require('../resources/hybrisShippingAddress.json');
const hybrisDeliveryModes = require('../resources/hybrisDeliveryModes.json');
const validResponseSetShippingAddress = require('../resources/validResponseSetShippingAddress.json');
const cartNotFound = require('../resources/cartNotFound.json');
const invalidRegionCode = require('../resources/invalidRegionCode.json');
const invalidCountryCode = require('../resources/invalidCountryCode.json');
const TestUtils = require('../../../utils/TestUtils.js');
const bearer = '55af3c02-6dd3-4b45-92c2-38db35a2c43d';
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
chai.use(chaiShallowDeepEqual);
const ymlData = require('../../../common/options.json');

describe('SetShippingAddress OnCart', function() {
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

    it('Mutation: Should successfully post shipping address for the cart', () => {
      scope
        .post(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/00000016/addresses/delivery`
        )
        .query({ fields: 'DEFAULT', access_token: `${bearer}` })
        .reply(200, hybrisShippingAddress);
      scope
        .get(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/00000016/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation {setShippingAddressesOnCart(input: {cart_id: "00000016", shipping_addresses: [{address: {firstname: "Bob", lastname: "Roll", company: "Magento", street: ["Magento Pkwy", "Main Street"], city: "Austin", region: "US-WA", postcode: "78758", country_code: "US", telephone: "9999998899", save_in_address_book: false}}]}) { cart {shipping_addresses {firstname,lastname,company,street,city,region {code,label},postcode,telephone,country {code,label} }}}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        let setShippingAddressesOnCart =
          result.data.setShippingAddressesOnCart.cart.shipping_addresses[0];
        expect(setShippingAddressesOnCart).to.deep.equals(
          validResponseSetShippingAddress
        );
      });
    });

    it('Mutation: validate response should contain cart not found', () => {
      scope
        .post(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/INVALID-CART-ID/addresses/delivery`
        )
        .query({ fields: 'DEFAULT', access_token: `${bearer}` })
        .reply(400, cartNotFound);
      scope
        .get(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/INVALID-CART-ID/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation {setShippingAddressesOnCart(input: {cart_id: "INVALID-CART-ID", shipping_addresses: [{address: {firstname: "Bob", lastname: "Roll", company: "Magento", street: ["Magento Pkwy", "Main Street"], city: "Austin", region: "US-WA", postcode: "78758", country_code: "US", telephone: "9999998899", save_in_address_book: false}}]}) { cart {shipping_addresses {firstname,lastname,company,street,city,region {code,label},postcode,telephone,country {code,label} }}}}';
      return resolve(args).then(result => {
        const errors = result.errors[0];
        expect(errors).to.shallowDeepEqual({
          message: 'Request failed with status code 400',
          source: {
            name: 'GraphQL request',
          },
        });
      });
    });

    it('Mutation: validate response should contain invalid region code found', () => {
      scope
        .post(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/00000016/addresses/delivery`
        )
        .query({ fields: 'DEFAULT', access_token: `${bearer}` })
        .reply(400, invalidRegionCode);
      scope
        .get(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/00000016/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation {setShippingAddressesOnCart(input: {cart_id: "00000016", shipping_addresses: [{address: {firstname: "Bob", lastname: "Roll", company: "Magento", street: ["Magento Pkwy", "Main Street"], city: "Austin", region: "US-W", postcode: "78758", country_code: "US", telephone: "9999998899", save_in_address_book: false}}]}) { cart {shipping_addresses {firstname,lastname,company,street,city,region {code,label},postcode,telephone,country {code,label} }}}}';
      return resolve(args).then(result => {
        const errors = result.errors[0];
        expect(errors).to.shallowDeepEqual({
          message: 'Request failed with status code 400',
          source: {
            name: 'GraphQL request',
          },
        });
      });
    });

    it('Mutation: validate response should contain invalid country code', () => {
      scope
        .post(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/00000016/addresses/delivery`
        )
        .query({ fields: 'DEFAULT', access_token: `${bearer}` })
        .reply(400, invalidCountryCode);
      scope
        .get(
          `${ymlData.HB_API_BASE_PATH}electronics/users/current/carts/00000016/deliverymodes`
        )
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisDeliveryModes);
      args.context.settings.bearer = bearer;
      args.query =
        'mutation {setShippingAddressesOnCart(input: {cart_id: "00000016", shipping_addresses: [{address: {firstname: "Bob", lastname: "Roll", company: "Magento", street: ["Magento Pkwy", "Main Street"], city: "Austin", region: "US-WA", postcode: "78758", country_code: "U", telephone: "9999998899", save_in_address_book: false}}]}) { cart {shipping_addresses {firstname,lastname,company,street,city,region {code,label},postcode,telephone,country {code,label} }}}}';
      return resolve(args).then(result => {
        const errors = result.errors[0];
        expect(errors).to.shallowDeepEqual({
          message: 'Request failed with status code 400',
          source: {
            name: 'GraphQL request',
          },
        });
      });
    });
  });
});
