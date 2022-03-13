[![CircleCI](https://circleci.com/gh/adobe/commerce-cif-graphql-integration-reference.svg?style=svg)](https://circleci.com/gh/adobe/commerce-cif-graphql-integration-reference)
[![codecov](https://codecov.io/gh/adobe/commerce-cif-graphql-integration-reference/branch/master/graph/badge.svg)](https://codecov.io/gh/adobe/commerce-cif-graphql-integration-reference)

# 3rd-Party GraphQL integration with AEM Commerce and CIF on Adobe I/O Runtime

## 2.3 (March 14 2022)
##### ENHANCEMENTS: 
  * Latest Magento Schema Update 
  * Changes in queries and mutations with respect to latest CIF and Venia
  * Code Optimisation and improvisation on security code check 

 ##### BUGFIXES:
  * Commerce.html, Category Picker and Product Picker components fixes as per latest Schema
  NOTE : Category Search in category picker will be implemented in the next release.  


## 2.2 (June 11, 2021)
##### ENHANCEMENTS: 
  * Functionality for Individual Package deployments are added to store the node modules independently with respect to each module.
  * Added Sinon Spies for data loaders in order to test function callback handing.
  * Code Optimisation and improvisation on security code check 
  
##### BUGFIXES:
  * Sonar fixes on Code smell issues.
  

## 2.1 (June 3, 2021)

##### ENHANCEMENTS:

  * Options.JSON is changed to options.yml to store constants
  * Removal of deprecated attribute category_id and cart_item_id and replaced with uid as per latest schema
  * Sort functionality Implementation
  * Code Optimization
  
  
##### BUGFIXES:
  
  * Updated Unit test Cases  

## 2.0 (May 21, 2021)

##### ENHANCEMENTS: 
* Implementation of latest Schema on I/O Connector
* Implementation of latest CIF and query API changes
* Project Execution of AEM CIF - Hybris connectivity through GraphQL API and adapting rest response from Hybris
* Implementation of complete commerce flow from fetching products to order generation
* Revert of all previous code modifications and schema modifications done in 1.0 as Schema was upgraded and core cif components are released with latest patch.
* Removal of request promise

##### BUGFIXES:  

* Unit test upgrade
* Introspection query changes
* Hybris URL endpoint configuration management

## 1.0 (August 16, 2020)
##### ENHANCEMENTS: 
* Initial Commit of Topology design and Architecture planning of I/O Connector
* Project Creation of I/O Connector to connect Hybris and Adobe CIF using Magento Graphql Schema 2.3 version.
* Implementation of complete commerce flow from fetching products to order generation
* Schema modifications as per required input and output for different endpoints
* CIF Core components modification to fetch media based URL
* Schema Attribute changes for cart_item_id from Int to String as per Hybris data retrieval. 

