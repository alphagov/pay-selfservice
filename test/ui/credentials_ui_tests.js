var path = require('path')
var renderTemplate = require(path.join(__dirname, '/../test_helpers/html_assertions.js')).render
var paths = require(path.join(__dirname, '/../../app/paths.js'))

describe('The credentials view in normal mode', function () {
  it('should display credentials view for a worldpay account', function () {
    var templateData = {
      currentGatewayAccount: {
        'payment_provider': 'Worldpay',
        'credentials': {
          'username': 'a-username',
          'merchant_id': 'a-merchant-id'
        }
      },

      permissions: {
        gateway_credentials_read: true
      }
    }

    var body = renderTemplate('provider_credentials/worldpay', templateData)

    body.should.containSelector('h4#view-title').withExactText('Your Worldpay Credentials')

    body.should.containSelector('a#edit-credentials-link')
      .withAttribute('class', 'button')
      .withAttribute('href', paths.credentials.edit)
      .withText('Edit credentials')

    body.should.containSelector('#credentials')

    body.should.containSelector('#merchant-id-key').withExactText('Merchant ID')
    body.should.containSelector('#merchant-id-value').withExactText('a-merchant-id')

    body.should.containSelector('#username-key').withExactText('Username')
    body.should.containSelector('#username-value').withExactText('a-username')

    body.should.containSelector('#password-key').withExactText('Password')
    body.should.containSelector('#password-value').withExactText('****')
  })

  it('should not display notification credentials for worldpay', function () {
    var templateData = {
      currentGatewayAccount: {
        'payment_provider': 'Worldpay',
        'credentials': {
          'username': 'a-username',
          'merchant_id': 'a-merchant-id'
        }
      },
      permissions: {
        gateway_credentials_read: true
      }
    }

    var body = renderTemplate('provider_credentials/worldpay', templateData)

    body.should.not.containSelector('h4#view-notification-title')
  })

  it('should display credentials view for a smartpay account', function () {
    var templateData = {
      currentGatewayAccount: {
        'payment_provider': 'Smartpay',
        'credentials': {
          'username': 'a-username',
          'merchant_id': 'a-merchant-id'
        }
      },
      permissions: {
        gateway_credentials_read: true
      }
    }

    var body = renderTemplate('provider_credentials/smartpay', templateData)

    body.should.containSelector('h4#view-title').withExactText('Your Smartpay Credentials')

    body.should.containSelector('a#edit-credentials-link')
      .withAttribute('class', 'button')
      .withAttribute('href', paths.credentials.edit)
      .withText('Edit credentials')

    body.should.containSelector('#credentials')

    body.should.containSelector('#merchant-id-key')
    body.should.containSelector('#merchant-id-value')

    body.should.containSelector('#username-key').withExactText('Username')
    body.should.containSelector('#username-value').withExactText('a-username')

    body.should.containSelector('#password-key').withExactText('Password')
    body.should.containSelector('#password-value').withExactText('****')
  })

  it('should display notification credentials view for a smartpay account', function () {
    var templateData = {
      currentGatewayAccount: {
        'payment_provider': 'Smartpay',
        'credentials': {
          'username': 'a-username',
          'merchant_id': 'a-merchant-id'
        },
        'notificationCredentials': {
          'userName': 'a-notification-username'
        }
      },

      permissions: {
        gateway_credentials_read: true
      }
    }

    var body = renderTemplate('provider_credentials/smartpay', templateData)

    body.should.containSelector('h4#view-notification-title').withExactText('Your Smartpay Notification Credentials')

    body.should.containSelector('a#edit-credentials-link')
      .withAttribute('class', 'button')
      .withAttribute('href', paths.credentials.edit)
      .withText('Edit credentials')

    body.should.containSelector('#credentials')

    body.should.containSelector('#merchant-id-key')
    body.should.containSelector('#merchant-id-value')

    body.should.containSelector('#notification-username-key').withExactText('Username')
    body.should.containSelector('#notification-username-value').withExactText('a-notification-username')

    body.should.containSelector('#notification-password-key').withExactText('Password')
    body.should.containSelector('#notification-password-value').withExactText('****')
  })

  it('should display credentials view for an ePDQ account', function () {
    var templateData = {
      currentGatewayAccount: {
        'payment_provider': 'ePDQ',
        'credentials': {
          'username': 'a-username',
          'merchant_id': 'a-psp-id'
        }
      },

      permissions: {
        gateway_credentials_read: true
      }
    }

    let body = renderTemplate('provider_credentials/epdq', templateData)

    body.should.containSelector('h4#view-title').withExactText('Your ePDQ Credentials')

    body.should.containSelector('a#edit-credentials-link')
      .withAttribute('class', 'button')
      .withAttribute('href', paths.credentials.edit)
      .withText('Edit credentials')

    body.should.containSelector('#credentials')

    body.should.containSelector('#merchant-id-key').withExactText('PSP ID')
    body.should.containSelector('#merchant-id-value').withExactText('a-psp-id')

    body.should.containSelector('#username-key').withExactText('Username')
    body.should.containSelector('#username-value').withExactText('a-username')

    body.should.containSelector('#password-key').withExactText('Password')
    body.should.containSelector('#password-value').withExactText('****')

    body.should.containSelector('#sha-in-passphrase-key').withExactText('SHA-IN passphrase')
    body.should.containSelector('#sha-in-passphrase-value').withExactText('****')

    body.should.containSelector('#sha-out-passphrase-key').withExactText('SHA-OUT passphrase')
    body.should.containSelector('#sha-out-passphrase-value').withExactText('****')
  })

  it('should not display notification credentials for ePDQ', function () {
    var templateData = {
      currentGatewayAccount: {
        'payment_provider': 'ePDQ',
        'credentials': {
          'username': 'a-username',
          'psp_id': 'a-psp-id'
        }
      },
      permissions: {
        gateway_credentials_read: true
      }
    }

    var body = renderTemplate('provider_credentials/epdq', templateData)

    body.should.not.containSelector('h4#view-notification-title')
  })

  it('should display credentials view for a sandbox account', function () {
    var templateData = {
      currentGatewayAccount: {
        'payment_provider': 'Sandbox',
        'credentials': {}
      }
    }

    var body = renderTemplate('provider_credentials/sandbox', templateData)

    body.should.containSelector('#message p:first-of-type').withExactText('This is a test account. Account credentials only exist in live services, and relate to your payment service providers.')

    body.should.not.containSelector('a#edit-credentials-link')

    body.should.not.containSelector('#credentials')

    body.should.not.containSelector('#merchant-id-key')
    body.should.not.containSelector('#merchant-id-value')

    body.should.not.containSelector('#username-key')
    body.should.not.containSelector('#username-value')

    body.should.not.containSelector('#password-key')
    body.should.not.containSelector('#password-value')
  })
})

