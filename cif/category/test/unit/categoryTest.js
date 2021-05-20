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
const expect = require('chai').expect;
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
chai.use(chaiShallowDeepEqual);
const nock = require('nock');
const mockRequire = require('mock-require');
const ProductsLoader = require('../../../product/src/ProductsLoader.js');
const CategoryTreeLoader = require('../../src/CategoryTreeLoader.js');
const ProductLoader = require('../../../product/src/ProductLoader.js');

const basicCategorySearchHybrisResponse = require('../resources/basicCategorySearchHybrisResponse.json');
const basicCategorySearchGraphqlResponse = require('../resources/basicCategorySearchGraphqlResponse.json');
const hybrisResponseCategoryId1 = require('../resources/categoryWithProductDetailsHybrisResponse1.json');
const categoryWithProductDetailsGraphqlResponse = require('../resources/categoryWithProductDetailsGraphqlResponse.json');
const ymlData = require('../../../common/options.json');

describe('Dispatcher Resolver', () => {
  const scope = nock(`${ymlData.HB_PROTOCOL}://${ymlData.HB_API_HOST}`);

  let resolve;
  let searchProducts;
  let getProductBySku;
  let getCategoryById;

  before(() => {
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
    console.error.restore();
  });

  beforeEach(() => {
    // We "spy" all the loading functions
    searchProducts = sinon.spy(ProductsLoader.prototype, '__searchProducts');
    getProductBySku = sinon.spy(ProductLoader.prototype, '__getProductBySku');
    getCategoryById = sinon.spy(
      CategoryTreeLoader.prototype,
      '__getCategoryById'
    );
  });

  afterEach(() => {
    searchProducts.restore();
    getProductBySku.restore();
    getCategoryById.restore();
  });

  describe('Integration Tests', () => {
    let args = {
      url: `${ymlData.HB_PROTOCOL}://${ymlData.HB_API_HOST}`,
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

    it('Basic category search', () => {
      args.query =
        '{categoryList(filters:{category_uid:{eq:"1"}}){uid,name,url_path,url_key,children_count,children{uid,name,url_path,url_key,children_count}}}';
      const param = {
        fields: 'FULL',
        json: true,
      };
      scope
        .get(
          `${ymlData.HB_API_BASE_PATH}electronics/catalogs/electronicsProductCatalog/Online/categories/1`
        )
        .query(param)
        .reply(200, basicCategorySearchHybrisResponse)
        .log(console.log);

      return resolve(args).then(result => {
        assert.isUndefined(result.body.errors); // No GraphQL errors

        let category = result.body.data.categoryList[0];
        assert.equal(category.uid, 1);
        assert.equal(category.name, 'Open Catalogue');

        let children = category.children;
        assert.equal(children.length, 4);

        // Ensure the category loading function is only called once for each category being fetched
        assert.equal(getCategoryById.callCount, 1);
        expect(category).to.deep.equals(basicCategorySearchGraphqlResponse);
      });
    });

    it('Basic category search with product details', () => {
      args.query =
        '{categoryList(filters:{category_uid:{eq:"1"}}){id,products{items{sku,name}},name,description,children{id,name,description,children{id,name,description}}}}';
      let param = {
        fields: 'FULL',
        json: true,
      };
      scope
        .get(
          `${ymlData.HB_API_BASE_PATH}electronics/catalogs/electronicsProductCatalog/Online/categories/1`
        )
        .query(param)
        .reply(200, basicCategorySearchHybrisResponse)
        .log(console.log);
      param = {
        currentPage: 1,
        fields: 'FULL',
        pageSize: 20,
        query: '::allCategories:1',
        json: true,
      };
      scope
        .get(`${ymlData.HB_API_BASE_PATH}electronics/products/search`)
        .query(param)
        .reply(200, hybrisResponseCategoryId1)
        .log(console.log);

      return resolve(args).then(result => {
        assert.isUndefined(result.body.errors); // No GraphQL errors

        let category = result.body.data.categoryList[0];
        assert.equal(category.id, 1);
        assert.equal(category.name, 'Open Catalogue');

        let children = category.children;
        assert.equal(children.length, 4);
        assert.equal(category.products.items.length, 20);

        // Ensure the category loading function is only called once for each category being fetched
        assert.equal(getCategoryById.callCount, 1);

        assert.equal(searchProducts.callCount, 1);
        expect(category).to.deep.equals(
          categoryWithProductDetailsGraphqlResponse
        );
      });
    });

    it('Error when fetching the category data', () => {
      // Replace spy with stub
      getCategoryById.restore();
      getCategoryById = sinon
        .stub(CategoryTreeLoader.prototype, '__getCategoryById')
        .returns(Promise.reject('Connection failed'));

      args.query = '{categoryList(filters:{category_uid:{eq:"1"}}){id}}';
      return resolve(args).then(result => {
        assert.equal(result.body.errors.length, 1);
        assert.equal(result.body.errors[0].message, 'Backend data is null');
        expect(result.body.errors[0].path).to.eql(['categoryList', 0, 'id']);
      });
    });
  });
});
