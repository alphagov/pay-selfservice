'use strict'

const lodash = require('lodash')
const logger = require('../../utils/logger')(__filename)
const paths = require('../../paths')
const zendeskClient = require('../../services/clients/zendesk.client')

module.exports = async function postZendeskFeedback (req, res) {
  const message = `Feedback rating: ${req.body['feedback-rating']}
----
${req.body['feedback-suggestion']}`

  const opts = {
    email: req.body.email,
    name: '(no name supplied)',
    type: 'question',
    subject: 'Feedback from service',
    tags: ['general_feedback', 'govuk_pay_support'],
    message
  }

  try {
    await zendeskClient.createTicket(opts)

    lodash.set(req, 'session.pageData.feedback', {})
    req.flash('generic', 'Thanks for your feedback')
    return res.redirect(paths.feedback)
  } catch (err) {
    logger.error('Error posting request to Zendesk', {
      error: {
        message: err.message,
        stack: err.stack,
        statusCode: err.statusCode
      }
    })
    req.flash('genericError', 'We couldn’t send your feedback. Please try again')
    return res.redirect(paths.feedback)
  }
}
