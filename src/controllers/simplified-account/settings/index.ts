import * as emailNotifications from './email-notifications/email-notifications.controller'
import * as organisationDetails from './organisation-details/organisation-details.controller'
import * as serviceName from './service-name/service-name.controller'
import * as stripeDetails from './stripe-details/stripe-details.controller'
import * as teamMembers from './team-members/team-members.controller'
import * as cardTypes from './card-types/card-types.controller'
import * as cardPayments from './card-payments/card-payments.controller'
import * as worldpayDetails from './worldpay-details/worldpay-details.controller'
import * as apiKeys from './api-keys/api-keys.controller'
import * as webhooks from './webhooks/webhooks.controller'
import * as switchPsp from './switch-psp'

export = {
  emailNotifications,
  organisationDetails,
  serviceName,
  stripeDetails,
  teamMembers,
  cardTypes,
  cardPayments,
  worldpayDetails,
  apiKeys,
  webhooks,
  switchPsp,
}
