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

const rp = require('request-promise');

class TokenUtils {
  static getOAuthClientBearer(actionParameters) {
    const {
      HB_CLIENTID,
      HB_CLIENTSECRET,
      HB_OAUTH_PATH,
      HB_API_HOST,
      HB_PROTOCOL,
    } = actionParameters.context.settings;

    return rp({
      uri: `${HB_PROTOCOL}://${HB_API_HOST}${HB_OAUTH_PATH}?operationType=oAuth`,
      method: 'POST',
      form: {
        HB_CLIENTID,
        HB_CLIENTSECRET,
        grant_type: 'client_credentials',
      },
    })
      .then(response => JSON.parse(response).access_token)
      .catch(err => err);
  }
}

module.exports = TokenUtils;
