[![CircleCI](https://circleci.com/gh/adobe/commerce-cif-graphql-integration-reference.svg?style=svg)](https://circleci.com/gh/adobe/commerce-cif-graphql-integration-reference)
[![codecov](https://codecov.io/gh/adobe/commerce-cif-graphql-integration-reference/branch/master/graph/badge.svg)](https://codecov.io/gh/adobe/commerce-cif-graphql-integration-reference)

# 3rd-Party GraphQL integration with AEM Commerce and CIF on Adobe I/O Runtime

## 2.5 (July 15 2022)
##### ENHANCEMENTS:
###### Integration Testing on Adobe cloud based on below updates and changes in application accordingly
  * CIF (2.9.0)  ,Venia (2022-05-30) , Commerce-addon(2022-05-31) and Service Pack(6.5.13.0)    upgraded to latest 
  * Magento Upgrade (2.4.3).
  * Node upgradation(14.19.1).
  * Updated ACS Commons to Latest(5.3.2).

  Features added
  * addProductsToCart Mutation.
  * updateCartItems Mutation.
  * removeCartItemFromCart Mutation.
  * Optimized Code across the Hybris connector with demo details.
  * Get categoryList based on url_path.
  * Fixed CategoryPicker dailog box loading issue after CIF upgrade.
  * Code changes and optimization in Category Search since hybris response got changed.
  * Product picker product loading issue solved after CIF upgrade.
  * UpdateCustomerAddress Mutation.
  * DeleteCustomerAddress Mutation. 


## 2.4 (May 4 2022)
##### ENHANCEMENTS: 
  * Changes updated as Latest Adobe CIF release 2.7.2 and Latest Storefront 
  * Category Search functionality implementation
  * Addressed all queries and mutations with respect to latest CIF and Venia
  * Code Optimisation and improvisation on security code check 

 ##### BUGFIXES:
  * Commerce.html, Category Picker and Product Picker components fixes as per latest Schema
  

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

