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

const { parse } = require('graphql');

class SchemaPruner {
  /**
   * @param {*} jsonSchema The schema in JSON format, as returned by an introspection query.
   */
  constructor(jsonSchema) {
    // Copy the original (complete) Magento schema: needed because node.js "caches" modules
    this.schema = JSON.parse(JSON.stringify(jsonSchema, null, 0));
    this.typeFields = {};
  }

  /**
   * Processes a query and adds it to the internal list of fields being queried.
   *
   * @param {String} query A GraphQL query.
   */
  process(query) {
    const ast = parse(query);
    ast.definitions.forEach(def => {
      const op = def.operation.charAt(0).toUpperCase() + def.operation.slice(1);
      const parentType = this.__getType(op);
      this.__extractTypeFields(parentType, def);
    });
  }

  /**
   * This maintains a map of types and fields used by the GraphQL queries processed by the SchemaPruner.
   * The map also "collects" the arguments of input fields.
   *
   * @param {*} parentType The GraphQL type currently being processed.
   * @param {*} selection The field or argument currently being processed.
   */
  __extractTypeFields(parentType, selection) {
    if (!selection.selectionSet) {
      return;
    }

    selection.selectionSet.selections.forEach(sel => {
      if (sel.kind === 'Field') {
        this.__addToTypeFields(parentType.name, sel.name.value);
        const field = parentType.fields.find(f => f.name === sel.name.value);
        if (field) {
          const fieldType = this.__getFieldType(field);
          if (fieldType.kind === 'OBJECT' || fieldType.kind === 'INTERFACE') {
            const type = this.__getType(fieldType.name);
            this.__extractTypeFields(type, sel);
          }
        }

        if (sel.arguments) {
          sel.arguments.forEach(arg => {
            const key = `${parentType.name}.${sel.name.value}`;
            this.__addToTypeFields(key, arg.name.value);
            if (field) {
              const argField = field.args.find(f => f.name === arg.name.value);
              if (argField) {
                const argFieldType = this.__getFieldType(argField);
                if (argFieldType.kind === 'INPUT_OBJECT') {
                  const type = this.__getType(argFieldType.name);
                  if (arg.value.fields) {
                    arg.value.fields.forEach(f => {
                      this.__extractArgument(type, f);
                    });
                  } else if (arg.value.values) {
                    // Arguments can also be arrays
                    arg.value.values.forEach(value => {
                      value.fields.forEach(arg2 => {
                        this.__extractArgument(type, arg2);
                      });
                    });
                  }
                }
              }
            }
          });
        }
      } else if (sel.kind === 'InlineFragment' && sel.typeCondition) {
        const type = this.__getType(sel.typeCondition.name.value);
        this.__extractTypeFields(type, sel);
      }
    });
  }

  __getFieldType(field) {
    let fieldType = field.type;
    // LIST and NOT_NULL can be nested in multiple levels
    while (fieldType.kind === 'LIST' || fieldType.kind === 'NON_NULL') {
      fieldType = fieldType.ofType;
    }
    return fieldType;
  }

  /**
   * Returns the GraphQL type with the given typeName.
   *
   * @param {*} typeName The name of the type, for example 'ProductInterface'.
   */
  __getType(typeName) {
    return this.schema.data.__schema.types.find(t => t.name === typeName);
  }

  /**
   * This method "collects" the arguments used by input fields.
   *
   * @param {*} parentType The GraphQL type currently being processed.
   * @param {*} selection The argument currently being processed.
   */
  __extractArgument(parentType, argument) {
    this.__addToTypeFields(parentType.name, argument.name.value);
    const field = parentType.inputFields.find(
      f => f.name === argument.name.value
    );
    if (field) {
      const fieldType = this.__getFieldType(field);
      if (fieldType.kind === 'INPUT_OBJECT') {
        const type = this.__getType(fieldType.name);
        if (argument.value.fields) {
          argument.value.fields.forEach(arg => {
            this.__extractArgument(type, arg);
          });
        } else if (argument.value.values) {
          // Arguments can also be arrays
          argument.value.values.forEach(value => {
            value.fields.forEach(arg => {
              this.__extractArgument(type, arg);
            });
          });
        } else {
          // We don't know what fields should be kept so we add them all
          // This happens for parameterized queries with object arguments
          type.inputFields.forEach(f => {
            this.__extractInputField(type, f);
          });
        }
      }
    }
  }

