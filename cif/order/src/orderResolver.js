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
const PlaceOrder = require('./PlaceOrder.js');
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
let cachedSchema = null;

function resolve(args) {
  if (cachedSchema == null) {
    let schemaBuilder = new SchemaBuilder()
      .filterMutationFields(new Set(['placeOrder']))
      .filterQueryFields(new Set(['customerOrders']));

    cachedSchema = schemaBuilder.build();
  }

  // todo the customerorders resolver was placed here to resolve remote schema issues
  /**
   * method used to placeOrder in hybris
   * @param {Object} params parameter contains input,graphqlContext and actionParameters
   * @param {cachedSchema} context parameter contains the context of the GraphQL Schema
   */
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

  /**
   * The resolver for this action
   * @param {cachedSchema} cachedSchema parameter contains the catched schema of GraphQL
   * @param {Object} query parameter contains the query of GraphQL
   * @param {cachedSchema} resolvers parameter resolvers of the particular action
   * @param {Object} context parameter contains the context of GraphQL
   * @param {cachedSchema} variables parameter contains the variables of GraphQL
   * @param {Object} operationName parameter contains the operationName of GraphQL context.
   * @returns {Promise} a promise resolves and return the response.
   */
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
