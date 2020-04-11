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
const resolve = require('../../src/customerResolver.js').main;
const nock = require('nock');

const bearer = '9b5a39e5-13af-4cca-bcd0-824c2439c484';

const hybrisCustomer = require('../resources/hybrisGetCustomer');
const hybrisGetCustomerAddress = require('../resources/hybrisGetCustomerAddress');
const validResponseCustomer = require('../resources/validResponseCustomer');

chai.use(chaiShallowDeepEqual);

describe('Customer Resolver', () => {
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

    it('Basic Customer search', () => {
      scope
        .get('/rest/v2/electronics/users/current')
        .query({ fields: 'DEFAULT', access_token: `${bearer}` })
        .reply(200, hybrisCustomer);

      args.context.settings.bearer = bearer;
      args.query = '{customer{firstname, lastname}}';
      return resolve(args).then(result => {
        let customer = result.data.customer;
        const { errors } = result;
        assert.equal(customer.firstname, 'karan test');
        assert.equal(customer.lastname, 'sharma test');
        assert.isUndefined(result.errors);
        expect(errors).to.be.undefined;
        expect(customer).to.deep.equals(validResponseCustomer);
      });
    });

    it('Basic Customer search with addresses', () => {
      scope
        .get('/rest/v2/electronics/users/current')
        .query({ fields: 'DEFAULT', access_token: `${bearer}` })
        .reply(200, hybrisCustomer);

      scope
        .get('/rest/v2/electronics/users/current/addresses')
        .query({ fields: 'DEFAULT', access_token: `${bearer}` })
        .reply(200, hybrisGetCustomerAddress);

      args.context.settings.bearer = bearer;
      args.query =
        '{customer{firstname, lastname, addresses{firstname, lastname, street}}}';
      return resolve(args).then(result => {
        let addresses = result.data.customer.addresses;
        let street = addresses[0].street;
        expect(addresses[0].firstname).to.be.equal('José');
        expect(street[0]).to.be.equal('street name');
        expect(street[1]).to.be.equal('34');
        expect(result.errors).to.be.undefined;
      });
    });
  });
});
