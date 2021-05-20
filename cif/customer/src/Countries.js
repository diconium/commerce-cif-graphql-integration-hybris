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
const RegionLoader = require('./RegionLoader.js');

class Countries {
  /**
   * @param {Object} actionParameters parameter object contains the bearer and host details
   */
  constructor(parameters) {
    this.actionParameters = parameters.actionParameters;
    this.countriesLoader = new CountriesLoader(parameters.actionParameters);
    this.regionLoader = new RegionLoader(parameters.actionParameters);
    return this.countries;
  }

  /**
   *
   * @returns {Promise<unknown>}
   */
  get countries() {
    return this.countriesLoader.load(this.actionParameters.query).then(data => {
      let countryCode = [];
      data.map(country => {
        countryCode.push(country.isocode);
      });
      console.log(countryCode);
      return this.regionLoader.loadMany(countryCode).then(region => {
        Object.keys(data).forEach(function(key) {
          Object.defineProperty(data[key], 'available_regions', {
            value: region[key],
          });
        });
        return this.__convertData(data);
      });
    });
  }

  /**
   * Converts data from the 3rd-party hybris system into the Magento GraphQL format.
   * @param {Object} data parameter data contains countries details
   * @returns {Object} convert the hybris data into magento graphQL schema and return the object
   */
  __convertData(data) {
    return data.map(country => {
      const { isocode, name } = country;
      const availabelRegion =
        country.available_regions.length !== 0
          ? this.formatRegionData(country.available_regions)
          : country.available_regions;
      return {
        id: isocode,
        two_letter_abbreviation: isocode,
        full_name_english: name,
        available_regions: isocode === 'US' ? availabelRegion : [],
      };
    });
  }

  /**
   * Formats region data
   * @param regionData
   * @returns {*}
   */
  formatRegionData(regionData) {
    return regionData.map((region, id) => {
      return {
        name: region.name,
        code: region.isocodeShort,
        id: id + 1,
      };
    });
  }
}

module.exports = Countries;
