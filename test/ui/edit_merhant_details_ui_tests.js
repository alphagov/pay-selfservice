'use strict'

// Custom dependencies
const renderTemplate = require('../test_helpers/html_assertions').render
const paths = require('../../app/paths')
const countries = require('../../app/services/countries')

describe('Merchant details view', function () {
  const countriesData = countries.retrieveCountries('GB')

  it('should render empty merchant details form', function (done) {
    const templateData = {}

    const body = renderTemplate('merchant_details/edit_merchant_details', templateData)

    body.should.containSelector('h1').withExactText('Merchant details')

    body.should.containSelector('form#merchant-details-form').withAttribute('action', paths.merchantDetails.update)
    body.should.containInputField('merchant-name', 'text')
    body.should.containInputField('address-line1', 'text')
    body.should.containInputField('address-line2', 'text')
    body.should.containInputField('address-city', 'text')
    body.should.containInputField('address-postcode', 'text')
    body.should.containSelect('address-country')

    done()
  })

  it('should render prefilled merchant details form', function (done) {
    const templateData = {
      countries: countriesData,
      merchant_details: {
        name: 'Merchant name',
        address_line1: 'Address line 1',
        address_line2: 'Address line 2',
        address_city: 'City',
        address_postcode: 'E1 8QS',
        address_country: 'GB'
      }
    }

    const body = renderTemplate('merchant_details/edit_merchant_details', templateData)

    body.should.containSelector('h1').withExactText('Merchant details')

    body.should.containSelector('form#merchant-details-form').withAttribute('action', paths.merchantDetails.update)
    body.should.containInputField('merchant-name', 'text').withAttribute('value', templateData.merchant_details.name)
    body.should.containInputField('address-line1', 'text').withAttribute('value', templateData.merchant_details.address_line1)
    body.should.containInputField('address-line2', 'text').withAttribute('value', templateData.merchant_details.address_line2)
    body.should.containInputField('address-city', 'text').withAttribute('value', templateData.merchant_details.address_city)
    body.should.containInputField('address-postcode', 'text').withAttribute('value', templateData.merchant_details.address_postcode)
    body.should.containSelectedOption('address-country', templateData.merchant_details.address_country)

    done()
  })
})
