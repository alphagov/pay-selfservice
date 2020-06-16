'use strict'

const lodash = require('lodash')

const logger = require('../../utils/logger')(__filename)
const paths = require('../../paths')
const zendeskClient = require('../../services/clients/zendesk_client')

module.exports = (req, res) => {
  const message = `Service name: ${req.body['service-name']}
External ID: ${req.body['service-external-id']}
Gateway account: ${req.body['service-gateway']}
Feedback rating: ${req.body['feedback-rating']}
----
${req.body['feedback-suggestion']}`

  const opts = {
    email: req.body.email,
    name: '(no name supplied)',
    type: 'question',
    subject: `Feedback from: ${req.body['service-name']}`,
    tags: ['general_feedback', 'govuk_pay_support'],
    message: message
  }

  zendeskClient.createTicket(opts)
    .then(() => {
      lodash.set(req, 'session.pageData.feedback', {})
      req.flash('generic', `<h2>Thanks for your feedback</h2>`)
      return res.redirect(paths.feedback)
    }).catch(err => {
      lodash.set(req, 'session.pageData.feedback', {
        'feedback-suggestion': req.body['feedback-suggestion'],
        'feedback-rating': req.body['feedback-rating']
      })
      logger.error(`Error posting request to Zendesk - ${err}`)
      req.flash('genericError', `<h2>We couldn’t send your feedback</h2><p>Please try again</p>`)
      return res.redirect(paths.feedback)
    })
}
