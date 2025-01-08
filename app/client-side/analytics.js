const setupAnalytics = () => {
  const gtagScript = document.createElement('script')
  gtagScript.async = true
  gtagScript.setAttribute('src', 'https://www.googletagmanager.com/gtag/js?id=G-XE9K05CFFE')
  document.head.appendChild(gtagScript)

  window.dataLayer = window.dataLayer || []

  // Disabling eslint as the Google snippet conflicts with our linting rules
  /* eslint-disable */
  const gtag = () => {
    dataLayer.push(arguments)
  }
  /* eslint-enable */

  gtagScript.onload = function () {
    gtag('js', new Date())
    gtag('config', 'G-XE9K05CFFE')
  }
}

export default setupAnalytics
