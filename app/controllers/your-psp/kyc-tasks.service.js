'use strict'

const { listPersons, retrieveAccountDetails } = require('../../services/clients/stripe/stripe.client')
const lodash = require('lodash')

async function isOrganisationUrlComplete (stripeAccountId) {
  const account = await retrieveAccountDetails(stripeAccountId)
  const url = lodash.get(account, 'business_profile.url')

  return isNotEmpty(url)
}

function isStripeResponsiblePersonComplete (persons, relationship) {
  const person = getPerson(persons, 'representative').pop()

  if (person) {
    return isNotEmpty(person.phone) && isNotEmpty(person.email)
  }

  return false
}

function isNotEmpty (value) {
  return !(value === undefined || value === null) && value.length > 0
}

function getPerson (persons, relationship) {
  const data = lodash.get(persons, 'data')
  return data !== undefined ? data.filter(person => person.relationship[relationship] === true) : []
}

async function getTaskList (activeCredential) {
  const stripeAccountId = lodash.get(activeCredential, 'credentials.stripe_account_id')
  const stripePersons = await listPersons(stripeAccountId)

  return {
    'ENTER_ORGANISATION_URL': {
      complete: await isOrganisationUrlComplete(stripeAccountId)
    },
    'UPDATE_RESPONSIBLE_PERSON': {
      complete: isStripeResponsiblePersonComplete(stripePersons)
    },
    'ENTER_DIRECTOR': {
      complete: getPerson(stripePersons, 'director').length > 0
    }
  }
}

function isComplete (taskList) {
  return Object.values(taskList).every(task => task.complete)
}

module.exports = {
  getTaskList: getTaskList,
  isComplete: isComplete
}
