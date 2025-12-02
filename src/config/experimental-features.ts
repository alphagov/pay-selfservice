const EXPERIMENTAL_FEATURES_FLAG = process.env.EXPERIMENTAL_FEATURES_FLAG === 'true'
const EXPERIMENTAL_FEATURES_LIST = process.env.EXPERIMENTAL_FEATURES_LIST ?? ''

const ENABLED_FEATURES = EXPERIMENTAL_FEATURES_LIST.toLowerCase().split(',')
const FEATURE_SET = new Set(ENABLED_FEATURES)

const Features = {
  enabled: ENABLED_FEATURES,
  isEnabled: (featureName: string) => {
    return EXPERIMENTAL_FEATURES_FLAG && (FEATURE_SET.has('all') || FEATURE_SET.has(featureName))
  },
  TRANSACTIONS: 'transactions',
  SIDEBAR_NAV: 'sidebar_nav',
}

export { Features }
