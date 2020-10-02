'use strict'

const path = require('path')

const renderTemplate = require(path.join(__dirname, '/../test-helpers/html-assertions.js')).render
const paths = require(path.join(__dirname, '/../../app/paths.js'))

describe('The credentials view in edit mode', () => {
  it('should display credentials view for a worldpay account', () => {
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

    expect(body).containSelector('#view-title').withExactText('Your Worldpay credentials')

    expect(body).containSelector('form#credentials-form')
      .withAttribute('method', 'post')
      .withAttribute('action', paths.credentials.create)

    expect(body).not.containSelector('a#edit-credentials-link')

    expect(body).containInputField('merchantId', 'text')
      .withAttribute('value', 'a-merchant-id')
      .withLabel('Merchant code')

    expect(body).containInputField('username', 'text')
      .withAttribute('value', 'a-username')
      .withLabel('Username')

    expect(body).containInputField('password', 'password')
      .withLabel('Password')

    expect(body).containSelector('#submitCredentials')
  })

  it('should display credentials view for a smartpay account', () => {
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

    expect(body).containSelector('#view-title').withExactText('Your Smartpay credentials')

    expect(body).containSelector('form#credentials-form')
      .withAttribute('method', 'post')
      .withAttribute('action', paths.credentials.create)

    expect(body).not.containSelector('a#edit-credentials-link')

    expect(body).containInputField('merchantId', 'text')
      .withAttribute('value', 'a-merchant-id')
      .withLabel('Merchant account code')

    expect(body).containInputField('username', 'text')
      .withAttribute('value', 'a-username')
      .withLabel('Username')

    expect(body).containInputField('password', 'password')
      .withLabel('Password')

    expect(body).containSelector('#submitCredentials')
  })

  it('should display credentials view for a ePDQ account', () => {
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

    expect(body).containSelector('#view-title').withExactText('Your ePDQ credentials')

    expect(body).containSelector('form#credentials-form')
      .withAttribute('method', 'post')
      .withAttribute('action', paths.credentials.create)

    expect(body).not.containSelector('a#edit-credentials-link')

    expect(body).containInputField('merchantId', 'text')
      .withAttribute('value', 'a-psp-id')
      .withLabel('PSP ID')

    expect(body).containInputField('username', 'text')
      .withAttribute('value', 'a-username')
      .withLabel('Username')

    expect(body).containInputField('password', 'password')
      .withLabel('Password')

    expect(body).containInputField('shaInPassphrase', 'password')
      .withLabel('SHA-IN passphrase')

    expect(body).containInputField('shaOutPassphrase', 'password')
      .withLabel('SHA-OUT passphrase')

    expect(body).containSelector('#submitCredentials')
  })

  it('should display error page for `stripe`', () => {
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

    expect(body).containSelector('h1:first-of-type').withExactText('Page not found')

    expect(body).not.containSelector('form#credentials-form')
    expect(body).not.containSelector('a#edit-credentials-link')
    expect(body).not.containSelector('input#submitCredentials')
  })
})
