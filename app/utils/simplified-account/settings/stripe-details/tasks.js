const formatSimplifiedAccountPathsFor = require('../../format/format-simplified-account-paths-for')
const paths = require('../../../../paths')
const logger = require('../../../logger')(__filename)

const stripeDetailsTasks = Object.freeze({
  bankAccount: {
    name: 'bankAccount',
    friendlyName: 'Organisation\'s bank details',
    path: paths.simplifiedAccount.settings.stripeDetails.bankAccount
  },
  responsiblePerson: {
    name: 'responsiblePerson',
    friendlyName: 'Responsible person',
    path: paths.simplifiedAccount.settings.stripeDetails.responsiblePerson
  },
  director: {
    name: 'director',
    friendlyName: 'Service director',
    path: paths.simplifiedAccount.settings.stripeDetails.director
  },
  vatNumber: {
    name: 'vatNumber',
    friendlyName: 'VAT registration number',
    path: paths.simplifiedAccount.settings.stripeDetails.vatNumber
  },
  companyNumber: {
    name: 'companyNumber',
    friendlyName: 'Company registration number',
    path: paths.simplifiedAccount.settings.stripeDetails.companyNumber
  },
  organisationDetails: {
    name: 'organisationDetails',
    friendlyName: 'Confirm your organisation\'s name and address match your government entity document',
    path: paths.simplifiedAccount.settings.stripeDetails.organisationDetails
  },
  governmentEntityDocument: {
    name: 'governmentEntityDocument',
    friendlyName: 'Government entity document',
    path: paths.simplifiedAccount.settings.stripeDetails.governmentEntityDocument
  }
})

const orderTasks = (target) => {
  const orderedTasks = {}
  Object.keys(stripeDetailsTasks).forEach(key => {
    if (key in target) {
      orderedTasks[key] = target[key]
    }
  })

  Object.keys(target).forEach(key => {
    if (!(key in orderedTasks)) {
      logger.warn(`Unexpected Stripe account setup step found in Connector response [key: ${key}]`)
    }
  })
  return orderedTasks
}

/**
 * @typedef {Object} friendlyStripeTasks
 * @property {string} href - formatted path for task
 * @property {boolean|string} status - true, false or 'disabled' in the case of gov entity document (if any other tasks are 'false')
 * @property {string} id - camelCase task name
 */

/**
 * Transforms connectorGatewayAccountStripeProgress into 'render-able' stripe details tasks
 * @param account {GatewayAccount}
 * @param service {GOVUKPayService}
 * @returns {friendlyStripeTasks|{}}
 */
const friendlyStripeTasks = (account, service) => {
  if (account.connectorGatewayAccountStripeProgress) {
    const progress = orderTasks(account.connectorGatewayAccountStripeProgress)
    const govEntityDocTaskUnavailable = Object.entries(progress)
      .some(([task, completed]) => task !== stripeDetailsTasks.governmentEntityDocument.name && completed === false)

    return Object.entries(progress).reduce((acc, [task, completed]) => {
      const friendlyName = stripeDetailsTasks[task].friendlyName
      const status = task === stripeDetailsTasks.governmentEntityDocument.name && govEntityDocTaskUnavailable ? 'disabled' : completed
      const href = formatSimplifiedAccountPathsFor(stripeDetailsTasks[task].path, service.externalId, account.type)
      const id = stripeDetailsTasks[task].name
      acc[friendlyName] = {
        href,
        status,
        id
      }
      return acc
    }, {})
  } else {
    return {}
  }
}

module.exports = friendlyStripeTasks
