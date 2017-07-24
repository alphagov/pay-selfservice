let path = require('path')
let renderTemplate = require(path.join(__dirname, '/../test_helpers/html_assertions.js')).render
const {serviceNavigationItems, adminNavigationItems} = require(path.join(__dirname, '../../app/utils/navBuilder'))

describe('navigation menu', function () {
  it('should render only Home link when user does have any of the required permissions to show the navigation links', function () {
    let testPermissions = {
      tokens_read: true
    }
    let templateData = {
      currentGatewayAccount: {
        full_type: 'test'
      },
      permissions: testPermissions,
      navigation: true,
      serviceNavigationItems: serviceNavigationItems('/', testPermissions)
    }

    let body = renderTemplate('login/logged_in', templateData)

    body.should.containSelector('.service-navigation--list-item:nth-child(1)').withExactText('Dashboard')
  })

  it('should render Transactions navigation link when user have transactions read permission', function () {
    let testPermissions = {
      transactions_read: true
    }
    let templateData = {
      currentGatewayAccount: {
        full_type: 'test'
      },
      permissions: testPermissions,
      navigation: true,
      serviceNavigationItems: serviceNavigationItems('/', testPermissions)
    }

    let body = renderTemplate('login/logged_in', templateData)

    body.should.containSelector('.service-navigation--list-item:nth-child(2)').withExactText('Transactions')
  })

  it('should render API keys navigation link when user have tokens read permission', function () {
    let testPermissions = {
      tokens_read: true
    }
    let templateData = {
      permissions: testPermissions,
      navigation: true,
      adminNavigationItems: adminNavigationItems('/tokens', testPermissions)
    }

    let body = renderTemplate('token', templateData)

    body.should.containSelector('.settings-navigation li:nth-child(1)').withExactText('API keys')
  })

  it('should render Accounts credentials navigation link when user have gateway credentials read permission', function () {
    let testPermissions = {
      tokens_read: false,
      gateway_credentials_read: true,
      service_name_read: false,
      payment_types_read: false,
      toggle_3ds_read: false,
      email_notification_template_read: false
    }
    let templateData = {
      permissions: testPermissions,
      navigation: true,
      adminNavigationItems: adminNavigationItems('/tokens', testPermissions)
    }

    let body = renderTemplate('token', templateData)

    body.should.containSelector('.settings-navigation li:nth-child(1)').withExactText('Account credentials')
  })

  it('should render Change service name navigation link when user have service name read permission', function () {
    let testPermissions = {
      tokens_read: false,
      gateway_credentials_read: false,
      service_name_read: true,
      payment_types_read: false,
      toggle_3ds_read: false,
      email_notification_template_read: false
    }
    let templateData = {
      permissions: testPermissions,
      navigation: true,
      adminNavigationItems: adminNavigationItems('/tokens', testPermissions)
    }

    let body = renderTemplate('token', templateData)

    body.should.containSelector('.settings-navigation li:nth-child(1)').withExactText('Change service name')
  })

  it('should render Payment types navigation link when user have payment types read permission', function () {
    let testPermissions = {
      tokens_read: false,
      gateway_credentials_read: false,
      service_name_read: false,
      payment_types_read: true,
      toggle_3ds_read: false,
      email_notification_template_read: false
    }
    let templateData = {
      permissions: testPermissions,
      navigation: true,
      adminNavigationItems: adminNavigationItems('/tokens', testPermissions)
    }

    let body = renderTemplate('token', templateData)

    body.should.containSelector('.settings-navigation li:nth-child(1)').withExactText('Payment types')
  })

  it('should render 3D Secure navigation link when user have email notification template read permission', function () {
    let testPermissions = {
      tokens_read: false,
      gateway_credentials_read: false,
      service_name_read: false,
      payment_types_read: false,
      toggle_3ds_read: true,
      email_notification_template_read: false
    }
    let templateData = {
      permissions: testPermissions,
      navigation: true,
      adminNavigationItems: adminNavigationItems('/tokens', testPermissions)
    }

    let body = renderTemplate('token', templateData)

    body.should.containSelector('.settings-navigation li:nth-child(1)').withExactText('3D Secure')
  })

  it('should render Email notifications navigation link when user have email notification template read permission', function () {
    let testPermissions = {
      tokens_read: false,
      gateway_credentials_read: false,
      service_name_read: false,
      payment_types_read: false,
      toggle_3ds_read: false,
      email_notification_template_read: true
    }
    let templateData = {
      permissions: testPermissions,
      navigation: true,
      adminNavigationItems: adminNavigationItems('/tokens', testPermissions)
    }

    let body = renderTemplate('token', templateData)

    body.should.containSelector('.settings-navigation li:nth-child(1)').withExactText('Email notifications')
  })
})
