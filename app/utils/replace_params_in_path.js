'use strict'

module.exports = (path, ...pathParams) => {
  const paramNames = path.split('/').filter(segment => segment.charAt(0) === ':')
  paramNames.forEach((paramName, index) => {
    if (pathParams[index]) {
      path = path.replace(paramName, pathParams[index])
    }
  })
  return path
}
