'use strict'

const paths = require('../../paths')
const publicAuthClient = require('../../services/clients/public-auth.client')
const logger = require('../../utils/logger')(__filename)
const formatAccountPathsFor = require('../../utils/format-account-paths-for')

module.exports = async function updateApiKey (req, res) {
  const apiKeysPath = formatAccountPathsFor(paths.account.apiKeys.index, req.account.external_id)

  // this does not need to be explicitly tied down to account_id
  // right now because the UUID space is big enough that no-one
  // will be able to discover other peoples' tokens to change them
  const payload = {
    token_link: req.body.token_link,
    description: req.body.description
  }

  try {
    await publicAuthClient.updateToken({
      payload
    })

    req.flash('generic', 'The API key description was successfully updated')
    res.redirect(apiKeysPath)
  } catch (error) {
    logger.error('Error updating API key description', { error })
    req.flash('genericError', 'Something went wrong. Please try again or contact support.')
    res.redirect(apiKeysPath)
  }
}
