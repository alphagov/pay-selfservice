let path = require('path')
let renderTemplate = require(path.join(__dirname, '/../test_helpers/html_assertions.js')).render

describe('navigation menu', function () {
  it('should render only Home link when user does have any of the required permissions to show the navigation links', function () {
    let templateData = {
      permissions: {},
      navigation: true
    }

    let body = renderTemplate('token', templateData)

    body.should.containSelector('.service-navigation ul > li > a').withExactText('Dashboard')
    body.should.containNoSelectorWithText('.navigation ul > li > a', 'API keys')
    body.should.containNoSelectorWithText('.navigation ul > li > a', 'Transactions')
    body.should.containNoSelectorWithText('.navigation ul > li > a', 'Account credentials')
    body.should.containNoSelectorWithText('.navigation ul > li > a', 'Change service name')
    body.should.containNoSelectorWithText('.navigation ul > li > a', 'Payment types')
    body.should.containNoSelectorWithText('.navigation ul > li > a', 'Email notifications')
  })

  it('should render API keys navigation link when user have tokens read permission', function () {
    let templateData = {
      permissions: {
        tokens_read: true
      },
      navigation: true
    }

    let body = renderTemplate('token', templateData)

    body.should.containSelector('.navigation nav > ul > li:nth-child(1) > a').withExactText('API keys')
  })

  it('should render Transactions navigation link when user have transactions read permission', function () {
    let templateData = {
      permissions: {
        transactions_read: true
      },
      navigation: true
    }

    let body = renderTemplate('token', templateData)

    body.should.containSelector('.service-navigation nav > ul > li:nth-child(2) > a').withExactText('Transactions')
  })

  it('should render Accounts credentials navigation link when user have gateway credentials read permission', function () {
    let templateData = {
      permissions: {
        gateway_credentials_read: true
      },
      navigation: true
    }

    let body = renderTemplate('token', templateData)

    body.should.containSelector('.navigation nav > ul > li:nth-child(2) > a').withExactText('Account credentials')
  })

  it('should render Change service name navigation link when user have service name read permission', function () {
    let templateData = {
      permissions: {
        service_name_read: true
      },
      navigation: true
    }

    let body = renderTemplate('token', templateData)

    body.should.containSelector('.navigation nav > ul > li:nth-child(2) > a').withExactText('Change service name')
  })

  it('should render Payment types navigation link when user have payment types read permission', function () {
    let templateData = {
      permissions: {
        payment_types_read: true
      },
      navigation: true
    }

    let body = renderTemplate('token', templateData)

    body.should.containSelector('.navigation nav > ul > li:nth-child(2) > a').withExactText('Payment types')
  })

  it('should render Email notifications navigation link when user have email notification template read permission', function () {
    let templateData = {
      permissions: {
        email_notification_template_read: true
      },
      navigation: true
    }

    let body = renderTemplate('token', templateData)

    body.should.containSelector('.navigation nav > ul > li:nth-child(2) > a').withExactText('Email notifications')
  })
})
