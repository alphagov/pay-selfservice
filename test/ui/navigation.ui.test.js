const { render } = require('../test-helpers/html-assertions')
const { serviceNavigationItems, adminNavigationItems } = require('../../app/utils/nav-builder')

describe('navigation menu', () => {
  it(
    'should render only Home link when user does have any of the required permissions to show the navigation links',
    () => {
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

      const body = render('dashboard/index', templateData)

      expect(body).containSelector('.service-navigation--list-item:nth-child(1)').withExactText('Dashboard')
    }
  )

  it(
    'should render Transactions navigation link when user have transactions read permission and payment type is card',
    () => {
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

      const body = render('dashboard/index', templateData)

      expect(body).containSelector('#navigation-menu-transactions').withExactText('Transactions')
    }
  )

  it(
    'should render Transactions navigation link when user have transactions read permission and payment type is direct debit',
    () => {
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

      expect(body).containNoSelector('#navigation-menu-transactions')
    }
  )

  it(
    'should render API keys navigation link when user have tokens read permission',
    () => {
      const testPermissions = {
        tokens_update: true
      }
      const templateData = {
        permissions: testPermissions,
        showSettingsNav: true,
        adminNavigationItems: adminNavigationItems('/api-keys', testPermissions, 'card', 'sandbox')
      }

      const body = render('api-keys/index', templateData)

      expect(body).containSelector('.settings-navigation li:nth-child(2)').withExactText('API keys')
    }
  )

  it(
    'should render Accounts credentials navigation link when user have gateway credentials read permission' +
    ' and payment provider is NOT `stripe` ',
    () => {
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

      const body = render('api-keys/index', templateData)

      expect(body).containSelector('.settings-navigation li:nth-child(2)').withExactText('Your PSP - Worldpay')
    }
  )

  it(
    'should not render Accounts credentials navigation link when user have gateway credentials read permission' +
    ' and payment provider is `stripe`',
    () => {
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

      const body = render('api-keys/index', templateData)

      expect(body).not.containSelector('.settings-navigation li:nth-child(2)')
    }
  )

  it(
    'should not render Your PSP navigation link when user have gateway credentials read permission' +
    ' and payment provider is `sandbox`',
    () => {
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
        adminNavigationItems: adminNavigationItems('/api-keys', testPermissions, 'card', 'sandbox')
      }

      const body = render('api-keys/index', templateData)

      expect(body).not.containSelector('.settings-navigation li:nth-child(2)')
    }
  )

  it(
    'should render Card types navigation link when user have card Types read permission',
    () => {
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
        adminNavigationItems: adminNavigationItems('/api-keys', testPermissions, 'card', 'sandbox')
      }

      const body = render('api-keys/index', templateData)

      expect(body).containSelector('.settings-navigation li:nth-child(2)').withExactText('Card types')
    }
  )

  it(
    'should not render card navigation links when gateway account is direct debit',
    () => {
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

      const body = render('api-keys/index', templateData)

      expect(body).containSelector('.settings-navigation li:nth-child(1)').withExactText('API keys')
      expect(body).toEqual(expect.not.arrayContaining(['Your PSP']))
      expect(body).toEqual(expect.not.arrayContaining(['3D Secure']))
      expect(body).toEqual(expect.not.arrayContaining(['Card types']))
      expect(body).toEqual(expect.not.arrayContaining(['Email notifications']))
      expect(body).toEqual(expect.not.arrayContaining(['Billing address']))
    }
  )

  it(
    'should not render direct debit navigation links when gateway account is card',
    () => {
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
        adminNavigationItems: adminNavigationItems('/api-keys', testPermissions, 'card', 'worldpay')
      }

      const body = render('api-keys/index', templateData)

      expect(body).containSelector('.settings-navigation li:nth-child(1)').withExactText('Settings')
      expect(body).containSelector('.settings-navigation li:nth-child(2)').withExactText('API keys')
      expect(body).containSelector('.settings-navigation li:nth-child(3)').withExactText('Your PSP - Worldpay')
      expect(body).containSelector('.settings-navigation li:nth-child(4)').withExactText('Card types')
    }
  )
})