  __extractInputField(type, inputField) {
    this.__addToTypeFields(type.name, inputField.name);
    const inputFieldType = this.__getFieldType(inputField);
    if (inputFieldType.kind === 'INPUT_OBJECT') {
      type = this.__getType(inputFieldType.name);
      // We don't know what fields should be kept so we add them all
      // This happens for parameterized queries with object arguments
      type.inputFields.forEach(f => {
        this.__extractInputField(type, f);
      });
    }
  }

  /**
   * Used in JSON.stringify(...) to display the content of the 'typeFields' instance variable.
   */
  __setToJson(key, value) {
    if (typeof value === 'object' && value instanceof Set) {
      return [...value];
    }
    return value;
  }

  /**
   * Adds a new 'value' to the 'key' SET entry of the 'typeFields' instance variable.
   *
   * @param {String} key The GraphQL type, for example 'ProductInterface'.
   * @param {String} value The field or argument, for example 'sku'.
   */
  __addToTypeFields(key, value) {
    if (this.typeFields[key] === undefined) {
      this.typeFields[key] = new Set();
    }
    this.typeFields[key].add(value);
  }

  /**
   * Prunes the GraphQL schema based on all the processed queries.
   * This method returns the pruned schema used in the constructor.
   */
  prune() {
    // We first remove all unused types
    this.schema.data.__schema.types = this.schema.data.__schema.types.filter(
      type => {
        if (
          type.kind === 'OBJECT' ||
          type.kind === 'INPUT_OBJECT' ||
          type.kind === 'INTERFACE'
        ) {
          return this.typeFields[type.name];
        } else {
          return true; // For simplicity, we keep all SCALAR and ENUM types
        }
      }
    );
    // We remove all references to interfaces that have been removed
    this.schema.data.__schema.types.forEach(type => {
      if (type.interfaces && type.interfaces.length > 0) {
        type.interfaces = type.interfaces.filter(
          iface => this.typeFields[iface.name]
        );
      }
    });

    // We remove all unused fields from interfaces
    this.schema.data.__schema.types.forEach(type => {
      if (type.kind === 'INTERFACE') {
        const fields = this.typeFields[type.name];
        type.fields = type.fields.filter(field => fields.has(field.name));
      }
    });

    // We remove all unused fields from objects, but keep fields still defined in interfaces
    this.schema.data.__schema.types.forEach(type => {
      if (type.kind === 'OBJECT' || type.kind === 'INPUT_OBJECT') {
        const fields = this.typeFields[type.name];
        if (type.kind === 'INPUT_OBJECT') {
          type.inputFields = type.inputFields.filter(field =>
            fields.has(field.name)
          );
        } else {
          type.fields = type.fields.filter(field => {
            if (fields.has(field.name)) {
              return true;
            } else if (type.interfaces && type.interfaces.length > 0) {
              return type.interfaces.some(iface => {
                const interfaceType = this.__getType(iface.name);
                return interfaceType.fields.find(f => f.name === field.name);
              });
            } else {
              return false;
            }
          });

          // If the field has arguments, we filter them
          type.fields.forEach(field => {
            if (field.args && field.args.length > 0) {
              const argFields = this.typeFields[`${type.name}.${field.name}`];
              field.args = field.args.filter(
                arg => argFields && argFields.has(arg.name)
              );
            }
          });
        }
      }
    });

    return this.schema;
  }
}

module.exports = SchemaPruner;
