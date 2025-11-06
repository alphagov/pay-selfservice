const EXPERIMENTAL_FEATURES_FLAG = process.env.EXPERIMENTAL_FEATURES_FLAG ?? ''

const ENABLED_FEATURES =
  EXPERIMENTAL_FEATURES_FLAG === 'true' ? ['all'] : EXPERIMENTAL_FEATURES_FLAG.toLowerCase().split(',')
const FEATURE_SET = new Set(ENABLED_FEATURES)

const Features = {
  enabled: ENABLED_FEATURES,
  isEnabled: (featureName: string) => {
    return FEATURE_SET.has('all') || FEATURE_SET.has(featureName)
  },
  PAYMENT_LINKS: 'payment_links',
  MY_SERVICES: 'my_services',
  TRANSACTIONS: 'transactions',
  SIDEBAR_NAV: 'sidebar_nav',
  DASHBOARD: 'dashboard',
  HEADER: 'header',
}

export { Features }