describe('The credentials view in edit mode', function () {
  it('should display credentials view for a worldpay account', function () {
    var templateData = {
      currentGatewayAccount: {
        'payment_provider': 'Worldpay',
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

    var body = renderTemplate('provider_credentials/worldpay', templateData)

    body.should.containSelector('h4#view-title').withExactText('Your Worldpay Credentials')

    body.should.containSelector('form#credentials-form')
      .withAttribute('method', 'post')
      .withAttribute('action', paths.credentials.create)

    body.should.not.containSelector('a#edit-credentials-link')

    body.should.containInputField('merchantId', 'text')
      .withAttribute('value', 'a-merchant-id')
      .withLabel('Merchant ID')

    body.should.containInputField('username', 'text')
      .withAttribute('value', 'a-username')
      .withLabel('Username')

    body.should.containInputField('password', 'password')
      .withAttribute('value', '')
      .withLabel('Password')

    body.should.containInputField('submitCredentials', 'submit')
  })

  it('should display credentials view for a smartpay account', function () {
    var templateData = {
      currentGatewayAccount: {
        'payment_provider': 'Smartpay',
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

    var body = renderTemplate('provider_credentials/smartpay', templateData)

    body.should.containSelector('h4#view-title').withExactText('Your Smartpay Credentials')

    body.should.containSelector('form#credentials-form')
      .withAttribute('method', 'post')
      .withAttribute('action', paths.credentials.create)

    body.should.not.containSelector('a#edit-credentials-link')

    body.should.containInputField('merchantId', 'text')
      .withAttribute('value', 'a-merchant-id')
      .withLabel('Merchant ID')

    body.should.containInputField('username', 'text')
      .withAttribute('value', 'a-username')
      .withLabel('Username')

    body.should.containInputField('password', 'password')
      .withAttribute('value', '')
      .withLabel('Password')

    body.should.containInputField('submitCredentials', 'submit')
  })

  it('should display credentials view for a ePDQ account', function () {
    var templateData = {
      currentGatewayAccount: {
        'payment_provider': 'ePDQ',
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

    let body = renderTemplate('provider_credentials/epdq', templateData)

    body.should.containSelector('h4#view-title').withExactText('Your ePDQ Credentials')

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
      .withAttribute('value', '')
      .withLabel('Password')

    body.should.containInputField('shaInPassphrase', 'password')
      .withAttribute('value', '')
      .withLabel('SHA-IN passphrase')

    body.should.containInputField('shaOutPassphrase', 'password')
      .withAttribute('value', '')
      .withLabel('SHA-OUT passphrase')

    body.should.containInputField('submitCredentials', 'submit')
  })

  it('should display credentials view for a sandbox account', function () {
    var templateData = {
      currentGatewayAccount: {
        'payment_provider': 'Sandbox',
        'credentials': {}
      },
      'editMode': 'true',
      permissions: {
        gateway_credentials_update: true
      }
    }

    var body = renderTemplate('provider_credentials/sandbox', templateData)

    body.should.containSelector('#message p:first-of-type').withExactText('This is a test account. Account credentials only exist in live services, and relate to your payment service providers.')

    body.should.not.containSelector('form#credentials-form')
    body.should.not.containSelector('a#edit-credentials-link')
    body.should.not.containSelector('input#submitCredentials')
  })
})
