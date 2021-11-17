'use strict'

function validRetrieveStripeAccountDetails (opts = {}) {
  const stripeAccount = {
    'object': 'account',
    'business_profile': {
      'mcc': '5734'
    },
    'business_type': 'company',
    'capabilities': {
      'card_payments': 'active',
      'transfers': 'active'
    },
    'charges_enabled': true,
    'company': {
      'directors_provided': true,
      'executives_provided': true,
      'owners_provided': true,
      'tax_id_provided': true,
      'vat_id_provided': true
    },
    'type': 'custom'
  }

  stripeAccount.id = opts.stripe_account_id

  if (opts.url) {
    stripeAccount.business_profile.url = opts.url
  }

  return stripeAccount
}

function validListStripePersons (opts = {}) {
  const stripePersons = {
    'object': 'list',
    'has_more': false,
    'data': [
      {
        'id': 'person_1234',
        'object': 'person',
        'created': 1635794225,
        'dob': {
          'day': 1,
          'month': 8,
          'year': 1990
        },
        'first_name': opts.firstName || null,
        'last_name': opts.lastName || null,
        'relationship': {
          'owner': false,
          'percent_ownership': null,
          'title': null
        }
      }
    ]
  }

  stripePersons.url = `/v1/accounts/${opts.stripe_account_id}/persons`
  stripePersons.data[0].relationship.director = opts.director
  stripePersons.data[0].relationship.representative = opts.representative
  stripePersons.data[0].relationship.executive = opts.representative
  stripePersons.data[0].phone = opts.phone
  stripePersons.data[0].email = opts.email

  return stripePersons
}

function validStripePerson (opts = {}) {
  const stripePerson = {
    'id': 'person_1234',
    'object': 'person',
    'created': 1635794225,
    'dob': {
      'day': 1,
      'month': 8,
      'year': 1990
    },
    'first_name': null,
    'last_name': null,
    'relationship': {
      'owner': false,
      'percent_ownership': null,
      'title': null
    }
  }

  stripePerson.relationship.director = opts.director
  stripePerson.relationship.representative = opts.representative
  stripePerson.relationship.executive = opts.representative
  stripePerson.phone = opts.phone
  stripePerson.email = opts.email

  return stripePerson
}

module.exports = {
  validRetrieveStripeAccountDetails,
  validListStripePersons,
  validStripePerson
}
