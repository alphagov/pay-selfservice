'use strict'

function validRetrieveStripeAccountDetails (opts = {}) {
  const stripeAccount = {
    object: 'account',
    business_profile: {
      mcc: '5734'
    },
    business_type: 'company',
    capabilities: {
      card_payments: 'active',
      transfers: 'active'
    },
    charges_enabled: opts.charges_enabled,
    company: {
      directors_provided: true,
      executives_provided: true,
      owners_provided: true,
      tax_id_provided: true,
      vat_id_provided: true
    },
    type: 'custom',
    requirements: {
      current_deadline: opts.current_deadline
    }
  }

  stripeAccount.id = opts.stripe_account_id

  if (opts.url) {
    stripeAccount.business_profile.url = opts.url
  }
  if (opts.entity_verified) {
    stripeAccount.company.verification = {
      document: {
        front: 'file_id_123'
      }
    }
  }

  return stripeAccount
}

function validListStripePersons (opts = {}) {
  const stripePersons = {
    object: 'list',
    has_more: false,
    data: [
      {
        id: 'person_1234',
        object: 'person',
        created: 1635794225,
        dob: {
          day: 1,
          month: 8,
          year: 1990
        },
        first_name: opts.firstName || null,
        last_name: opts.lastName || null,
        relationship: {
          owner: false,
          percent_ownership: null,
          title: null
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
    id: 'person_1234',
    object: 'person',
    created: 1635794225,
    dob: {
      day: 1,
      month: 8,
      year: 1990
    },
    first_name: null,
    last_name: null,
    relationship: {
      owner: false,
      percent_ownership: null,
      title: null
    }
  }

  stripePerson.relationship.director = opts.director
  stripePerson.relationship.representative = opts.representative
  stripePerson.relationship.executive = opts.representative
  stripePerson.phone = opts.phone
  stripePerson.email = opts.email

  return stripePerson
}

function validBankAccount (opts = {}) {
  const account = opts.stripeAccountId || 'acct_123abc546def789g'
  return {
    object: 'list',
    data: [
      {
        id: 'ba_1QMTkSQU1cEQrIlt78z7toKz',
        object: 'bank_account',
        account,
        account_holder_name: null,
        account_holder_type: 'company',
        account_type: null,
        available_payout_methods: [
          'standard',
          'instant'
        ],
        bank_name: 'STRIPE TEST BANK',
        country: 'GB',
        currency: 'gbp',
        default_for_currency: true,
        fingerprint: 'BAXNmx3AK8GN6SAN',
        future_requirements: {
          currently_due: [],
          errors: [],
          past_due: [],
          pending_verification: []
        },
        last4: '2345',
        metadata: {},
        requirements: {
          currently_due: [],
          errors: [],
          past_due: [],
          pending_verification: []
        },
        routing_number: '10-88-00',
        status: 'new'
      }
    ],
    has_more: false,
    url: `/v1/accounts/${account}/external_accounts`
  }
}

module.exports = {
  validRetrieveStripeAccountDetails,
  validListStripePersons,
  validStripePerson,
  validBankAccount
}
