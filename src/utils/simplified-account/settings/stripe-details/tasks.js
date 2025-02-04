const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const TASK_STATUS = require('@models/task-status')
const logger = require('@utils/logger')(__filename)

const stripeDetailsTasks = Object.freeze({
  bankAccount: {
    name: 'bankAccount',
    friendlyName: 'Organisation\'s bank details',
    path: paths.simplifiedAccount.settings.stripeDetails.bankDetails
  },
  responsiblePerson: {
    name: 'responsiblePerson',
    friendlyName: 'Responsible person',
    path: paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.index
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
    path: paths.simplifiedAccount.settings.stripeDetails.organisationDetails.index
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

const canStartGovernmentEntityDocument = (gatewayAccountStripeProgress) => {
  return Object.entries(gatewayAccountStripeProgress)
    .every(([key, value]) => key === stripeDetailsTasks.governmentEntityDocument.name ? value !== true : value === true)
}

const getStripeTaskStatus = (task, complete, govEntityDocTaskUnavailable) => {
  return task === stripeDetailsTasks.governmentEntityDocument.name && govEntityDocTaskUnavailable
    ? TASK_STATUS.CANNOT_START // governmentEntityDocument can only be started once all other tasks are completed
    : complete
      ? TASK_STATUS.COMPLETED_CANNOT_START // stripe tasks cannot be started again once completed
      : TASK_STATUS.NOT_STARTED
}

/**
 * @typedef {Object} StripeTask
 * @property {string} linkText - formatted path for task
 * @property {string} href - formatted path for task
 * @property {boolean} complete - formatted path for task
 * @property {string} status - true, false or 'disabled' in the case of gov entity document (if any other tasks are 'false')
 */

/**
 * Transforms connectorGatewayAccountStripeProgress into 'render-able' stripe tasks
 * @param account {GatewayAccount}
 * @param service {GOVUKPayService}
 * @returns {[StripeTask]|[]}
 */
const friendlyStripeTasks = (account, service) => {
  if (account.connectorGatewayAccountStripeProgress) {
    const progress = orderTasks(account.connectorGatewayAccountStripeProgress)
    const govEntityDocTaskUnavailable = Object.entries(progress)
      .some(([task, completed]) => task !== stripeDetailsTasks.governmentEntityDocument.name && completed === false)

    return Object.entries(progress).reduce((acc, [task, complete]) => {
      const linkText = stripeDetailsTasks[task].friendlyName
      const href = formatSimplifiedAccountPathsFor(stripeDetailsTasks[task].path, service.externalId, account.type)
      acc.push({
        linkText,
        href,
        complete,
        status: getStripeTaskStatus(task, complete, govEntityDocTaskUnavailable)
      })
      return acc
    }, [])
  } else {
    logger.error(`Expected Stripe account progress for gateway account but none was found [gateway_account_id: ${account.id}]`)
    return []
  }
}

module.exports = {
  friendlyStripeTasks,
  stripeDetailsTasks,
  canStartGovernmentEntityDocument
}
