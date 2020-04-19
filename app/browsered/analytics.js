
function loadGoogleAnalytics () { /* eslint-disable */
  (function(i, s, o, g, r, a, m){ i['GoogleAnalyticsObject'] = r; i[r] = i[r] || function () {
    (i[r].q = i[r].q || []).push(arguments) }, i[r].l = 1 * new Date(); a = s.createElement(o),
    m = s.getElementsByTagName(o)[0]; a.async = 1; a.src = g; m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga')
}

function setupAnalytics () {
  // analyticsTrackingId is configurable and set globally in head.njk
  ga('create', analyticsTrackingId, 'auto')
  ga('set', 'anonymizeIp', true)
  ga('set', 'displayFeaturesTask', null)
  ga('set', 'transport', 'beacon')

  ga('create', linkedTrackingId, 'auto', 'govuk_shared', { 'allowLinker': true })
  ga('govuk_shared.require', 'linker')
  ga('govuk_shared.linker.set', 'anonymizeIp', true)
  ga('govuk_shared.linker:autoLink', ['www.gov.uk'])

  ga('set', 'page', getPathWithoutPII())
  ga('send', 'pageview')
  ga('govuk_shared.send', 'pageview')
}

function getPathWithoutPII(){
  var email_regex = /&email=([^\s=/?&]+(?:@|%40)[^\s=/?&]+)/gi;

  return document.location.pathname +
    document.location.search.replace(email_regex, '&email=')
}

module.exports.init = () => {
  loadGoogleAnalytics()
  setupAnalytics()
}

module.exports.setupAnalytics = () => {
  setupAnalytics()
}
