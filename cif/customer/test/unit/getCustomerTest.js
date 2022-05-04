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
const chai = require('chai');
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
const nock = require('nock');
const resolve = require('../../../customer/src/customerResolver.js').main;
chai.use(chaiShallowDeepEqual);
const TestUtils = require('../../../utils/TestUtils.js');
const CustomerLoader = require('../../src/CustomerLoader.js');
const HybrisUpdateCustomer = require('../resources/hybrisUpdatedCustomerResponse.json');
const HybrisCustomerOrder = require('../../../order/test/resources/hybrisCustomerOrder.json');
const HybrisCustomerOrders = require('../../../order/test/resources/hybrisCustomerOrders.json');
const HybrisCustomerOrders1 = require('../../../order/test/resources/hybrisCustomerOrders1.json');
describe('get Customer Resolver', function() {
  const scope = nock(TestUtils.getHybrisInstance());
  let getCustomer;
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
    getCustomer = sinon.spy(CustomerLoader.prototype, 'getCustomer');
  });

  afterEach(() => {
    getCustomer.restore();
  });

  describe('Unit Tests', () => {
    //Returns object with hybris url and configuaration data
    let args = TestUtils.getContextData();

    //Returns hybris configured api base path
    const HB_API_BASE_PATH = TestUtils.getYmlData().HB_API_BASE_PATH;

    it('get customer  mutation', () => {
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current`)
        .query({ fields: 'DEFAULT', query: '' })
        .reply(200, HybrisUpdateCustomer);
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/orders`)
        .query({
          fields: 'DEFAULT',
          access_token: `${TestUtils.getContextData().context.settings.bearer}`,
        })
        .reply(200, HybrisCustomerOrder);
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/orders/00000058`)
        .query({
          fields: 'FULL',
          access_token: `${TestUtils.getContextData().context.settings.bearer}`,
        })
        .reply(200, HybrisCustomerOrders);
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/orders/00000063`)
        .query({
          fields: 'FULL',
          access_token: `${TestUtils.getContextData().context.settings.bearer}`,
        })
        .reply(200, HybrisCustomerOrders1);
      args.variables = {
        filter: {
          number: {
            match: '',
          },
        },
        pageSize: 10,
      };
      args.query =
        'query GetCustomerOrders($filter:CustomerOrdersFilterInput$pageSize:Int!){customer{id orders(filter:$filter pageSize:$pageSize){...CustomerOrdersFragment __typename}__typename}}fragment CustomerOrdersFragment on CustomerOrders{items{billing_address{city country_code firstname lastname postcode region street telephone __typename}id invoices{id __typename}items{id product_name product_sale_price{currency value __typename}product_sku product_url_key selected_options{label value __typename}quantity_ordered __typename}number order_date payment_methods{name type additional_data{name value __typename}__typename}shipments{id tracking{number __typename}__typename}shipping_address{city country_code firstname lastname postcode region street telephone __typename}shipping_method status total{discounts{amount{currency value __typename}__typename}grand_total{currency value __typename}subtotal{currency value __typename}total_shipping{currency value __typename}total_tax{currency value __typename}__typename}__typename}page_info{current_page total_pages __typename}total_count __typename}';
      return resolve(args).then(result => {
        let response = result.data;
        console.log(response);
        assert.equal(response.customer.id, 1);
      });
    });

    it('get customer order  mutation', () => {
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current`)
        .query({ fields: 'DEFAULT', query: '' })
        .reply(200, HybrisUpdateCustomer);
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/orders`)
        .query({
          fields: 'DEFAULT',
          access_token: `${TestUtils.getContextData().context.settings.bearer}`,
        })
        .reply(200, HybrisCustomerOrder);
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/orders/00000063`)
        .query({
          fields: 'FULL',
          access_token: `${TestUtils.getContextData().context.settings.bearer}`,
        })
        .reply(200, HybrisCustomerOrders1);
      args.variables = {
        filter: {
          number: {
            match: '00000063',
          },
        },
        pageSize: 10,
      };
      args.query =
        'query GetCustomerOrders($filter:CustomerOrdersFilterInput$pageSize:Int!){customer{id orders(filter:$filter pageSize:$pageSize){...CustomerOrdersFragment __typename}__typename}}fragment CustomerOrdersFragment on CustomerOrders{items{billing_address{city country_code firstname lastname postcode region street telephone __typename}id invoices{id __typename}items{id product_name product_sale_price{currency value __typename}product_sku product_url_key selected_options{label value __typename}quantity_ordered __typename}number order_date payment_methods{name type additional_data{name value __typename}__typename}shipments{id tracking{number __typename}__typename}shipping_address{city country_code firstname lastname postcode region street telephone __typename}shipping_method status total{discounts{amount{currency value __typename}__typename}grand_total{currency value __typename}subtotal{currency value __typename}total_shipping{currency value __typename}total_tax{currency value __typename}__typename}__typename}page_info{current_page total_pages __typename}total_count __typename}';
      return resolve(args).then(result => {
        let response = result.data;
        console.log(response);
        assert.equal(response.customer.id, 1);
      });
    });
  });
});
