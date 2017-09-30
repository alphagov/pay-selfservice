'use strict'

/**
 @class Product
 */
class Product {
  /**
   * Create an instance of Product
   * @param {Object} productData - raw 'product' object from server
   * @param {string} productData.external_product_id - The external ID of the product
   * @param {string} productData.external_service_id - The external ID of the service
   * @param {string} productData.name - The name of the product
   * @param {string} productData.description - The name of the product
   * @param {long} productData.price - price of the product
   * @param {string} productData.return_url - return url of where to redirect for any charge of this product
   **/
  constructor (productData) {
    this.externalProductId = productData.external_product_id
    this.externalServiceId = productData.external_service_id
    this.name = productData.name
    this.description = productData.description || ''
    this.price = productData.price
    this.returnUrl = productData.return_url || ''
    this.catalogueExternalId = productData.catalogue_external_id
    this.payLink = productData._links.find(link => link.rel === 'pay')
    this.selfLink = productData._links.find(link => link.rel === 'self')
  }

  /**
   * @method toJson
   * @returns {Object} json representation of the Product
   */
  toJson () {
    return {
      external_product_id: this.externalProductId,
      external_service_id: this.externalServiceId,
      name: this.name,
      description: this.description,
      price: this.price,
      return_url: this.returnUrl,
      catalogue_external_id: this.catalogueExternalId,
      _links: [this.selfLink, this.payLink]
    }
  }
}

module.exports = Product
