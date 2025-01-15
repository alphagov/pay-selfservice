/* global ga */
const newContractTermsBanner = () => {
  const BANNER_ID = 'my-services-notification-banner'
  const HIDE_BUTTON_ID = 'my-services-notification-banner__close-button'
  const SIX_MONTHS_IN_SECS = 60 * 60 * 24 * 30 * 6

  const hideBanner = (e) => {
    e.preventDefault()

    document.cookie = 'govuk_pay_notifications={"new_contract_terms_banner_dismissed":true}' +
      ';max-age=' + SIX_MONTHS_IN_SECS + ';SameSite=Lax'
    runAnalytics()
    removeBanner()
  }

  const runAnalytics = () => {
    if (window.ga) {
      ga('send', 'event', { eventCategory: 'Banner', eventAction: 'Click', eventLabel: 'BannerClose', eventValue: 0 })
    }
  }

  const removeBanner = () => {
    const banner = document.getElementById(BANNER_ID)
    banner.remove()
  }

  const initAnalytics = () => {
    if (window.ga) {
      ga('send', {
        hitType: 'event',
        eventCategory: 'Banner',
        eventAction: 'Load',
        eventLabel: 'Seen'
      })
    }
  }

  const init = () => {
    const banner = document.getElementById(BANNER_ID)
    const hideButton = document.getElementById(HIDE_BUTTON_ID)

    if (banner && hideButton) {
      initAnalytics()
      hideButton.addEventListener('click', hideBanner, false)
    }
  }

  window.document.addEventListener('DOMContentLoaded', init)
}

export default newContractTermsBanner
