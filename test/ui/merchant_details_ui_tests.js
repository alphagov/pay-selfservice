var path = require('path')
var renderTemplate = require(path.join(__dirname, '/../test_helpers/html_assertions.js')).render

describe('The merchant details view', function () {
  it('should display merchant details for a service', function () {
    const templateData = {
      merchant_details: {
        name: 'name',
        address_line1: 'line1',
        address_line2: 'line2',
        address_city: 'city',
        address_postcode: 'postcode',
        address_country: 'BS'
      },
      countries: [
        {
          'entry': {
            'country': 'BS',
            'name': 'The Bahamas',
            'selected': true
          }
        }
      ],
      permissions: {
        merchant_details_read: true
      }
    }

    const body = renderTemplate('merchant_details/edit_merchant_details', templateData)
    body.should.containSelector('#merchant-details-form')
    body.should.containSelector('#merchant-name').withAttribute('value', 'name')
    body.should.containSelector('#address-line1').withAttribute('value', 'line1')
    body.should.containSelector('#address-line2').withAttribute('value', 'line2')
    body.should.containSelector('#address-city').withAttribute('value', 'city')
    body.should.containSelector('#address-postcode').withAttribute('value', 'postcode')
    body.should.not.containSelector('.error-summary')
    body.should.not.containSelector('.notification')
  })

  it('should display empty form if merchant details are not set', function () {
    const templateData = {
      permissions: {
        merchant_details_read: true
      }
    }

    const body = renderTemplate('merchant_details/edit_merchant_details', templateData)
    body.should.containSelector('#merchant-details-form')
    body.should.containSelector('#merchant-name').withAttribute('value', '')
    body.should.containSelector('#address-line1').withAttribute('value', '')
    body.should.containSelector('#address-line2').withAttribute('value', '')
    body.should.containSelector('#address-city').withAttribute('value', '')
    body.should.containSelector('#address-postcode').withAttribute('value', '')
    body.should.not.containSelector('.error-summary')
    body.should.not.containSelector('.notification')
  })

  it('should display errors form if errors are set', function () {
    const templateData = {
      errors: {
        some: 'error'
      },
      permissions: {
        merchant_details_read: true
      }
    }

    const body = renderTemplate('merchant_details/edit_merchant_details', templateData)
    body.should.containSelector('.error-summary')
    body.should.not.containSelector('.notification')
  })

  it('should display success form', function () {
    const templateData = {
      success: true,
      permissions: {
        merchant_details_read: true
      }
    }

    const body = renderTemplate('merchant_details/edit_merchant_details', templateData)
    body.should.not.containSelector('.error-summary')
    body.should.containSelector('.notification')
  })
})
