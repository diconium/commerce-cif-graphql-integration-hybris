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
const resolve = require('../../src/cartResolver.js').main;
const TestUtils = require('../../../utils/TestUtils.js');
const RemoveItemLoader = require('../../src/RemoveItemFromCartLoader');

describe('RemoveItemFromCart', () => {
  let RemoveItem;
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
    RemoveItem = sinon.spy(RemoveItemLoader.prototype, '_removeItemFromCart');
  });

  afterEach(() => {
    RemoveItem.restore();
  });

  describe('Integration Tests', () => {
    //Returns object with hybris url and configuaration data
    let args = TestUtils.getContextData();

    before(async () => {
      args.context.settings.bearer = await TestUtils.getBearer();
    });

    it('Remove item from cart', () => {
      args.query =
        'mutation { removeItemFromCart( input: { cart_id: "00000035", cart_item_uid: "0" }) {cart { items {uid,product { name } quantity } prices { grand_total{ value,currency}}}}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        assert.equal(RemoveItem.callCount, 1);
      });
    });
  });
});
