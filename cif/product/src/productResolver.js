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

const magentoSchema = require('../../resources/magento-schema-2.3.2.min.json');
const { graphql } = require('graphql');
const SchemaBuilder = require('../../common/SchemaBuilder.js');
const { Products } = require('../../common/Catalog.js');

let cachedSchema = null;

function resolve(args) {
  if (cachedSchema == null) {
    let schemaBuilder = new SchemaBuilder(magentoSchema)
      .removeMutationType()
      .filterQueryFields(new Set(['products']));

    let queryRootType = schemaBuilder.getType('Query');

    // Remove "sort" unimplemented args of the "products" field
    let productsField = queryRootType.fields.find(f => f.name == 'products');
    productsField.args = productsField.args.filter(a => a.name != 'sort');
    // Remove all fields from ProductFilterInput except "sku"
    let productFilterInput = schemaBuilder.getType('ProductFilterInput');
    productFilterInput.inputFields = productFilterInput.inputFields.filter(
      f => f.name == 'sku' || f.name === 'url_key'
    );

    cachedSchema = schemaBuilder.build();
  }

  // Builds the resolvers object
  let resolvers = {
    products: (params, context) => {
      return new Products({
        search: params,
        graphqlContext: context,
        actionParameters: args,
      });
    },
  };

  // The resolver for this action
  return graphql(
    cachedSchema,
    args.query,
    resolvers,
    args.context,
    args.variables,
    args.operationName
  )
    .then(response => {
      return response;
    })
    .catch(error => {
      console.error(error);
    });
}

module.exports.main = resolve;
