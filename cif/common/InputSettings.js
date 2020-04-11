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

class InputSettings {
  constructor(args) {
    //todo remove these 3 values and shift to options yaml file
    this.HB_CLIENTSECRET = 'oauth-client-secret';
    this.HB_CLIENTID = 'oauth-clientid';
    this.HB_OAUTH_PATH = '/authorizationserver/oauth/token';
    this.HB_API_HOST = 'hybris.example.com';
    this.HB_API_BASE_PATH = '/rest/v2';
    this.HB_BASESITEID = 'electronics';
    this.HB_PROTOCOL = 'https';

    this.headers = this.extractHeaders(args);
    this.cookies = this.extractCookiesFromHeaders();
    this.bearer = this.extractBearer();
    this.customerId = this.getCustomerId();
    this.language = this.findHeaderValue('accept-language');
  }

  extractHeaders(args) {
    if (args.__ow_headers) {
      return args.__ow_headers;
    }
    return {};
  }

  extractCookiesFromHeaders() {
    if (this.headers && this.headers.cookie) {
      const cookies = this.headers.cookie.split('; ');
      return this.getCookies(cookies);
    }
    return [];
  }

  getCookies(cookies) {
    return cookies.map(cookie => {
      const cookieObject = {};
      const cookieKeyValue = cookie.split('=');
      cookieObject[cookieKeyValue[0]] = cookieKeyValue[1];
      return cookieObject;
    });
  }

  extractBearer() {
    let bearer = this.findCookieValue('ccs-access_token');
    bearer = this.extractedFromAuthorizationHeader(bearer);
    return bearer;
  }

  findCookieValue(cookieName) {
    const cookie = this.cookies.find(cookie =>
      Object.prototype.hasOwnProperty.call(cookie, 'cookieName')
    );
    if (cookie) {
      return cookie[cookieName];
    }
    return '';
  }

  extractedFromAuthorizationHeader(bearer) {
    if (bearer === '') {
      if (this.headers && this.headers.authorization) {
        return this.getAuthorization(this.headers.authorization);
      }
    }
    return bearer;
  }

  getAuthorization(authorizationHeader) {
    if (authorizationHeader.includes('Bearer ')) {
      return authorizationHeader.split('Bearer ')[1];
    }
    return '';
  }

  getCustomerId() {
    return this.bearer ? 'current' : 'anonymous';
  }

  findHeaderValue(headerName) {
    const headerValue = this.headers[headerName];
    if (headerValue) {
      return headerValue;
    }
    return '';
  }
}
module.exports = InputSettings;
