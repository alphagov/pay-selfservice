function generateUrl (template, urlParams = {}, queryParams = {}) {
  const matches = template.match(/\{(\w+)}/g)
  if (matches) {
    const urlParamKeys = Object.keys(urlParams)
    const expectedUrlParams = matches.map(x => x.substring(1, x.length - 1))
    const missingUrlParams = expectedUrlParams.filter(x => !urlParamKeys.includes(x))
    const additionalUrlParams = urlParamKeys.filter(x => !expectedUrlParams.includes(x))
    if (missingUrlParams.length > 0) {
      throw new Error(`Missing required variable${missingUrlParams.length > 1 ? 's' : ''} [${missingUrlParams.join(', ')}] when preparing URL, template was [${template}], parameters were [${JSON.stringify(urlParams)}]`)
    }
    if (additionalUrlParams.length > 0) {
      throw new Error(`Unexpected variable${additionalUrlParams.length > 1 ? 's' : ''} provided [${additionalUrlParams.join(', ')}] when preparing URL, template was [${template}], parameters were [${JSON.stringify(urlParams)}]`)
    }
  }
  const url = Object.keys(urlParams).reduce((acc, key) => {
    return acc.replaceAll(`{${key}}`, encodeURIComponent(urlParams[key]).replaceAll('%20', '+'))
  }, template)
  const queryString = Object.keys(queryParams).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`).join('&')
  if (queryString.length === 0) {
    return url
  }
  if (url.includes('?')) {
    return url + '&' + queryString
  }
  return url + '?' + queryString
}

module.exports = {
  generateUrl
}
