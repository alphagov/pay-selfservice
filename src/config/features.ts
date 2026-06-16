const EXPERIMENTAL_FEATURES_FLAG = process.env.EXPERIMENTAL_FEATURES_FLAG === 'true'
const EXPERIMENTAL_FEATURES_LIST = process.env.EXPERIMENTAL_FEATURES_LIST ?? ''
const ENABLE_GO_LIVE_REQUESTS_FOR_ADYEN = process.env.ENABLE_GO_LIVE_REQUESTS_FOR_ADYEN === 'true'

const ENABLED_FEATURES = EXPERIMENTAL_FEATURES_LIST.toLowerCase().split(',')
const FEATURE_SET = new Set(ENABLED_FEATURES)

const Features = {
  enabled: ENABLED_FEATURES,
  isEnabled: (featureName: string) => {
    return EXPERIMENTAL_FEATURES_FLAG && (FEATURE_SET.has('all') || FEATURE_SET.has(featureName))
  },
  isAdyenEnabledInGoLiveRequest:() => {
    return ENABLE_GO_LIVE_REQUESTS_FOR_ADYEN
  },
  TRANSACTIONS: 'transactions',
  SIDEBAR_NAV: 'sidebar_nav',
}

export { Features }
