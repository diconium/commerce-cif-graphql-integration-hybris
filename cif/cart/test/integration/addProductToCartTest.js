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

const resolve = require('.././../src/cartResolver.js').main;
const TestUtils = require('../../../utils/TestUtils.js');
const AddProductLoader = require('../../src/AddProductToCartLoader');
const ymlData = require('../../../common/options.json');

describe('AddProductToCart', () => {
  let AddProduct;
  before(() => {
    sinon.stub(console, 'debug');
    sinon.stub(console, 'error');
  });

  after(() => {
    console.debug.restore();
    console.error.restore();
  });

  beforeEach(() => {
    // We "spy" all the loading functions
    AddProduct = sinon.spy(AddProductLoader.prototype, '_addProductToCart');
  });

  describe('Integration Tests', () => {
    let args = {
      url: TestUtils.getHybrisInstance(),
      context: {
        settings: {
          bearer: '',
          customerId: 'current',
          HB_PROTOCOL: ymlData.HB_PROTOCOL,
          HB_API_HOST: ymlData.HB_API_HOST,
          HB_API_BASE_PATH: ymlData.HB_API_BASE_PATH,
          HB_BASESITEID: ymlData.HB_BASESITEID,
        },
      },
    };
    before(async () => {
      args.context.settings.bearer = await TestUtils.getBearer();
    });

    it('Add products to cart', () => {
      //3514521 1298094
      args.query =
        'mutation {addSimpleProductsToCart(input:{cart_id: "00000035", cart_items: [{data: {quantity: "1", sku: "3514521" } }]}){cart {items {id,product { name,sku },quantity} }}}';
      return resolve(args).then(result => {
        assert.isUndefined(result.errors);
        assert.equal(AddProduct.callCount, 1);
      });
    });
  });
});
