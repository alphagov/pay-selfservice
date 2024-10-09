const paths = require('../../paths')
const formatSimplifiedAccountPathsFor = require('./format/format-simplified-account-paths-for')
const { LIVE } = require('../../models/go-live-stage')

module.exports = (account, currentUrl, goLiveStage, permissions) => {
  const serviceSettings = {
    'about your service': [],
    'payments': [],
    'developers': []
  }
  buildAboutServiceSettings(serviceSettings, account, currentUrl, permissions)
  buildPaymentSettings(serviceSettings, account, currentUrl)
  buildDeveloperSettings(serviceSettings, account, currentUrl)
  return getViewableSettings(serviceSettings, account, goLiveStage)
}

const buildAboutServiceSettings = (serviceSettings, account, currentUrl, permissions) => {
  const aboutYourServiceSettings = [
    {
      id: 'service-name',
      name: 'service name',
      url: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.index, account.service_id, account.type),
      current: currentUrl.includes('simplified') && currentUrl.includes('settings/service-name'),
      permitted: permissions.service_name_update,
      alwaysViewable: false
    },
    {
      id: 'email-notifications',
      name: 'email notifications',
      url: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.index, account.service_id, account.type),
      current: currentUrl.includes('simplified') && currentUrl.includes('settings/email-notifications'),
      permitted: true, // TODO
      alwaysViewable: true
    },
    {
      id: 'team-members',
      name: 'team members',
      url: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.index, account.service_id, account.type),
      current: currentUrl.includes('simplified') && currentUrl.includes('settings/team-members'),
      permitted: true, // TODO
      alwaysViewable: false
    },
    {
      id: 'org-details',
      name: 'Organisation details',
      url: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.index, account.service_id, account.type),
      current: currentUrl.includes('simplified') && currentUrl.includes('settings/org-details'),
      permitted: true, // TODO
      alwaysViewable: false
    }
  ]
  aboutYourServiceSettings.forEach(setting => serviceSettings['about your service'].push(setting))
  return serviceSettings
}

const buildPaymentSettings = (serviceSettings, account, currentUrl) => {
  const paymentSettings = [
    {
      id: 'card-paymemts',
      name: 'card payments',
      url: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.index, account.service_id, account.type),
      current: currentUrl.includes('simplified') && currentUrl.includes('settings/team-members'),
      permitted: true, // TODO
      alwaysViewable: true
    },
    {
      id: 'card-types',
      name: 'card types',
      url: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.index, account.service_id, account.type),
      current: currentUrl.includes('simplified') && currentUrl.includes('settings/team-members'),
      permitted: true, // TODO
      alwaysViewable: true
    }
  ]
  paymentSettings.forEach(setting => serviceSettings['payments'].push(setting))
  return serviceSettings
}

const buildDeveloperSettings = (serviceSettings, account, currentUrl) => {
  serviceSettings['developers'].push({
    id: 'api-keys',
    name: 'API keys',
    url: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.index, account.service_id, account.type),
    current: currentUrl.includes('simplified') && currentUrl.includes('settings/team-members'),
    permitted: true, // TODO
    alwaysViewable: true
  })
  serviceSettings['developers'].push({
    id: 'webhooks',
    name: 'webhooks',
    url: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.index, account.service_id, account.type),
    current: currentUrl.includes('simplified') && currentUrl.includes('settings/team-members'),
    permitted: true, // TODO
    alwaysViewable: true
  })
  return serviceSettings
}

const shouldShowSettingForAccountTypeAndGoLiveStage = (account, goLiveStage) => {
  if (account.type === 'test') {
    // For test accounts, show setting only if goLive status is not LIVE
    return goLiveStage !== LIVE
  } else if (account.type === 'live') {
    // Always display settings for live accounts
    return true
  }
  return false
}

const getViewableSettings = (serviceSettings, account, goLiveStage) => {
  const viewableSettings = {}

  for (const [category, settings] of Object.entries(serviceSettings)) {
    const viewableCategory = settings.filter(setting =>
      (setting.alwaysViewable || shouldShowSettingForAccountTypeAndGoLiveStage(account, goLiveStage)) && setting.permitted
    )

    if (viewableCategory.length > 0) {
      viewableSettings[category] = viewableCategory
    }
  }

  return viewableSettings
}
