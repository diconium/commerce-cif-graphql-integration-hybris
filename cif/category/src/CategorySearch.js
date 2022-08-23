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
const CategorySearchLoader = require('../src/CategorySearchLoader');

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
    this.categorySearchLoader = new CategorySearchLoader(
      parameters.graphqlContext
    );

    return new LoaderProxy(this);
  }

  /**
   *  method used to call the load method from categorySearchLoader class
   */
  __load() {
    return this.categorySearchLoader.load(this.actionParameters);
  }

  /**
   * Converts category data from the 3rd-party hybris system into the Magento GraphQL format.
   * @param {Object} data parameter data contains category data details from hybris
   * @returns {Object} convert the hybris data into magento graphQL schema and return the category object
   */
  __convertData(data) {
    let searchedCategory = this.parmas.filters.name.match;

    //Covert first letter of each words to UpperCase
    let searchedCategoryName = searchedCategory
      .split(' ')
      .map(word => {
        return word[0].toUpperCase() + word.substring(1);
      })
      .join(' ');

    /**
     * map and filter each categories data
     */
    let categoriesData = data.catalogs
      .flatMap(categoryData => {
        return categoryData.catalogVersions;
      })
      .flatMap(categoryData => {
        return categoryData;
      })
      .flatMap(categoryData => {
        return categoryData.categories;
      });

    /**
     *  filter and includes method used to check whether searched category name exists in catalog array
     */

    let filteredSubcategoriesData = categoriesData
      .flatMap(categoryData => {
        return categoryData.subcategories.flatMap(
          subcategoryData => subcategoryData
        );
      })
      .filter(
        searchCategoryNameData =>
          searchCategoryNameData.name !== undefined &&
          searchCategoryNameData.name.includes(searchedCategoryName)
      );

    let filteredSubcategoriesDataLevelOne = categoriesData
      .flatMap(categoryData => {
        return categoryData.subcategories.flatMap(subcategoryData => {
          return subcategoryData.subcategories.flatMap(
            subcategoryData => subcategoryData
          );
        });
      })
      .filter(
        searchCategoryNameData =>
          searchCategoryNameData.name !== undefined &&
          searchCategoryNameData.name.includes(searchedCategoryName)
      );

    let filteredSubcategoriesDataLevelTwo = categoriesData
      .flatMap(categoryData => {
        return categoryData.subcategories.flatMap(subcategoryData => {
          return subcategoryData.subcategories.flatMap(subcategoryData => {
            return subcategoryData.subcategories.flatMap(
              subcategoryData => subcategoryData
            );
          });
        });
      })
      .filter(searchCategoryNameData =>
        searchCategoryNameData.name.includes(searchedCategoryName)
      );

    let filteredSubcategoriesDataLevelThree = categoriesData
      .flatMap(categoryData => {
        return categoryData.subcategories.flatMap(subcategoryData => {
          return subcategoryData.subcategories.flatMap(subcategoryData => {
            return subcategoryData.subcategories.flatMap(subcategoryData => {
              return subcategoryData.subcategories.flatMap(
                subcategoryData => subcategoryData
              );
            });
          });
        });
      })
      .filter(searchCategoryNameData =>
        searchCategoryNameData.name.includes(searchedCategoryName)
      );

    let filteredSearchCategoryNameData = [];

    filteredSearchCategoryNameData = filteredSubcategoriesData.concat(
      filteredSubcategoriesDataLevelOne,
      filteredSubcategoriesDataLevelTwo,
      filteredSubcategoriesDataLevelThree
    );

    return {
      items: filteredSearchCategoryNameData.map(categoryName => {
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
      total_count: filteredSearchCategoryNameData.length,
    };
  }
}

module.exports = CategorySearch;
