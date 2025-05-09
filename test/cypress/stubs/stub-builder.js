'use strict'

/**
 *
 * @param {String} method
 * @param {String} path
 * @param {Number} responseCode
 * @param additionalParams
 * @returns {{predicates: ({deepEquals: {path, method}}|{equals: {path, method}})[], name: string, responses: [{is: {headers: (*|{'Content-Type': string}), statusCode}}]}}
 */
function stubBuilder (method, path, responseCode, additionalParams = {}) {
  const request = {
    method,
    path
  }
  if (additionalParams.request) {
    request.body = additionalParams.request
  }
  if (additionalParams.query) {
    request.query = additionalParams.query
  }

  const response = {
    statusCode: responseCode,
    headers: additionalParams.responseHeaders || { 'Content-Type': 'application/json' }
  }
  if (additionalParams.response) {
    response.body = additionalParams.response
  }

  let predicate
  if (additionalParams?.deepMatchRequest === false) {
    predicate = { equals: request }
  } else {
    predicate = { deepEquals: request }
  }

  const stub = {
    name: `${method} ${path} ${responseCode}`,
    predicates: [predicate],
    responses: [{
      is: response
    }]
  }

  return stub
}

module.exports = {
  stubBuilder
}
