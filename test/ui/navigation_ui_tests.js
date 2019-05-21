const path = require('path')
const renderTemplate = require(path.join(__dirname, '/../test_helpers/html_assertions.js')).render
const { serviceNavigationItems, adminNavigationItems } = require(path.join(__dirname, '../../app/utils/navBuilder'))

describe('navigation menu', function () {
  it('should render only Home link when user does have any of the required permissions to show the navigation links', function () {
    const testPermissions = {
      tokens_read: true
    }
    const templateData = {
      currentGatewayAccount: {
        full_type: 'test'
      },
      currentService: { name: 'Service Name' },
      permissions: testPermissions,
      hideServiceNav: false,
      serviceNavigationItems: serviceNavigationItems('/', testPermissions, 'card'),
      links: [],
      linksToDisplay: []
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
      currentService: { name: 'Service Name' },
      permissions: testPermissions,
      hideServiceNav: false,
      serviceNavigationItems: serviceNavigationItems('/', testPermissions, 'card'),
      links: [],
      linksToDisplay: []
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
      currentService: { name: 'Service Name' },
      permissions: testPermissions,
      hideServiceNav: false,
      serviceNavigationItems: serviceNavigationItems('/', testPermissions, 'direct debit'),
      links: [],
      linksToDisplay: []
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

  it('should render Accounts credentials navigation link when user have gateway credentials read permission' +
    ' and payment provider is NOT `stripe` ', function () {
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
      adminNavigationItems: adminNavigationItems('/api-keys', testPermissions, 'card', 'worldpay')
    }

    const body = renderTemplate('api-keys/index', templateData)

    body.should.containSelector('.settings-navigation li:nth-child(1)').withExactText('Account credentials')
  })

  it('should not render Accounts credentials navigation link when user have gateway credentials read permission' +
    ' and payment provider is `stripe`', function () {
    const testPermissions = {
      tokens_update: false,
      gateway_credentials_update: true,
      service_name_read: false,
      payment_types_read: false,
      toggle_3ds_read: true,
      email_notification_template_read: false
    }
    const templateData = {
      permissions: testPermissions,
      showSettingsNav: true,
      adminNavigationItems: adminNavigationItems('/api-keys', testPermissions, 'card', 'stripe')
    }

    const body = renderTemplate('api-keys/index', templateData)

    body.should.containSelector('.settings-navigation li:nth-child(1)').withExactText('3D Secure')
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

  it('should render 3D Secure navigation link when user has toggle 3D Secure read permission', function () {
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

  it('should render Billing address navigation link when user has toggle billing address read permission', function () {
    const testPermissions = {
      tokens_update: false,
      gateway_credentials_update: false,
      service_name_read: false,
      payment_types_read: false,
      toggle_3ds_read: false,
      email_notification_template_read: false,
      toggle_billing_address_read: true
    }
    const templateData = {
      permissions: testPermissions,
      showSettingsNav: true,
      adminNavigationItems: adminNavigationItems('/api-keys', testPermissions, 'card')
    }

    const body = renderTemplate('api-keys/index', templateData)

    body.should.containSelector('.settings-navigation li:nth-child(1)').withExactText('Billing address')
  })

  it('should not render card navigation links when gateway account is direct debit', function () {
    const testPermissions = {
      tokens_update: true,
      gateway_credentials_update: true,
      service_name_read: true,
      merchant_details_read: true,
      payment_types_read: true,
      toggle_3ds_read: true,
      email_notification_template_read: true,
      connected_gocardless_account_update: true,
      toggle_billing_address_read: true
    }
    const templateData = {
      permissions: testPermissions,
      showSettingsNav: true,
      adminNavigationItems: adminNavigationItems('/api-keys', testPermissions, 'direct debit')
    }

    const body = renderTemplate('api-keys/index', templateData)

    body.should.containSelector('.settings-navigation li:nth-child(1)').withExactText('API keys')
    body.should.containSelector('.settings-navigation li:nth-child(2)').withExactText('Link GoCardless Merchant Account')
    body.should.not.contain('Account credentials')
    body.should.not.contain('3D Secure')
    body.should.not.contain('Card types')
    body.should.not.contain('Email notifications')
    body.should.not.contain('Billing address')
  })

  it('should not render direct debit navigation links when gateway account is card', function () {
    const testPermissions = {
      tokens_update: true,
      gateway_credentials_update: true,
      service_name_read: true,
      merchant_details_read: true,
      payment_types_read: true,
      toggle_3ds_read: true,
      email_notification_template_read: true,
      connected_gocardless_account_update: true,
      toggle_billing_address_read: true
    }
    const templateData = {
      permissions: testPermissions,
      showSettingsNav: true,
      adminNavigationItems: adminNavigationItems('/api-keys', testPermissions, 'card')
    }

    const body = renderTemplate('api-keys/index', templateData)

    body.should.containSelector('.settings-navigation li:nth-child(1)').withExactText('API keys')
    body.should.containSelector('.settings-navigation li:nth-child(2)').withExactText('Account credentials')
    body.should.containSelector('.settings-navigation li:nth-child(3)').withExactText('3D Secure')
    body.should.containSelector('.settings-navigation li:nth-child(4)').withExactText('Card types')
    body.should.containSelector('.settings-navigation li:nth-child(5)').withExactText('Email notifications')
    body.should.containSelector('.settings-navigation li:nth-child(6)').withExactText('Billing address')
    body.should.not.contain('Link GoCardless Merchant Account')
  })

  it('should render Link GoCardless Merchant Account navigation link when user has connected-gocardless-account:update', function () {
    const testPermissions = {
      connected_gocardless_account_update: true
    }
    const templateData = {
      permissions: testPermissions,
      showSettingsNav: true,
      adminNavigationItems: adminNavigationItems('/api-keys', testPermissions, 'direct debit')
    }

    const body = renderTemplate('api-keys/index', templateData)

    body.should.containSelector('.settings-navigation li:nth-child(1)').withExactText('Link GoCardless Merchant Account')
  })

  it('should not render Link GoCardless Merchant Account naviagtion link when user does not have connected-gocardless-account:update', function () {
    const testPermissions = {
      connected_gocardless_account_update: false
    }
    const templateData = {
      permission: testPermissions,
      showSettingsNav: true,
      adminNavigationItems: adminNavigationItems('/api-keys', testPermissions, 'direct debit')
    }

    const body = renderTemplate('api-keys/index', templateData)
    body.should.not.containSelector('.settings-navigation li:nth-child(1)').withExactText('Link GoCardless Merchant Account')
  })
})
