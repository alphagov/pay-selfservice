const { render } = require('@test/test-helpers/html-assertions')
const { serviceNavigationItems } = require('@utils/nav-builder')

describe('navigation menu', function () {
  it('should render only Home link when user does have any of the required permissions to show the navigation links', function () {
    const testPermissions = {
      tokens_read: true
    }
    const templateData = {
      currentGatewayAccount: {
        full_type: 'test',
        payment_provider: 'sandbox'
      },
      currentService: { name: 'Service Name' },
      permissions: testPermissions,
      hideServiceNav: false,
      hideServiceHeader: false,
      loggedIn: true,
      serviceNavigationItems: serviceNavigationItems('/', testPermissions, 'card', '/account/account-id/dashboard'),
      possibleActions: [],
      dashboardActions: [],
    }

    const body = render('simplified-account/services/dashboard/index', templateData)
    body.should.containSelector('.govuk-service-navigation__item:nth-child(1)').withExactText('Dashboard')
  })

  it('should render Transactions navigation link when user have transactions read permission and payment type is card', function () {
    const testPermissions = {
      transactions_read: true
    }
    const templateData = {
      currentGatewayAccount: {
        full_type: 'test',
        paymentProvider: 'sandbox'
      },
      currentService: { name: 'Service Name' },
      permissions: testPermissions,
      hideServiceNav: false,
      hideServiceHeader: false,
      loggedIn: true,
      serviceNavigationItems: serviceNavigationItems('/', testPermissions, 'card', '/account/account-id/dashboard'),
      possibleActions: [],
      dashboardActions: []
    }

    const body = render('simplified-account/services/dashboard/index', templateData)
    body.should.containSelector('.govuk-service-navigation__item:nth-child(2)').withExactText('Transactions')
  })
})
