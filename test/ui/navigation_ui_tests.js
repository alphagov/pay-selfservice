const path = require('path')
const renderTemplate = require(path.join(__dirname, '/../test_helpers/html_assertions.js')).render
const {serviceNavigationItems, adminNavigationItems} = require(path.join(__dirname, '../../app/utils/navBuilder'))

describe('navigation menu', function () {
  it('should render only Home link when user does have any of the required permissions to show the navigation links', function () {
    const testPermissions = {
      tokens_read: true
    }
    const templateData = {
      currentGatewayAccount: {
        full_type: 'test'
      },
      currentService: {name: 'Service Name'},
      permissions: testPermissions,
      hideServiceNav: false,
      serviceNavigationItems: serviceNavigationItems('/', testPermissions, 'card')
    }

    const body = renderTemplate('dashboard/index', templateData)

    body.should.containSelector('.service-navigation--list-item:nth-child(1)').withExactText('Dashboard')
  })

  it('should render Transactions navigation link when user have transactions read permission and payment type is card', function () {
    const testPermissions = {
      transactions_read: true
    }
    const templateData = {
      currentGatewayAccount: {
        full_type: 'test'
      },
      currentService: {name: 'Service Name'},
      permissions: testPermissions,
      hideServiceNav: false,
      serviceNavigationItems: serviceNavigationItems('/', testPermissions, 'card')
    }

    const body = renderTemplate('dashboard/index', templateData)

    body.should.containSelector('#navigation-menu-transactions').withExactText('Transactions')
  })

  it('should render Transactions navigation link when user have transactions read permission and payment type is direct debit', function () {
    const testPermissions = {
      transactions_read: true
    }
    const templateData = {
      currentGatewayAccount: {
        full_type: 'test'
      },
      currentService: {name: 'Service Name'},
      permissions: testPermissions,
      hideServiceNav: false,
      serviceNavigationItems: serviceNavigationItems('/', testPermissions, 'direct debit')
    }

    const body = renderTemplate('dashboard/index', templateData)

    body.should.containNoSelector('#navigation-menu-transactions')
  })

  it('should render API keys navigation link when user have tokens read permission', function () {
    const testPermissions = {
      tokens_update: true
    }
    const templateData = {
      permissions: testPermissions,
      showSettingsNav: true,
      adminNavigationItems: adminNavigationItems('/api-keys', testPermissions, 'card')
    }

    const body = renderTemplate('api-keys/index', templateData)

    body.should.containSelector('.settings-navigation li:nth-child(1)').withExactText('API keys')
  })

  it('should render Accounts credentials navigation link when user have gateway credentials read permission', function () {
    const testPermissions = {
      tokens_update: false,
      gateway_credentials_update: true,
      service_name_read: false,
      payment_types_read: false,
      toggle_3ds_read: false,
      email_notification_template_read: false
    }
    const templateData = {
      permissions: testPermissions,
      showSettingsNav: true,
      adminNavigationItems: adminNavigationItems('/api-keys', testPermissions, 'card')
    }

    const body = renderTemplate('api-keys/index', templateData)

    body.should.containSelector('.settings-navigation li:nth-child(1)').withExactText('Account credentials')
  })

  it('should render Card types navigation link when user have card Types read permission', function () {
    const testPermissions = {
      tokens_update: false,
      gateway_credentials_update: false,
      service_name_read: false,
      payment_types_read: true,
      toggle_3ds_read: false,
      email_notification_template_read: false
    }
    const templateData = {
      permissions: testPermissions,
      showSettingsNav: true,
      adminNavigationItems: adminNavigationItems('/api-keys', testPermissions, 'card')
    }

    const body = renderTemplate('api-keys/index', templateData)

    body.should.containSelector('.settings-navigation li:nth-child(1)').withExactText('Card types')
  })

  it('should render 3D Secure navigation link when user have email notification template read permission', function () {
    const testPermissions = {
      tokens_update: false,
      gateway_credentials_update: false,
      service_name_read: false,
      payment_types_read: false,
      toggle_3ds_read: true,
      email_notification_template_read: false
    }
    const templateData = {
      permissions: testPermissions,
      showSettingsNav: true,
      adminNavigationItems: adminNavigationItems('/api-keys', testPermissions, 'card')
    }

    const body = renderTemplate('api-keys/index', templateData)

    body.should.containSelector('.settings-navigation li:nth-child(1)').withExactText('3D Secure')
  })

  it('should render Email notifications navigation link when user have email notification template read permission', function () {
    const testPermissions = {
      tokens_update: false,
      gateway_credentials_update: false,
      service_name_read: false,
      payment_types_read: false,
      toggle_3ds_read: false,
      email_notification_template_read: true
    }
    const templateData = {
      permissions: testPermissions,
      showSettingsNav: true,
      adminNavigationItems: adminNavigationItems('/api-keys', testPermissions, 'card')
    }

    const body = renderTemplate('api-keys/index', templateData)

    body.should.containSelector('.settings-navigation li:nth-child(1)').withExactText('Email notifications')
  })
  it('should not render Accounts credentials navigation link when user is using direct debit gateway account', function () {
    const testPermissions = {
      tokens_update: true,
      gateway_credentials_update: true,
      service_name_read: false,
      merchant_details_read: false,
      payment_types_read: false,
      toggle_3ds_read: false,
      email_notification_template_read: false
    }
    const templateData = {
      permissions: testPermissions,
      showSettingsNav: true,
      adminNavigationItems: adminNavigationItems('/api-keys', testPermissions, 'direct debit')
    }

    const body = renderTemplate('api-keys/index', templateData)

    body.should.containSelector('.settings-navigation li').withExactText('API keys')
  })

  it('should not render Card types navigation link when user is using direct debit gateway account', function () {
    const testPermissions = {
      tokens_update: true,
      gateway_credentials_update: false,
      service_name_read: false,
      merchant_details_read: false,
      payment_types_read: true,
      toggle_3ds_read: false,
      email_notification_template_read: false
    }
    const templateData = {
      permissions: testPermissions,
      showSettingsNav: true,
      adminNavigationItems: adminNavigationItems('/api-keys', testPermissions, 'direct debit')
    }

    const body = renderTemplate('api-keys/index', templateData)

    body.should.containSelector('.settings-navigation li').withExactText('API keys')
  })
  it('should not render 3D Secure navigation link when user is using direct debit gateway account', function () {
    const testPermissions = {
      tokens_update: true,
      gateway_credentials_update: false,
      service_name_read: false,
      merchant_details_read: false,
      payment_types_read: false,
      toggle_3ds_read: true,
      email_notification_template_read: false
    }
    const templateData = {
      permissions: testPermissions,
      showSettingsNav: true,
      adminNavigationItems: adminNavigationItems('/api-keys', testPermissions, 'direct debit')
    }

    const body = renderTemplate('api-keys/index', templateData)

    body.should.containSelector('.settings-navigation li').withExactText('API keys')
  })

  it('should not render Email notifications navigation link when user is using direct debit gateway account', function () {
    const testPermissions = {
      tokens_update: true,
      gateway_credentials_update: false,
      service_name_read: false,
      merchant_details_read: false,
      payment_types_read: false,
      toggle_3ds_read: false,
      email_notification_template_read: true
    }
    const templateData = {
      permissions: testPermissions,
      showSettingsNav: true,
      adminNavigationItems: adminNavigationItems('/api-keys', testPermissions, 'direct debit')
    }

    const body = renderTemplate('api-keys/index', templateData)

    body.should.containSelector('.settings-navigation li').withExactText('API keys')
  })
})
