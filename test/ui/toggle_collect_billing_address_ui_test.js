'use strict'

const path = require('path')
const renderTemplate = require(path.join(__dirname, '/../test_helpers/html_assertions.js')).render

describe('The toggle Billing Address page', function () {
  it('should display content when setting is off', () => {
    const templateData = {
      'collectBillingAddress': false,
      permissions: {
        toggle_billing_address_read: true,
        toggle_billing_address_update: true
      }
    }

    const body = renderTemplate('billing-address/index', templateData)

    body.should.containSelector('h1').withExactText('You are not collecting the billing address')
    body.should.containSelector('#billing-address-on-button').withExactText('Turn on billing address')
    body.should.containSelector('#billing-address-add-section-message').withText('Turning on the billing address adds the billing address section to the payment page.')
  })
  it('should display the confirmation page', () => {
    const templateData = {
      'collectBillingAddress': false,
      permissions: {
        toggle_billing_address_read: true,
        toggle_billing_address_update: true
      }
    }

    const body = renderTemplate('billing-address/confirm-off', templateData)

    body.should.containSelector('h1').withExactText('Are you sure you want to turn off the billing address?')
    body.should.containSelector('#billing-address-confirm-off-button').withExactText('Yes, turn off billing address')
  })
  it('should display the read only view', () => {
    const templateData = {
      'collectBillingAddress': false,
      permissions: {
        toggle_billing_address_read: true,
        toggle_billing_address_update: false
      }
    }

    const body = renderTemplate('billing-address/index', templateData)
    body.should.containSelector('h1').withExactText('You are not collecting the billing address')
    body.should.containSelector('.pay-info-warning-box').withExactText('You don’t have permission to manage settings. Contact your service admin if you would like to manage 3D secure, accepted card types, email notifications, or billing address.')
  })
  it('should display content when setting is on', () => {
    const templateData = {
      'collectBillingAddress': true,
      permissions: {
        toggle_billing_address_read: true,
        toggle_billing_address_update: true
      }
    }

    const body = renderTemplate('billing-address/index', templateData)

    body.should.containSelector('h1').withExactText('You are collecting the billing address')
    body.should.containSelector('#billing-address-off-button').withExactText('Turn off billing address')
  })
})
