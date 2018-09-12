'use strict'

// NPM dependencies
const lodash = require('lodash')
const logger = require('winston')
const zendeskClient = require('node-zendesk')

// Local dependencies
const paths = require('../../paths')
const zendeskConfig = require('../../../config/zendesk')

const zendesk = zendeskClient.createClient({
  username: 'zd-api-pay@digital.cabinet-office.gov.uk',
  token: process.env.ZENDESK_API_KEY,
  remoteUri: 'https://govuk.zendesk.com/api/v2',
  proxy: process.env.http_proxy
})

module.exports = (req, res) => {
  const message = `Service name: ${req.body['service-name']}
External ID: ${req.body['service-external-id']}
Gateway account: ${req.body['service-gateway']}
Feedback rating: ${req.body['feedback-rating']}
----
${req.body['feedback-suggestion']}`

  zendesk.tickets.create({
    ticket: {
      requester: {
        email: req.body.email,
        name: '(no name supplied)'
      },
      type: 'question',
      subject: `Feedback from: ${req.body['service-name']}`,
      comment: {
        body: message
      },
      group_id: zendeskConfig.GROUP_ID,
      organization_id: zendeskConfig.ORG_ID,
      tags: ['general_feedback', 'govuk_pay_support'],
      assignee_id: zendeskConfig.ASSIGNEE_ID
    }
  }, (err, request, result) => {
    if (err) {
      lodash.set(req, 'session.pageData.feedback', {
        'feedback-suggestion': req.body['feedback-suggestion'],
        'feedback-rating': req.body['feedback-rating']
      })
      logger.error(`Error posting request to Zendesk - ${err}`)
      req.flash('genericError', `<h2>We couldn’t send your feedback</h2><p>Please try again</p>`)
      return res.redirect(paths.feedback)
    }

    lodash.set(req, 'session.pageData.feedback', {})
    req.flash('generic', `<h2>Thanks for your feedback</h2>`)
    return res.redirect(paths.feedback)
  })
}
