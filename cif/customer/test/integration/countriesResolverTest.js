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
const CountryLoader = require('../../src/CountriesLoader.js');
const resolve = require('../../src/countriesResolver.js').main;
const TestUtils = require('../../../utils/TestUtils.js');

describe('Countries Resolver', () => {
  //let resolve;
  let getCountriesList;
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
    getCountriesList = sinon.spy(CountryLoader.prototype, '__countries');
  });

  afterEach(() => {
    getCountriesList.restore();
  });

  describe('Integration Tests', () => {
    //Returns object with hybris url and configuaration data
    let args = TestUtils.getContextData();

    it('Basic countries search', () => {
      args.query = '{countries{two_letter_abbreviation, full_name_english}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        let responseData = result.data;
        assert.notEqual(responseData, null);
        expect(result.errors).to.be.undefined;
        assert.equal(getCountriesList.callCount, 1);
      });
    });
  });
});
