const setupAnalytics = () => {
  const gtagScript = document.createElement('script')
  gtagScript.async = true
  gtagScript.setAttribute('src', 'https://www.googletagmanager.com/gtag/js?id=G-XE9K05CFFE')
  document.head.appendChild(gtagScript)

  window.dataLayer = window.dataLayer || []

  // needs to be a regular function to maintain access to the arguments object
  function gtag () {
    // eslint-disable-next-line no-undef
    dataLayer.push(arguments)
  }

  gtagScript.onload = function () {
    gtag('js', new Date())
    gtag('config', 'G-XE9K05CFFE')
  }
}

export default setupAnalytics
