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
const Countries = require('./Countries.js');
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
let cachedSchema = null;

/**
 *
 * @param args
 * @returns {Promise<ExecutionResult<ExecutionResultDataDefault>>}
 */
function resolve(args) {
  if (cachedSchema == null) {
    const schemaBuilder = new SchemaBuilder()
      .removeMutationType()
      .filterQueryFields(new Set(['countries']));

    cachedSchema = schemaBuilder.build();
  }

  /**
   * method used to getcountries in hybris
   * @param {Object} params parameter contains input,graphqlContext and actionParameters
   * @param {cachedSchema} context parameter contains the context of the GraphQL Schema
   */
  const resolvers = {
    countries: () => {
      return new Countries({
        actionParameters: args,
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
