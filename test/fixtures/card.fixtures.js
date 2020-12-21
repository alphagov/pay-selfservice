'use strict'

module.exports = {
  validCardTypesResponse: () => {
    return {
      card_types: [{
        id: 'a1200c73-204d-45f5-8fca-e4ee5ed1b1a7',
        brand: 'visa',
        label: 'Visa',
        type: 'DEBIT',
        requires3ds: false
      }, {
        id: 'd03f5008-f793-4ea5-8a23-87f40ceb6c81',
        brand: 'visa',
        label: 'Visa',
        type: 'CREDIT',
        requires3ds: false
      }, {
        id: '491df314-fcb1-428f-9ea8-320865cf2a29',
        brand: 'master-card',
        label: 'Mastercard',
        type: 'DEBIT',
        requires3ds: false
      }, {
        id: '667cad4d-8ef9-418b-8023-5c8922f82d7a',
        brand: 'master-card',
        label: 'Mastercard',
        type: 'CREDIT',
        requires3ds: false
      }, {
        id: 'fff66fd7-e1d6-4c65-846d-9199c906e368',
        brand: 'american-express',
        label: 'American Express',
        type: 'CREDIT',
        requires3ds: false
      }, {
        id: '2d5462a8-fb95-4a5a-b991-3891e40312f3',
        brand: 'diners-club',
        label: 'Diners Club',
        type: 'CREDIT',
        requires3ds: false
      }, {
        id: '29b87115-9b09-419e-a593-d9f1f5375dbd',
        brand: 'discover',
        label: 'Discover',
        type: 'CREDIT',
        requires3ds: false
      }, {
        id: 'ca5ba07b-aa4b-4294-8fd0-8354fc383e28',
        brand: 'jcb',
        label: 'Jcb',
        type: 'CREDIT',
        requires3ds: false
      }, {
        id: '09edd87d-d4cb-4fdd-a03c-40c5e3dc08dc',
        brand: 'unionpay',
        label: 'Union Pay',
        type: 'CREDIT',
        requires3ds: false
      }, {
        id: '778e32ef-5314-4a42-897d-d06986bc9465',
        brand: 'maestro',
        label: 'Maestro',
        type: 'DEBIT',
        requires3ds: true
      }]
    }
  },
  validAcceptedCardTypesResponse: opts => {
    let data = {
      card_types: [{
        id: 'a1200c73-204d-45f5-8fca-e4ee5ed1b1a7',
        brand: 'visa',
        label: 'Visa',
        type: 'DEBIT',
        requires3ds: false
      }, {
        id: 'd03f5008-f793-4ea5-8a23-87f40ceb6c81',
        brand: 'visa',
        label: 'Visa',
        type: 'CREDIT',
        requires3ds: false
      }, {
        id: '491df314-fcb1-428f-9ea8-320865cf2a29',
        brand: 'master-card',
        label: 'Mastercard',
        type: 'DEBIT',
        requires3ds: false
      }, {
        id: '667cad4d-8ef9-418b-8023-5c8922f82d7a',
        brand: 'master-card',
        label: 'Mastercard',
        type: 'CREDIT',
        requires3ds: false
      }, {
        id: 'fff66fd7-e1d6-4c65-846d-9199c906e368',
        brand: 'american-express',
        label: 'American Express',
        type: 'CREDIT',
        requires3ds: false
      }]
    }

    if (opts.maestro) {
      data.card_types.push({
        id: '778e32ef-5314-4a42-897d-d06986bc9465',
        brand: 'maestro',
        label: 'Maestro',
        type: 'DEBIT',
        requires3ds: true
      })
    }

    return data
  },
  validUpdatedAcceptedCardTypesResponse: () => {
    return {
      card_types: [{
        id: 'a1200c73-204d-45f5-8fca-e4ee5ed1b1a7',
        brand: 'visa',
        label: 'Visa',
        type: 'DEBIT',
        requires3ds: false
      }, {
        id: 'd03f5008-f793-4ea5-8a23-87f40ceb6c81',
        brand: 'visa',
        label: 'Visa',
        type: 'CREDIT',
        requires3ds: false
      }, {
        id: '491df314-fcb1-428f-9ea8-320865cf2a29',
        brand: 'master-card',
        label: 'Mastercard',
        type: 'DEBIT',
        requires3ds: false
      }, {
        id: '667cad4d-8ef9-418b-8023-5c8922f82d7a',
        brand: 'master-card',
        label: 'Mastercard',
        type: 'CREDIT',
        requires3ds: false
      }, {
        id: 'fff66fd7-e1d6-4c65-846d-9199c906e368',
        brand: 'american-express',
        label: 'American Express',
        type: 'CREDIT',
        requires3ds: false
      }, {
        id: '2d5462a8-fb95-4a5a-b991-3891e40312f3',
        brand: 'diners-club',
        label: 'Diners Club',
        type: 'CREDIT',
        requires3ds: false
      }]
    }
  }
}
