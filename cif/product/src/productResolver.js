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

const { graphql } = require('graphql');
const SchemaBuilder = require('../../common/SchemaBuilder.js');
const { Products, ProductsBySkus } = require('../../common/Catalog.js');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let cachedSchema = null;

function resolve(args) {
  if (cachedSchema == null) {
    const schemaBuilder = new SchemaBuilder()
      .removeMutationType()
      .filterQueryFields(new Set(['products']));

    // const queryRootType = schemaBuilder.getType('Query');

    /** Remove "sort" unimplemented args of the "products" field */
    // let productsField = queryRootType.fields.find(f => f.name == 'products');
    // productsField.args = productsField.args.filter(a => a.name != 'sort');
    /** Remove all fields from ProductFilterInput except "sku" */
    const productFilterInput = schemaBuilder.getType('ProductFilterInput');
    productFilterInput.inputFields = productFilterInput.inputFields.filter(
      f => f.name === 'sku' || f.name === 'url_key'
    );

    cachedSchema = schemaBuilder.build();
  }

  const resolvers = {
    products: (params, context) => {
      let skusFlag = false;
      if (params.filter !== undefined) {
        if (params.filter.sku !== undefined) {
          if (params.filter.sku.in !== undefined) {
            skusFlag = true;
          }
        }
      }
      if (skusFlag) {
        return new ProductsBySkus({
          search: params,
          graphqlContext: context,
          actionParameters: args,
        });
      } else {
        return new Products({
          search: params,
          graphqlContext: context,
          actionParameters: args,
        });
      }
    },
    categories: (params, context) => {
      return new Products({
        search: params,
        categoryId: params.filters,
        graphqlContext: context,
        actionParameters: args,
        categories: true,
      });
    },
  };

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
