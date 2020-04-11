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
const Customer = require('./Customer.js');
const SetPaymentMethodOnCart = require('./SetPaymentMethodOnCart.js');
const CreateCustomer = require('./CreateCustomer.js');
const GenerateCustomerToken = require('./GenerateCustomerToken.js');
const RevokeCustomerToken = require('./RevokeCustomerToken.js');

let cachedSchema = null;

function resolve(args) {
  if (cachedSchema == null) {
    let schemaBuilder = new SchemaBuilder(magentoSchema)
      .filterMutationFields(
        new Set([
          'createCustomer',
          'generateCustomerToken',
          'revokeCustomerToken',
          'setPaymentMethodOnCart',
        ])
      )
      .filterQueryFields(new Set(['customer']));

    cachedSchema = schemaBuilder.build();
  }

  let resolvers = {
    customer: (params, context) => {
      return new Customer({
        graphqlContext: context,
        actionParameters: args,
      });
    },
    createCustomer: (params, context) => {
      const { input } = params;
      return new CreateCustomer({
        input,
        graphqlContext: context,
        actionParameters: args,
      });
    },
    generateCustomerToken: context => {
      return new GenerateCustomerToken({
        graphqlContext: context,
        actionParameters: args,
      });
    },
    revokeCustomerToken: (params, context) => {
      return new RevokeCustomerToken({
        graphqlContext: context,
        actionParameters: args,
      });
    },
    setPaymentMethodOnCart: (params, context) => {
      const { input } = params;
      return new SetPaymentMethodOnCart({
        input,
        graphqlContext: context,
        actionParameters: args,
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
