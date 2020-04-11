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

class CreateEmptyCart {
  /**
   * @param {Object} [parameters.actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info.
   */
  constructor(parameters) {
    this.actionParameters = parameters.actionParameters;
  }

  /**
   * create empty cart method used to create new cart id
   * return the cart id if resolves successfully otherwise return an error
   */
  get createEmptyCart() {
    return new Promise((resolve, reject) => {
      this._createEmptyCart(this.actionParameters)
        .then(res => {
          resolve(res);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  /**
   * method used to call hybris create empty cart api
   */
  _createEmptyCart(actionParameters) {
    const {
      customerId,
      bearer,
      HB_API_BASE_PATH,
      HB_API_HOST,
      HB_PROTOCOL,
      HB_BASESITEID,
    } = actionParameters.context.settings;

    let uri = `${HB_PROTOCOL}://${HB_API_HOST}${HB_API_BASE_PATH}${HB_BASESITEID}/users/${customerId}/carts?fields=DEFAULT`;
    if (customerId === 'current') {
      uri = uri.concat(`&access_token=${bearer}`);
    }
    return rp({
      method: 'POST',
      uri,
      json: true,
    })
      .then(({ code, guid }) => (customerId === 'current' ? code : guid))
      .catch(err => {
        throw new Error(err.message);
      });
  }
}

module.exports = CreateEmptyCart;
