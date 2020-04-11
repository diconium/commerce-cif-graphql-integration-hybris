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
const PlaceOrder = require('./PlaceOrder.js');

let cachedSchema = null;

function resolve(args) {
  if (cachedSchema == null) {
    let schemaBuilder = new SchemaBuilder(magentoSchema)
      .filterMutationFields(new Set(['placeOrder']))
      .filterQueryFields(new Set(['customerOrders']));

    cachedSchema = schemaBuilder.build();
  }

  // todo the customerorders resolver was placed here to resolve remote schema issues
  // Builds the resolvers object
  let resolvers = {
    placeOrder: (params, context) => {
      return new PlaceOrder({
        cartId: params.input.cart_id,
        graphqlContext: context,
        actionParameters: args,
      });
    },
    customerOrders: () => {
      return Promise.resolve({
        items: [
          {
            order_number: '000000001',
            id: 1,
            created_at: '2019-02-21 00:24:34',
            grand_total: 36.39,
            status: 'processing',
          },
          {
            order_number: '000000002',
            id: 2,
            created_at: '2019-02-21 00:24:35',
            grand_total: 39.64,
            status: 'closed',
          },
        ],
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
