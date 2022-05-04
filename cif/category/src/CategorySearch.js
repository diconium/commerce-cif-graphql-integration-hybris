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

const LoaderProxy = require('../../common/LoaderProxy.js');
const CategoryListLoader = require('../src/CategoryListLoader');

class CategorySearch {
  /**
   * @param {Object} parameters parameter object contains the ,graphqlContext & actionParameters
   * @param {Object} [parameters.graphqlContext] The optional GraphQL execution context passed to the resolver.
   * @param {Object} [parameters.actionParameters] Some optional parameters of the I/O Runtime action, like for example customerId, bearer token, query and url info.
   * LoaderProxy class returns a Proxy to avoid having to implement a getter for all properties.
   */
  constructor(parameters) {
    this.parmas = parameters.params;
    this.graphqlContext = parameters.graphqlContext;
    this.actionParameters = parameters.actionParameters;
    this.categoryListLoader = new CategoryListLoader(parameters.graphqlContext);

    return new LoaderProxy(this);
  }

  /**
   *  method used to call the load method from categoryListLoader class
   */
  __load() {
    return this.categoryListLoader.load(this.actionParameters);
  }

  /**
   * Converts category data from the 3rd-party hybris system into the Magento GraphQL format.
   * @param {Object} data parameter data contains category data details from hybris
   * @returns {Object} convert the hybris data into magento graphQL schema and return the category object
   */
  __convertData(data) {
    let words = this.parmas.filters.name.match;

    //Covert first letter of each words to UpperCase
    let searchedName = words
      .split(' ')
      .map(word => {
        return word[0].toUpperCase() + word.substring(1);
      })
      .join(' ');

    let filteredCategoryData =
      data.catalogs[0].catalogVersions[1].categories[2];

    let subCategoryData = filteredCategoryData.subcategories.flatMap(
      categoryData => categoryData
    );

    let subCategoriesData = subCategoryData.flatMap(subCategory => {
      return subCategory.subcategories.flatMap(subCatData => subCatData);
    });

    let subCategoriesData1 = subCategoriesData.flatMap(subCategory => {
      return subCategory.subcategories.flatMap(subCatData => subCatData);
    });
    let subCategoriesData2 = subCategoriesData1.flatMap(subCategory => {
      return subCategory.subcategories.flatMap(subCatData => subCatData);
    });

    let searchedCategoryName = [];

    /**
     *  filtered and includes method used to check whether searched category name exists in catalog array
     */
    let searchedCategoryData = subCategoryData.filter(searchName =>
      searchName.name.includes(searchedName)
    );

    let searchedCategoryData1 = subCategoriesData.filter(searchName =>
      searchName.name.includes(searchedName)
    );

    let searchedCategoryData2 = subCategoriesData1.filter(searchName =>
      searchName.name.includes(searchedName)
    );

    let searchedCategoryData3 = subCategoriesData2.filter(searchName =>
      searchName.name.includes(searchedName)
    );

    searchedCategoryName = searchedCategoryData.concat(
      searchedCategoryData1,
      searchedCategoryData2,
      searchedCategoryData3
    );
    return {
      items: searchedCategoryName.map(categoryName => {
        return {
          id: categoryName.id,
          image: null,
          name: categoryName.name,
          uid: categoryName.id,
          url_key: categoryName.name,
          url_path: categoryName.url,
          children_count: null,
        };
      }),
      total_count: searchedCategoryName.length,
    };
  }
}

module.exports = CategorySearch;
