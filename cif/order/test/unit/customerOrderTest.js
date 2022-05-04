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
//const assert = require('chai').assert;
const chai = require('chai');
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
chai.use(chaiShallowDeepEqual);
const hybrisCustomerOrder = require('../resources/hybrisCustomerOrder.json');
const TestUtils = require('../../../utils/TestUtils.js');

describe('Customer order', function() {
  const scope = nock(TestUtils.getHybrisInstance());
  before(() => {
    sinon.stub(console, 'debug');
    sinon.stub(console, 'error');
  });

  after(() => {
    console.debug.restore();
    console.error.restore();
  });

  describe('Validation', () => {
    //Returns object with hybris url and configuaration data
    let args = TestUtils.getContextData();

    //Returns hybris configured api base path
    const HB_API_BASE_PATH = TestUtils.getYmlData().HB_API_BASE_PATH;

    it('Query: Customer Order List', () => {
      scope
        .get(`${HB_API_BASE_PATH}electronics/users/current/orders`)
        .query({
          fields: 'DEFAULT',
          access_token: `${TestUtils.getContextData().context.settings.bearer}`,
        })
        .reply(200, hybrisCustomerOrder);
      args.query = `{customerOrders {items {id,grand_total,status}}}`;
      return resolve(args).then(result => {
        console.log(result);
        // const customerOrders = result.data.customerOrders;
        // const item = customerOrders.items[0];
        // assert.equal(item.id, 'bd34cedd-8e7a-46a0-949b-84bc9ce4b86c');
        // assert.equal(item.status, 'FRAUD_CHECKED');
      });
    });
  });
});
