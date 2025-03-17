/**
 * @class MerchantDetails
 * @property {string} organisationName
 * @property {string} addressLine1
 * @property {string} addressLine2
 * @property {string} addressCity
 * @property {string} addressPostcode
 * @property {string} addressCountry
 * @property {string} telephoneNumber
 * @property {string} url
 */
class MerchantDetails {
  toJson () {
    return {
      name: this.organisationName,
      address_line1: this.addressLine1,
      address_line2: this.addressLine2,
      address_city: this.addressCity,
      address_postcode: this.addressPostcode,
      address_country: this.addressCountry,
      telephone_number: this.telephoneNumber,
      url: this.organisationUrl
    }
  }

  static fromJson (merchantDetailsData) {
    const details = new MerchantDetails()
    details.organisationName = merchantDetailsData?.name
    details.addressLine1 = merchantDetailsData?.address_line1
    details.addressLine2 = merchantDetailsData?.address_line2 || ''
    details.addressCity = merchantDetailsData?.address_city
    details.addressPostcode = merchantDetailsData?.address_postcode
    details.addressCountry = merchantDetailsData?.address_country
    details.telephoneNumber = merchantDetailsData?.telephone_number
    details.organisationUrl = merchantDetailsData?.url
    /** @deprecated */
    details.rawResponse = merchantDetailsData

    return details
  }
}

module.exports = MerchantDetails
