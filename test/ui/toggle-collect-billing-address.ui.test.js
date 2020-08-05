'use strict'

const path = require('path')
const renderTemplate = require(path.join(__dirname, '/../test-helpers/html-assertions.js')).render

describe('The toggle Billing Address page', function () {
  it('should show collections are turned off', () => {
    const templateData = {
      'collectBillingAddress': false,
      permissions: {
        toggle_billing_address_read: true,
        toggle_billing_address_update: true
      }
    }

    const body = renderTemplate('billing-address/index', templateData)

    body.should.containSelector('#billing-address-toggle-2').withAttribute('checked')
  })

  it('if readonly, checkboxes and submit buttons should be disabled', () => {
    const templateData = {
      'collectBillingAddress': false,
      permissions: {
        toggle_billing_address_read: true,
        toggle_billing_address_update: false
      }
    }

    const body = renderTemplate('billing-address/index', templateData)

    body.should.containSelector('.pay-info-warning-box').withExactText('You don’t have permission to manage settings. Contact your service admin if you would like to manage 3D secure, accepted card types, email notifications, or billing address.')
    body.should.containSelector('#billing-address-toggle-2').withAttribute('checked')
    body.should.containSelector('#billing-address-toggle-2').withAttribute('disabled')
    body.should.containSelector('#billing-address-toggle-button').withAttribute('disabled')
  })

  it('should show collections are turned on', () => {
    const templateData = {
      'collectBillingAddress': true,
      permissions: {
        toggle_billing_address_read: true,
        toggle_billing_address_update: true
      }
    }

    const body = renderTemplate('billing-address/index', templateData)

    body.should.containSelector('#billing-address-toggle').withAttribute('checked')
  })
})
