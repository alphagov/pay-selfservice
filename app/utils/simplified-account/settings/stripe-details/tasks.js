const formatSimplifiedAccountPathsFor = require('../../format/format-simplified-account-paths-for')
const paths = require('../../../../paths')

const stripeDetailsTasks = Object.freeze({
  bankAccount: { name: 'bankAccount', friendlyName: 'Organisation\'s bank details', path: paths.simplifiedAccount.settings.stripeDetails.bankAccount },
  responsiblePerson: { name: 'responsiblePerson', friendlyName: 'Responsible person', path: paths.simplifiedAccount.settings.stripeDetails.responsiblePerson },
  director: { name: 'director', friendlyName: 'Service director', path: paths.simplifiedAccount.settings.stripeDetails.director },
  vatNumber: { name: 'vatNumber', friendlyName: 'VAT registration number', path: paths.simplifiedAccount.settings.stripeDetails.vatNumber },
  companyNumber: { name: 'companyNumber', friendlyName: 'Company registration number', path: paths.simplifiedAccount.settings.stripeDetails.companyNumber },
  organisationDetails: { name: 'organisationDetails', friendlyName: 'Confirm your organisation\'s name and address match your government entity document', path: paths.simplifiedAccount.settings.stripeDetails.organisationDetails },
  governmentEntityDocument: { name: 'governmentEntityDocument', friendlyName: 'Government entity document', path: paths.simplifiedAccount.settings.stripeDetails.governmentEntityDocument }
})

const orderTasks = (target) => {
  const orderedTasks = {}
  Object.keys(stripeDetailsTasks).forEach(key => {
    if (key in target) {
      orderedTasks[key] = target[key]
    }
  })
  // Add any remaining keys that aren't in stripeDetailsTasks (if we ever add more tasks in the future)
  Object.keys(target).forEach(key => {
    if (!(key in orderedTasks)) {
      orderedTasks[key] = target[key]
    }
  })
  return orderedTasks
}

/**
 * Transforms connectorGatewayAccountStripeProgress into 'render-able' stripe details tasks
 * @param account
 * @param service
 * @returns {Object.<string, {href: string, status: boolean|string, id: string}>} Transformed object where:
 *  - Keys are friendlyNames from stripeDetailsTasks
 *  - Values are objects containing:
 *    - href: formatted path for task
 *    - complete: true, false or 'disabled' in the case of gov entity document (if any other tasks are 'false')
 *    - id: Kebab-case version of human-readable key for use in the HTML
 */
const friendlyStripeTasks = (account, service) => {
  const progress = orderTasks(account.connectorGatewayAccountStripeProgress)

  const govEntityDocTaskUnavailable = Object.entries(progress)
    .some(([task, completed]) => task !== stripeDetailsTasks.governmentEntityDocument.name && completed === false)

  return Object.entries(progress).reduce((acc, [task, completed]) => {
    const humanReadable = stripeDetailsTasks[task].friendlyName || task
    const status = task === stripeDetailsTasks.governmentEntityDocument.name && govEntityDocTaskUnavailable ? 'disabled' : completed
    const href = formatSimplifiedAccountPathsFor(stripeDetailsTasks[task].path, service.externalId, account.type)
    acc[humanReadable] = {
      href,
      status,
      id: humanReadable.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    }
    return acc
  }, {})
}

module.exports = friendlyStripeTasks
