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

const DataLoader = require('dataloader');
const rp = require('request-promise');

class CountriesLoader {
  constructor(actionParameters) {
    let cacheKeyFunction = key => JSON.stringify(key, null, 0);

    let loadingFunction = keys => {
      return Promise.resolve(
        keys.map(key => {
          console.debug(
            '--> Performing a get countries with ' +
              JSON.stringify(key, null, 0)
          );
          return this.__countries(actionParameters).catch(error => {
            console.error(
              `Failed loading countries ${JSON.stringify(
                key,
                null,
                0
              )}, got error ${JSON.stringify(error, null, 0)}`
            );
            return null;
          });
        })
      );
    };

    this.loader = new DataLoader(keys => loadingFunction(keys), {
      cacheKeyFn: cacheKeyFunction,
    });
  }

  load(key) {
    return this.loader.load(key);
  }

  __countries(actionParameters) {
    const {
      HB_API_BASE_PATH,
      HB_API_HOST,
      HB_PROTOCOL,
      HB_BASESITEID,
    } = actionParameters.context.settings;

    return rp({
      uri: `${HB_PROTOCOL}://${HB_API_HOST}${HB_API_BASE_PATH}${HB_BASESITEID}/countries?fields=FULL`,
      json: true,
    })
      .then(response => response.countries)
      .catch(() => ({
        countries: [],
      }));
  }
}

module.exports = CountriesLoader;
