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
      currentServiceName: 'Service Name',
      permissions: testPermissions,
      hideServiceNav: false,
      serviceNavigationItems: serviceNavigationItems('/', testPermissions, 'card')
    }

    let body = renderTemplate('dashboard/index', templateData)

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
      currentServiceName: 'Service Name',
      permissions: testPermissions,
      hideServiceNav: false,
      serviceNavigationItems: serviceNavigationItems('/', testPermissions, 'card')
    }

    let body = renderTemplate('dashboard/index', templateData)

    body.should.containSelector('.service-navigation--list-item:nth-child(2)').withExactText('Transactions')
  })

  it('should render API keys navigation link when user have tokens read permission', function () {
    let testPermissions = {
      tokens_update: true
    }
    let templateData = {
      permissions: testPermissions,
      showSettingsNav: true,
      adminNavigationItems: adminNavigationItems('/tokens', testPermissions, 'card')
    }

    let body = renderTemplate('tokens', templateData)

    body.should.containSelector('.settings-navigation li:nth-child(1)').withExactText('API keys')
  })

  it('should render Accounts credentials navigation link when user have gateway credentials read permission', function () {
    let testPermissions = {
      tokens_update: false,
      gateway_credentials_update: true,
      service_name_read: false,
      payment_types_read: false,
      toggle_3ds_read: false,
      email_notification_template_read: false
    }
    let templateData = {
      permissions: testPermissions,
      showSettingsNav: true,
      adminNavigationItems: adminNavigationItems('/tokens', testPermissions, 'card')
    }

    let body = renderTemplate('tokens', templateData)

    body.should.containSelector('.settings-navigation li:nth-child(1)').withExactText('Account credentials')
  })

  it('should render Card Types navigation link when user have card Types read permission', function () {
    let testPermissions = {
      tokens_update: false,
      gateway_credentials_update: false,
      service_name_read: false,
      payment_types_read: true,
      toggle_3ds_read: false,
      email_notification_template_read: false
    }
    let templateData = {
      permissions: testPermissions,
      showSettingsNav: true,
      adminNavigationItems: adminNavigationItems('/tokens', testPermissions, 'card')
    }

    let body = renderTemplate('tokens', templateData)

    body.should.containSelector('.settings-navigation li:nth-child(1)').withExactText('Card Types')
  })

  it('should render 3D Secure navigation link when user have email notification template read permission', function () {
    let testPermissions = {
      tokens_update: false,
      gateway_credentials_update: false,
      service_name_read: false,
      payment_types_read: false,
      toggle_3ds_read: true,
      email_notification_template_read: false
    }
    let templateData = {
      permissions: testPermissions,
      showSettingsNav: true,
      adminNavigationItems: adminNavigationItems('/tokens', testPermissions, 'card')
    }

    let body = renderTemplate('tokens', templateData)

    body.should.containSelector('.settings-navigation li:nth-child(1)').withExactText('3D Secure')
  })

  it('should render Email notifications navigation link when user have email notification template read permission', function () {
    let testPermissions = {
      tokens_update: false,
      gateway_credentials_update: false,
      service_name_read: false,
      payment_types_read: false,
      toggle_3ds_read: false,
      email_notification_template_read: true
    }
    let templateData = {
      permissions: testPermissions,
      showSettingsNav: true,
      adminNavigationItems: adminNavigationItems('/tokens', testPermissions, 'card')
    }

    let body = renderTemplate('tokens', templateData)

    body.should.containSelector('.settings-navigation li:nth-child(1)').withExactText('Email notifications')
  })
  it('should not render Accounts credentials navigation link when user is using direct debit gateway account', function () {
    let testPermissions = {
      tokens_update: true,
      gateway_credentials_update: true,
      service_name_read: false,
      merchant_details_read: false,
      payment_types_read: false,
      toggle_3ds_read: false,
      email_notification_template_read: false
    }
    let templateData = {
      permissions: testPermissions,
      showSettingsNav: true,
      adminNavigationItems: adminNavigationItems('/tokens', testPermissions, 'direct debit')
    }

    let body = renderTemplate('tokens', templateData)

    body.should.containSelector('.settings-navigation li').withExactText('API keys')
  })

  it('should not render Card Types navigation link when user is using direct debit gateway account', function () {
    let testPermissions = {
      tokens_update: true,
      gateway_credentials_update: false,
      service_name_read: false,
      merchant_details_read: false,
      payment_types_read: true,
      toggle_3ds_read: false,
      email_notification_template_read: false
    }
    let templateData = {
      permissions: testPermissions,
      showSettingsNav: true,
      adminNavigationItems: adminNavigationItems('/tokens', testPermissions, 'direct debit')
    }

    let body = renderTemplate('tokens', templateData)

    body.should.containSelector('.settings-navigation li').withExactText('API keys')
  })
  it('should not render 3D Secure navigation link when user is using direct debit gateway account', function () {
    let testPermissions = {
      tokens_update: true,
      gateway_credentials_update: false,
      service_name_read: false,
      merchant_details_read: false,
      payment_types_read: false,
      toggle_3ds_read: true,
      email_notification_template_read: false
    }
    let templateData = {
      permissions: testPermissions,
      showSettingsNav: true,
      adminNavigationItems: adminNavigationItems('/tokens', testPermissions, 'direct debit')
    }

    let body = renderTemplate('tokens', templateData)

    body.should.containSelector('.settings-navigation li').withExactText('API keys')
  })

  it('should not render Email notifications navigation link when user is using direct debit gateway account', function () {
    let testPermissions = {
      tokens_update: true,
      gateway_credentials_update: false,
      service_name_read: false,
      merchant_details_read: false,
      payment_types_read: false,
      toggle_3ds_read: false,
      email_notification_template_read: true
    }
    let templateData = {
      permissions: testPermissions,
      showSettingsNav: true,
      adminNavigationItems: adminNavigationItems('/tokens', testPermissions, 'direct debit')
    }

    let body = renderTemplate('tokens', templateData)

    body.should.containSelector('.settings-navigation li').withExactText('API keys')
  })
})
