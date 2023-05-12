const { render } = require('../test-helpers/html-assertions')
const { serviceNavigationItems, adminNavigationItems } = require('../../app/utils/nav-builder')
const formatAccountPathsFor = require('../../app/utils/format-account-paths-for')
const gatewayAccountFixtures = require('../fixtures/gateway-account.fixtures')

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
      hideServiceHeader: false,
      loggedIn: true,
      serviceNavigationItems: serviceNavigationItems('/', testPermissions, 'card'),
      links: [],
      linksToDisplay: [],
      formatAccountPathsFor
    }

    const body = render('dashboard/index', templateData)

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
      hideServiceHeader: false,
      loggedIn: true,
      serviceNavigationItems: serviceNavigationItems('/', testPermissions, 'card'),
      links: [],
      linksToDisplay: []
    }

    const body = render('dashboard/index', templateData)

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

    const body = render('dashboard/index', templateData)

    body.should.containNoSelector('#navigation-menu-transactions')
  })

  it('should render API keys navigation link when user have tokens read permission', function () {
    const testPermissions = {
      tokens_update: true
    }
    const templateData = {
      permissions: testPermissions,
      showSettingsNav: true,
      adminNavigationItems: adminNavigationItems('/api-keys', testPermissions, 'card', 'sandbox'),
      formatAccountPathsFor
    }

    const body = render('api-keys/index', templateData)

    body.should.containSelector('.settings-navigation li:nth-child(2)').withExactText('API keys')
  })

  it('should render Accounts credentials navigation link when user have gateway credentials read permission' +
  ' and payment provider is NOT `stripe` ', function () {
    const account = gatewayAccountFixtures.validGatewayAccount({
      gateway_account_credentials: [{
        payment_provider: 'worldpay'
      }]
    })
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
      adminNavigationItems: adminNavigationItems('/api-keys', testPermissions, 'card', 'worldpay', account),
      formatAccountPathsFor
    }

    const body = render('api-keys/index', templateData)

    body.should.containSelector('.settings-navigation li:nth-child(2)').withExactText('Your PSP - Worldpay')
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
      adminNavigationItems: adminNavigationItems('/api-keys', testPermissions, 'card', 'stripe'),
      formatAccountPathsFor
    }

    const body = render('api-keys/index', templateData)

    body.should.not.containSelector('.settings-navigation li:nth-child(2)')
  })

  it('should not render Your PSP navigation link when user have gateway credentials read permission' +
  ' and payment provider is `sandbox`', function () {
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
      adminNavigationItems: adminNavigationItems('/api-keys', testPermissions, 'card', 'sandbox'),
      formatAccountPathsFor
    }

    const body = render('api-keys/index', templateData)

    body.should.not.containSelector('.settings-navigation li:nth-child(2)')
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
      adminNavigationItems: adminNavigationItems('/api-keys', testPermissions, 'card', 'sandbox'),
      formatAccountPathsFor
    }

    const body = render('api-keys/index', templateData)

    body.should.containSelector('.settings-navigation li:nth-child(2)').withExactText('Card types')
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
      adminNavigationItems: adminNavigationItems('/api-keys', testPermissions, 'direct debit'),
      formatAccountPathsFor
    }

    const body = render('api-keys/index', templateData)

    body.should.containSelector('.settings-navigation li:nth-child(1)').withExactText('API keys')
    body.should.not.contain('Your PSP')
    body.should.not.contain('3D Secure')
    body.should.not.contain('Card types')
    body.should.not.contain('Email notifications')
    body.should.not.contain('Billing address')
  })
})
