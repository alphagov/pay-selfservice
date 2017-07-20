let _ = require('lodash')
const paths = require('./../paths')
const pathLookup = require('./pathLookup')

const serviceNavigationItems = (originalUrl, permissions) => {
  return [
    {
      name: 'Dashboard',
      url: paths.user.loggedIn,
      current: pathLookup(originalUrl, paths.user.loggedIn),
      permissions: true
    },
    {
      name: 'Transactions',
      url: paths.transactions.index,
      current: pathLookup(originalUrl, paths.transactions.index),
      permissions: permissions.transactions_read
    },
    {
      name: 'Settings',
      url: paths.devTokens.index,
      current: pathLookup(originalUrl, [
        paths.credentials,
        paths.notificationCredentials,
        paths.serviceName,
        paths.toggle3ds,
        paths.devTokens,
        paths.emailNotifications,
        paths.paymentTypes
      ]),
      permissions: _.some([
        permissions.tokens_read,
        permissions.gateway_credentials_read,
        permissions.service_name_read,
        permissions.payment_types_read,
        permissions.toggle_3ds_read,
        permissions.email_notification_template_read
      ], Boolean)
    }
  ]
}

const adminNavigationItems = (originalUrl, permissions) => {
  return [
    {
      name: 'API Keys',
      url: paths.devTokens.index,
      current: pathLookup(originalUrl, paths.devTokens.index),
      permissions: permissions.tokens_read
    },
    {
      name: 'Account credentials',
      url: paths.credentials.index,
      current: pathLookup(originalUrl, paths.credentials.index),
      permissions: permissions.gateway_credentials_read
    },
    {
      name: 'Change service name',
      url: paths.serviceName.index,
      current: pathLookup(originalUrl, paths.serviceName.index),
      permissions: permissions.service_name_read
    },
    {
      name: 'Payment types',
      url: paths.paymentTypes.summary,
      current: pathLookup(originalUrl, paths.paymentTypes.summary),
      permissions: permissions.payment_types_read
    },
    {
      name: '3D Secure',
      url: paths.toggle3ds.index,
      current: pathLookup(originalUrl, paths.toggle3ds.index),
      permissions: permissions.toggle_3ds_read
    },
    {
      name: 'Email notifications',
      url: paths.emailNotifications.index,
      current: pathLookup(originalUrl, paths.emailNotifications.index),
      permissions: permissions.email_notification_template_read
    }
  ]
}

module.exports = {
  serviceNavigationItems: serviceNavigationItems,
  adminNavigationItems: adminNavigationItems
}
