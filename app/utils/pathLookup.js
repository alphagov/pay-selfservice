// function to see if current url matches another URL,
// useful for navigation.
let _ = require('lodash')

module.exports = function (currentURL, url) {
  if (_.isArray(url)) {
    let found = false
    url.forEach(function (urls) {
      if (_.includes(urls, currentURL)) {
        found = true
      }
    })
    return found
  } else if (currentURL.includes(url)) {
    return true
  } else {
    return false
  }
}
