const { URL } = require('url')

const parseUrlFromReq = (req) => {
  const baseUrl = req.protocol + '://' + req.headers.host + '/'
  return new URL(req.url, baseUrl)
}

const getQueryStringForUrl = (url) => {
  if (url.search === null) {
    return ''
  } else {
    // remove leading `?`
    return url.search.substring(1)
  }
}

module.exports = {
  parseUrlFromReq: parseUrlFromReq,
  getQueryStringForUrl: getQueryStringForUrl
}
