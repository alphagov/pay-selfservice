const { URL } = require('url')

const parseUrlFromReq = (req) => {
  const baseUrl = req.protocol + '://' + req.headers.host + '/'
  return new URL(req.url, baseUrl)
}

const getQueryStringForReq = (req) => {
  const requestUrl = parseUrlFromReq(req)
  // remove leading `?`
  return requestUrl.search.substring(1)
}

module.exports = {
  parseUrlFromReq: parseUrlFromReq,
  getQueryStringForReq: getQueryStringForReq
}
