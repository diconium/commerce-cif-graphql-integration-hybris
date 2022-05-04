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

class CustomerOrderItemInterface {
  /**
   * @param {Object} parameters
   * @param {ID} parameters.id The unique ID for a OrderItemInterface object
   * @param {String} parameters.product_name The name of the base product .
   * @param {String} parameters.product_sku The SKU of the base product .
   * @param {String} parameters.product_url_key URL key of the base product.
   * @param {Money} parameters.product_sale_price The sale price of the base product, including selected options.
   * @param {OrderItemOption} parameters.selected_options The selected options for the base product, such as color or size
   * @param {Float} parameters.quantity_ordered The number of invoiced items.
   *
   */
  constructor(parameters) {
    this.id = parameters.id;
    this.product_name = parameters.product_name;
    this.product_sale_price = parameters.product_sale_price;
    this.product_sku = parameters.product_sku;
    this.product_url_key = parameters.product_url_key;
    this.selected_options = parameters.selected_options;
    this.quantity_ordered = parameters.quantity_ordered;
  }
  /**
   * method used to return abstract OrderItem interface
   */
  get __typename() {
    return 'OrderItem';
  }
}

module.exports = CustomerOrderItemInterface;
