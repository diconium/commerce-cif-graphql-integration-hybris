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

class TestUtils {
  static getHybrisInstance() {
    return hybrisHost;
  }

  static getBearer() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    return chai
      .request(TestUtils.getHybrisInstance())
      .post('/authorizationserver/oauth/token')
      .type('application/x-www-form-urlencoded')
      .send({
        grant_type: 'password',
        username: 'test.user@example.com',
        password: 'Test@123',
        client_secret: 'adobeio20180605',
        client_id: '<CLIENT_ID>',
      })
      .then(response => response.body.access_token)
      .catch(error => error);
  }

  static getOAuthClientBearer() {
    return chai
      .request(TestUtils.getHybrisInstance())
      .post('authorizationserver/oauth/token')
      .type('application/x-www-form-urlencoded')
      .send({
        grant_type: 'client_credentials',
        client_secret: 'adobeio20180605',
        client_id: '<CLIENT_ID>',
      })
      .then(response => response.body.access_token)
      .catch(error => error);
  }

  static getRefreshToken() {
    return chai
      .request(TestUtils.getHybrisInstance())
      .post('authorizationserver/oauth/token')
      .type('application/x-www-form-urlencoded')
      .send({
        grant_type: 'password',
        username: 'test.user@example.com',
        password: 'Test@123',
        client_secret: 'adobeio20180605',
        client_id: '<CLIENT_ID>',
      })
      .then(response => response.body.refresh_token)
      .catch(error => error);
  }
}

module.exports = TestUtils;
