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

const CountriesLoader = require('./CountriesLoader.js');

class Countries {
  constructor(parameters) {
    this.actionParameters = parameters.actionParameters;
    this.countriesLoader = new CountriesLoader(parameters.actionParameters);

    return this.countries;
  }

  get countries() {
    return this.countriesLoader.load(this.actionParameters.query).then(data => {
      return this.__convertData(data);
    });
  }

  __convertData(data) {
    return data.map(country => {
      const { isocode, name } = country;
      return {
        two_letter_abbreviation: isocode,
        full_name_english: name,
      };
    });
  }
}

module.exports = Countries;
