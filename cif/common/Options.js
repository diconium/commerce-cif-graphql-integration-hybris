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
// const ymlFilePath = './options.json';
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
let ymlData = require('./options.yml');

// Options class to get data from options.yml, For testcase there is no webpack loader
// so read the options.yml file by fs.readfilesync and converted to json data by js-yaml

class Options {
  static get() {
    if (Object.keys(ymlData).length) return ymlData;
    try {
      const optionsContent = fs.readFileSync(
        path.join(__dirname, './options.yml'),
        'utf-8'
      );
      ymlData = yaml.safeLoad(optionsContent);
      return ymlData;
    } catch (e) {
      return {};
    }
  }
}
module.exports = Options;
