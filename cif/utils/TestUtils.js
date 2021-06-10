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

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const hybrisHost = require('../../package.json').hybrishost;
const Options = require('../common/Options.js');
const bearer = '9b5a39e5-13af-4cca-bcd0-824c2439c484';

class TestUtils {
  static getHybrisInstance() {
    return hybrisHost;
  }
  static getYmlData() {
    return Options.get();
  }

  static getUserData() {
    return {
      username: 'test@example.com',
      password: 'Embitel@123',
      client_secret: 'adobeio20180605',
      client_id: '<Client_ID>',
      type: 'application/x-www-form-urlencoded',
    };
  }

  static getContextData() {
    let ymlData = this.getYmlData();
    return {
      url: TestUtils.getHybrisInstance(),
      context: {
        settings: {
          bearer: bearer,
          customerId: 'current',
          HB_PROTOCOL: ymlData.HB_PROTOCOL,
          HB_API_HOST: ymlData.HB_API_HOST,
          HB_API_BASE_PATH: ymlData.HB_API_BASE_PATH,
          HB_BASESITEID: ymlData.HB_BASESITEID,
          HB_CLIENTSECRET: ymlData.HB_CLIENTSECRET,
          HB_CLIENTID: ymlData.HB_CLIENTID,
          HB_OAUTH_PATH: ymlData.HB_OAUTH_PATH,
        },
      },
    };
  }

  static getBearer() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    return chai
      .request(TestUtils.getHybrisInstance())
      .post('/authorizationserver/oauth/token')
      .type(this.getUserData().type)
      .send({
        grant_type: 'password',
        username: this.getUserData().username,
        password: this.getUserData().password,
        client_secret: this.getUserData().client_secret,
        client_id: this.getUserData().client_id,
      })
      .then(response => response.body.access_token)
      .catch(error => error);
  }

  static getOAuthClientBearer() {
    return chai
      .request(TestUtils.getHybrisInstance())
      .post('authorizationserver/oauth/token')
      .type(this.getUserData().type)
      .send({
        grant_type: 'client_credentials',
        client_secret: this.getUserData().client_secret,
        client_id: this.getUserData().client_id,
      })
      .then(response => response.body.access_token)
      .catch(error => error);
  }

  static getRefreshToken() {
    return chai
      .request(TestUtils.getHybrisInstance())
      .post('authorizationserver/oauth/token')
      .type(this.getUserData().type)
      .send({
        grant_type: 'password',
        username: this.getUserData().username,
        password: this.getUserData().password,
        client_secret: this.getUserData().client_secret,
        client_id: this.getUserData().client_id,
      })
      .then(response => response.body.refresh_token)
      .catch(error => error);
  }
}

module.exports = TestUtils;
