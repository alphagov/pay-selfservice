'use strict'

const lodash = require('lodash')

const { response } = require('../../utils/response.js')

module.exports = (req, res) => {
  const pageData = {
    email: req.user.email
  }

  const sessionFeedback = lodash.get(req, 'session.pageData.feedback', {})
  if (sessionFeedback) {
    pageData.suggestion = sessionFeedback['feedback-suggestion']
    pageData.rating = sessionFeedback['feedback-rating']
  }

  return response(req, res, 'feedback/index', pageData)
}
