'use strict'

// NPM dependencies
const path = require('path')

// Local dependencies
const renderTemplate = require(path.join(__dirname, '/../test-helpers/html-assertions.js')).render
const paths = require(path.join(__dirname, '/../../app/paths.js'))

describe('The credentials view in edit mode', function () {
  it('should display credentials view for a worldpay account', function () {
    const templateData = {
      currentGatewayAccount: {
        'payment_provider': 'worldpay',
        'credentials': {
          'username': 'a-username',
          'merchant_id': 'a-merchant-id'
        }
      },
      'editMode': 'true',
      permissions: {
        gateway_credentials_update: true
      }
    }

    const body = renderTemplate('credentials/worldpay', templateData)

    body.should.containSelector('#view-title').withExactText('Your Worldpay credentials')

    body.should.containSelector('form#credentials-form')
      .withAttribute('method', 'post')
      .withAttribute('action', paths.credentials.create)

    body.should.not.containSelector('a#edit-credentials-link')

    body.should.containInputField('merchantId', 'text')
      .withAttribute('value', 'a-merchant-id')
      .withLabel('Merchant code')

    body.should.containInputField('username', 'text')
      .withAttribute('value', 'a-username')
      .withLabel('Username')

    body.should.containInputField('password', 'password')
      .withLabel('Password')

    body.should.containSelector('#submitCredentials')
  })

  it('should display credentials view for a smartpay account', function () {
    const templateData = {
      currentGatewayAccount: {
        'payment_provider': 'smartpay',
        'credentials': {
          'username': 'a-username',
          'merchant_id': 'a-merchant-id'
        }
      },
      'editMode': 'true',
      permissions: {
        gateway_credentials_update: true
      }
    }

    const body = renderTemplate('credentials/smartpay', templateData)

    body.should.containSelector('#view-title').withExactText('Your Smartpay credentials')

    body.should.containSelector('form#credentials-form')
      .withAttribute('method', 'post')
      .withAttribute('action', paths.credentials.create)

    body.should.not.containSelector('a#edit-credentials-link')

    body.should.containInputField('merchantId', 'text')
      .withAttribute('value', 'a-merchant-id')
      .withLabel('Merchant account code')

    body.should.containInputField('username', 'text')
      .withAttribute('value', 'a-username')
      .withLabel('Username')

    body.should.containInputField('password', 'password')
      .withLabel('Password')

    body.should.containSelector('#submitCredentials')
  })

  it('should display credentials view for a ePDQ account', function () {
    const templateData = {
      currentGatewayAccount: {
        'payment_provider': 'epdq',
        'credentials': {
          'username': 'a-username',
          'merchant_id': 'a-psp-id'
        }
      },
      'editMode': 'true',
      permissions: {
        gateway_credentials_update: true
      }
    }

    let body = renderTemplate('credentials/epdq', templateData)

    body.should.containSelector('#view-title').withExactText('Your ePDQ credentials')

    body.should.containSelector('form#credentials-form')
      .withAttribute('method', 'post')
      .withAttribute('action', paths.credentials.create)

    body.should.not.containSelector('a#edit-credentials-link')

    body.should.containInputField('merchantId', 'text')
      .withAttribute('value', 'a-psp-id')
      .withLabel('PSP ID')

    body.should.containInputField('username', 'text')
      .withAttribute('value', 'a-username')
      .withLabel('Username')

    body.should.containInputField('password', 'password')
      .withLabel('Password')

    body.should.containInputField('shaInPassphrase', 'password')
      .withLabel('SHA-IN passphrase')

    body.should.containInputField('shaOutPassphrase', 'password')
      .withLabel('SHA-OUT passphrase')

    body.should.containSelector('#submitCredentials')
  })

  it('should display error page for `stripe`', function () {
    const templateData = {
      currentGatewayAccount: {
        'payment_provider': 'stripe',
        'credentials': {}
      },
      'editMode': 'true',
      permissions: {
        gateway_credentials_update: true
      }
    }

    const body = renderTemplate('404', templateData)

    body.should.containSelector('h1:first-of-type').withExactText('Page not found')

    body.should.not.containSelector('form#credentials-form')
    body.should.not.containSelector('a#edit-credentials-link')
    body.should.not.containSelector('input#submitCredentials')
  })
})
