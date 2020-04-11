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
const resolve = require('../../src/countriesResolver').main;
const chai = require('chai');
const expect = require('chai').expect;
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
const nock = require('nock');

chai.use(chaiShallowDeepEqual);

const hybrisCountriesList = require('../resources/hybrisGetCountries');
const validResponseCountriesList = require('../resources/validResponseCountriesList');

describe('Countries Resolver', () => {
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
          HB_PROTOCOL: 'https',
          HB_API_HOST: 'hybris.example.com',
          HB_API_BASE_PATH: '/rest/v2',
          HB_BASESITEID: '/electronics',
        },
      },
    };

    it('Basic countries search', () => {
      scope
        .get('/rest/v2/electronics/countries')
        .query({ fields: 'FULL' })
        .reply(200, hybrisCountriesList);
      args.query = '{countries{two_letter_abbreviation, full_name_english}}';
      return resolve(args).then(result => {
        const { errors } = result;
        const { countries } = result.data;
        expect(countries).to.exist.and.to.deep.equal(
          validResponseCountriesList
        );
        expect(errors).to.be.undefined;
      });
    });
  });
});
