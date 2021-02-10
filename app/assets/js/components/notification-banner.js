(function() {
  var BANNER_ID = 'my-services-whats-new-notification'
  var SIX_MONTHS_IN_SECS = 60 * 60 * 24 * 30 * 6

  function hideBanner(e) {
    e.preventDefault()

    document.cookie = 'govuk_pay_notifications={"my_services_default_page_dismissed":true}'
      + ';max-age=' + SIX_MONTHS_IN_SECS
    runAnalytics()
    removeBanner()
  }
  
  function runAnalytics(){
    if (window._gaq){
      _gaq.push(['_trackEvent', 'button', 'clicked', 'close', undefined, 'true'])
    }
  }

  function removeBanner(){
    var banner = document.getElementById(BANNER_ID)
    banner.remove()
  }

  function initAnalytics(){
    if (window.ga){
      ga('send', {
        hitType: 'event',
        eventCategory: 'Banner',
        eventAction: 'Load',
        eventLabel: 'Seen'
      });
    }
  }

  function init(){
    const banner = document.getElementById(BANNER_ID)

    if (banner){
      initAnalytics()
      banner.addEventListener('click', hideBanner, false)
    }    
  } 

  window.document.addEventListener('DOMContentLoaded', init)
})()
