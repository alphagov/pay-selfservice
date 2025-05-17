import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { NavigationBuilder, NavigationCategories } from '@utils/simplified-account/navigation/NavigationBuilder.class'
import { WORLDPAY, STRIPE } from '@models/constants/payment-providers'
import GatewayAccount from '@models/GatewayAccount.class'
import Service from '@models/Service.class'
import { LIVE } from '@models/constants/go-live-stage'

export = (account: GatewayAccount, service: Service, currentUrl: string, permissions: Record<string, boolean>) => {
  const navBuilder = new NavigationBuilder(currentUrl, permissions)
  const serviceSettings = navBuilder
    .category('about your service', { collapsible: true })
    .add({
      id: 'service-name',
      name: 'service name',
      path: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.serviceName.index,
        service.externalId,
        account.type
      ),
      permission: 'service_name_update', // TODO find a better way of defining these
    })
    .add({
      id: 'email-notifications',
      name: 'email notifications',
      path: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.emailNotifications.index,
        service.externalId,
        account.type
      ),
      permission: true, // everyone can view email notifications settings
      alwaysViewable: true,
    })
    .add({
      id: 'team-members',
      name: 'team members',
      path: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.teamMembers.index,
        service.externalId,
        account.type
      ),
      permission: true, // everyone can view team members settings
    })
    .add({
      id: 'organisation-details',
      name: 'organisation details',
      path: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.organisationDetails.index,
        service.externalId,
        account.type
      ),
      permission: 'merchant_details_update', // TODO find a better way of defining these
    })
    .category('payment provider', { collapsible: true })
    .add({
      id: 'stripe-details',
      name: 'stripe details',
      path: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.stripeDetails.index,
        service.externalId,
        account.type
      ),
      permission:
        account.paymentProvider === 'stripe' &&
        account.type === 'live' &&
        Boolean(permissions?.stripe_account_details_update),
    })
    .add({
      id: 'worldpay-details',
      name: 'worldpay details',
      path: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.worldpayDetails.index,
        service.externalId,
        account.type
      ),
      permission: account.paymentProvider === 'worldpay' && 'gateway_credentials_read',
      alwaysViewable: true, // worldpay test accounts are user configurable so details should always be visible
    })
    .add({
      id: 'switch-psp', // sits under settings/switch-psp/switch-to-worldpay
      name: 'switch to Worldpay',
      path: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index,
        service.externalId,
        account.type
      ),
      permission: account.isSwitchingToProvider(WORLDPAY) && 'gateway_credentials_update',
    })
    .add({
      id: 'switch-psp', // sits under settings/switch-psp/switch-to-stripe
      altId: 'stripe-details', // when switching psp to stripe, stripe-details pages should show `Switch to Stripe` in the nav
      name: 'switch to Stripe',
      path: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.switchPsp.switchToStripe.index,
        service.externalId,
        account.type
      ),
      permission: account.isSwitchingToProvider(STRIPE) && 'gateway_credentials_update',
    })
    .category('payments', { collapsible: true })
    .add({
      id: 'card-payments',
      name: 'card payments',
      path: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.cardPayments.index,
        service.externalId,
        account.type
      ),
      permission: true, // everyone can view card payments settings
      alwaysViewable: true,
    })
    .add({
      id: 'card-types',
      name: 'card types',
      path: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.cardTypes.index,
        service.externalId,
        account.type
      ),
      permission: true, // everyone can view card types settings
      alwaysViewable: true,
    })
    .category('developers', { collapsible: true })
    .add({
      id: 'api-keys',
      name: 'API keys',
      path: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.apiKeys.index,
        service.externalId,
        account.type
      ),
      permission: 'tokens_active_read',
      alwaysViewable: true,
    })
    .add({
      id: 'webhooks',
      name: 'webhooks',
      path: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.webhooks.index,
        service.externalId,
        account.type
      ),
      permission: 'webhooks_update', // TODO find a better way of defining these
      alwaysViewable: true,
    })
    .build()
  return getViewableSettings(serviceSettings, account, service.currentGoLiveStage)
}

const shouldShowSettingForAccountTypeAndGoLiveStage = (account: GatewayAccount, goLiveStage: string) => {
  if (account.type === 'test') {
    // For test accounts, show setting only if the go live stage is not LIVE
    return goLiveStage !== LIVE
  } else if (account.type === 'live') {
    // Always display settings for live accounts
    return true
  }
  return false
}

const getViewableSettings = (serviceSettings: NavigationCategories, account: GatewayAccount, goLiveStage: string) => {
  const viewableSettings: NavigationCategories = {}

  for (const [category, details] of Object.entries(serviceSettings)) {
    const viewableCategory = details.items.filter(
      (setting) =>
        (setting.alwaysViewable || shouldShowSettingForAccountTypeAndGoLiveStage(account, goLiveStage)) &&
        setting.permitted
    )

    const hasActiveSetting = details.items.some((setting) => setting.current)

    if (viewableCategory.length > 0) {
      viewableSettings[category] = {
        items: viewableCategory,
        settings: {
          displayCategoryName: details.settings.displayCategoryName,
          collapsible: details.settings.collapsible,
          defaultState: hasActiveSetting ? 'open' : 'closed',
        },
      }
    }
  }

  return viewableSettings
}
