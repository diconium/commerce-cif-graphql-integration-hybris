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
const chai = require('chai');
const assert = require('chai').assert;
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
chai.use(chaiShallowDeepEqual);
const TestUtils = require('../../../utils/TestUtils.js');
const resolve = require('../../src/customAttributeMetadataResolver.js').main;
const ymlData = require('../../../common/options.json');

describe('Dispatcher Resolver', () => {
  before(() => {
    // Disable console debugging
    sinon.stub(console, 'debug');
    sinon.stub(console, 'error');
  });

  after(() => {
    console.debug.restore();
    console.error.restore();
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

    it('Basic meta data search', () => {
      args.query =
        '{customAttributeMetadata(attributes:[{attribute_code:"category_uid",entity_type:"4"},{attribute_code:"description",entity_type:"4"},{attribute_code:"name",entity_type:"4"},{attribute_code:"price",entity_type:"4"},{attribute_code:"short_description",entity_type:"4"},{attribute_code:"sku",entity_type:"4"},{attribute_code:"url_key",entity_type:"4"}]){items{attribute_code,attribute_type,input_type}}}';

      return resolve(args).then(result => {
        assert.isUndefined(result.body.errors); // No GraphQL errors
      });
    });
  });
});
