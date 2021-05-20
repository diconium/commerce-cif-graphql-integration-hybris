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
const TestUtils = require('../../../utils/TestUtils.js');
const hybrisCountriesList = require('../resources/hybrisGetCountries');
const hybrisRegionsAF = require('../resources/hybrisRegionsAF.json');
const hybrisRegionsUS = require('../resources/hybrisRegionsUS.json');
const validResponseCountriesList = require('../resources/validResponseCountriesList');
const ymlData = require('../../../common/options.json');

describe('Countries Resolver', () => {
  const scope = nock(`${ymlData.HB_PROTOCOL}://${ymlData.HB_API_HOST}`);

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
      url: TestUtils.getHybrisInstance(),
      context: {
        settings: {
          HB_PROTOCOL: ymlData.HB_PROTOCOL,
          HB_API_HOST: ymlData.HB_API_HOST,
          HB_API_BASE_PATH: ymlData.HB_API_BASE_PATH,
          HB_BASESITEID: ymlData.HB_BASESITEID,
        },
      },
    };

    it('Basic countries search', () => {
      scope
        .get(`${ymlData.HB_API_BASE_PATH}electronics/countries`)
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisCountriesList);
      scope
        .get(`${ymlData.HB_API_BASE_PATH}electronics/countries/AF/regions`)
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisRegionsAF);
      scope
        .get(`${ymlData.HB_API_BASE_PATH}electronics/countries/US/regions`)
        .query({ fields: 'FULL', query: '' })
        .reply(200, hybrisRegionsUS);
      args.query = '{countries{two_letter_abbreviation, full_name_english}}';
      return resolve(args).then(result => {
        console.log(result);
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
