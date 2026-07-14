const EXPERIMENTAL_FEATURES_FLAG = process.env.EXPERIMENTAL_FEATURES_FLAG === 'true'
const EXPERIMENTAL_FEATURES_LIST = process.env.EXPERIMENTAL_FEATURES_LIST ?? ''

const ENABLED_FEATURES = EXPERIMENTAL_FEATURES_LIST.toLowerCase().split(',')
const FEATURE_SET = new Set(ENABLED_FEATURES)

const Features = {
  PROVIDER_CHANGE_TO_ADYEN_LINK: 'provider_change_to_adyen_link',
  ENABLE_GO_LIVE_REQUESTS_FOR_ADYEN: 'enable_go_live_requests_for_adyen',

  enabled: ENABLED_FEATURES,

  isEnabled: (featureName: string) => {
    return EXPERIMENTAL_FEATURES_FLAG && (FEATURE_SET.has('all') || FEATURE_SET.has(featureName))
  },
  isAdyenEnabledInGoLiveRequest: (): boolean => {
    return Features.isEnabled(Features.ENABLE_GO_LIVE_REQUESTS_FOR_ADYEN)
  },
  isProviderChangeToAdyenLinkEnabled: (): boolean => {
    return Features.isEnabled(Features.PROVIDER_CHANGE_TO_ADYEN_LINK)
  },
}

export { Features }
