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

class ProductInterface {
  /**
   * constructor of the CartItemInterface class
   * @param {*} props parameter contains the cart items
   */
  constructor(props) {
    this.data = props;
  }

  /**
   * method used to return abstract SimpleProduct interface
   */
  get __typename() {
    return 'SimpleProduct';
  }

  /**
   * Method used to return product details name and sku
   */
  get product() {
    return {
      __typename: this.__typename,
      name: this.data.name,
      sku: this.data.code,
    };
  }
}
module.exports = ProductInterface;
