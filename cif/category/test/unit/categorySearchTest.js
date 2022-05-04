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
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
const nock = require('nock');
chai.use(chaiShallowDeepEqual);
const TestUtils = require('../../../utils/TestUtils.js');
const categoryListLoader = require('../../src/CategoryListLoader.js');
const categorySearchHybris = require('../resources/categorySearchHybrisResponse.json');
const mockRequire = require('mock-require');

describe('category search', function() {
  const scope = nock(TestUtils.getHybrisInstance());
  let resolve;
  let getCategory;
  before(() => {
    // Disable console debugging
    sinon.stub(console, 'debug');
    sinon.stub(console, 'error');
    // Mock openwhisk client
    mockRequire('openwhisk', () => {
      return {
        actions: {
          invoke: options => {
            let resolveData = require(options.actionName).main;
            return resolveData({
              query: options.params.query,
              variables: options.params.variables,
              operationName: options.params.operationName,
              context: options.params.context,
            });
          },
        },
      };
    });

    // The main dispatcher resolver (will use the mock openwhisk client)
    resolve = require('../../../common/dispatcher.js').main;
  });

  after(() => {
    console.debug.restore();
    console.error.restore();
  });

  beforeEach(() => {
    // We "spy" all the loading functions
    getCategory = sinon.spy(categoryListLoader.prototype, '__getCategory');
  });

  afterEach(() => {
    getCategory.restore();
  });

  describe('Unit Tests', () => {
    //Returns object with hybris url and configuaration data
    let args = {
      url: TestUtils.getHybrisInstance(),
      __ow_headers: {
        authorization: '',
      },
      remoteSchemas: {
        category: {
          order: 20,
          action: '../../src/categoryResolver.js',
        },
        product: {
          order: 20,
          action: '../../../product/src/productResolver.js',
        },
      },
    };
    //Returns hybris configured api base path
    const HB_API_BASE_PATH = TestUtils.getYmlData().HB_API_BASE_PATH;

    it('category search ', () => {
      const param = {
        fields: 'DEFAULT',
        json: true,
      };
      scope
        .get(`${HB_API_BASE_PATH}electronics/catalogs`)
        .query(param)
        .reply(200, categorySearchHybris);
      args.variables = {
        pageSize: 20,
        currentPage: 1,
        filters: {
          name: {
            match: 'Cameras',
          },
        },
      };
      args.query =
        'query categoryByFilterPagination($filters:CategoryFilterInput!$pageSize:Int=20$currentPage:Int=1){categories(filters:$filters pageSize:$pageSize currentPage:$currentPage){items{id image name uid url_key url_path __typename children_count}total_count __typename}}';
      return resolve(args).then(result => {
        let response = result.body.data;
        console.log(response);
      });
    });
  });
});
