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
const TokenUtils = require('../../common/TokenUtils.js');

class CreateCustomerLoader {
  constructor(actionParameters) {
    let loadingFunction = keys => {
      return Promise.resolve(
        keys.map(key => {
          return this._createCustomer(key, actionParameters).catch(error => {
            console.error(
              `Failed loading cart ${key}, got error ${JSON.stringify(
                error,
                null,
                0
              )}`
            );
            throw new Error(error.message);
          });
        })
      );
    };
    this.loader = new DataLoader(keys => loadingFunction(keys));
  }

  load(key) {
    return this.loader.load(key);
  }
  _createCustomer(key, actionParameters) {
    const {
      HB_API_BASE_PATH,
      HB_API_HOST,
      HB_PROTOCOL,
      HB_BASESITEID,
    } = actionParameters.context.settings;

    let body = {
      firstName: key.firstname,
      lastName: key.lastname,
      password: key.password,
      titleCode: '',
      uid: key.email,
    };

    return TokenUtils.getOAuthClientBearer(actionParameters).then(bearer => {
      return rp({
        method: 'POST',
        uri: `${HB_PROTOCOL}://${HB_API_HOST}${HB_API_BASE_PATH}${HB_BASESITEID}/users?fields=DEFAULT&access_token=${bearer}`,
        body: body,
        json: true,
      })
        .then(response => response)
        .catch(err => err);
    });
  }
}

module.exports = CreateCustomerLoader;
