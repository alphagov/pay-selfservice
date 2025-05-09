const { expect } = require('chai')
const { formatCardTypesForTemplate } = require('@utils/simplified-account/format/format-card-types')

const allCards = [
  {
    id: 'id-001',
    brand: 'visa',
    label: 'Visa',
    type: 'DEBIT',
    requires3ds: false
  },
  {
    id: 'id-002',
    brand: 'visa',
    label: 'Visa',
    type: 'CREDIT',
    requires3ds: false
  },
  {
    id: 'id-003',
    brand: 'master-card',
    label: 'Mastercard',
    type: 'DEBIT',
    requires3ds: false
  },
  {
    id: 'id-004',
    brand: 'american-express',
    label: 'American Express',
    type: 'CREDIT',
    requires3ds: false
  },
  {
    id: 'id-005',
    brand: 'jcb',
    label: 'Jcb',
    type: 'CREDIT',
    requires3ds: false
  },
  {
    id: 'id-006',
    brand: 'maestro',
    label: 'Maestro',
    type: 'DEBIT',
    requires3ds: true
  }
]
describe('format-card-types for template', () => {
  describe('present checkboxes for admin user', () => {
    it('should return all card types with checked boxes if they are all accepted', () => {
      const acceptedCards = [...allCards]
      const account = { requires3ds: true }
      const cards = formatCardTypesForTemplate(allCards, acceptedCards, account, true)
      expect(cards).to.have.property('debitCards').to.have.length(3)
      expect(cards.debitCards[0]).to.deep.include({ text: 'Visa debit', checked: true })
      expect(cards.debitCards[1]).to.deep.include({ text: 'Mastercard debit', checked: true })
      expect(cards.debitCards[2]).to.deep.include({ text: 'Maestro', checked: true })
      expect(cards).to.have.property('creditCards').to.have.length(3)
      expect(cards.creditCards[0]).to.deep.include({ text: 'Visa credit', checked: true })
      expect(cards.creditCards[1]).to.deep.include({ text: 'American Express', checked: true })
      expect(cards.creditCards[2]).to.deep.include({ text: 'JCB', checked: true })
    })

    it('should return unchecked boxes for not accepted card types', () => {
      const acceptedCards = [...allCards].filter(card => card.id !== 'id-001' && card.id !== 'id-002')
      const account = { requires3ds: true }
      const cards = formatCardTypesForTemplate(allCards, acceptedCards, account, true)
      expect(cards).to.have.property('debitCards').to.have.length(3)
      expect(cards.debitCards[0]).to.deep.include({ text: 'Visa debit', checked: false })
      expect(cards.debitCards[1]).to.deep.include({ text: 'Mastercard debit', checked: true })
      expect(cards.debitCards[2]).to.deep.include({ text: 'Maestro', checked: true })
      expect(cards).to.have.property('creditCards').to.have.length(3)
      expect(cards.creditCards[0]).to.deep.include({ text: 'Visa credit', checked: false })
      expect(cards.creditCards[1]).to.deep.include({ text: 'American Express', checked: true })
      expect(cards.creditCards[2]).to.deep.include({ text: 'JCB', checked: true })
    })

    it('should set checkbox to disabled for requires3ds card types if 3ds not enabled for sandbox account', () => {
      const acceptedCards = [...allCards]
      const account = { requires3ds: false, type: 'test', paymentProvider: 'sandbox' }
      const cards = formatCardTypesForTemplate(allCards, acceptedCards, account, true)
      expect(cards.debitCards.filter(card => card.text === 'Maestro')[0]).to.have.property('disabled').to.be.true
      expect(cards.debitCards.filter(card => card.text === 'Maestro')[0]).to.have.property('hint')
        .to.deep.equal({ html: 'Maestro is not available on sandbox test accounts' })
    })

    it('should set checkbox to disabled for requires3ds card types if 3ds not enabled for live account', () => {
      const acceptedCards = [...allCards]
      const account = { requires3ds: false, type: 'live' }
      const cards = formatCardTypesForTemplate(allCards, acceptedCards, account, true)
      expect(cards.debitCards.filter(card => card.text === 'Maestro')[0]).to.have.property('disabled').to.be.true
      expect(cards.debitCards.filter(card => card.text === 'Maestro')[0]).to.have.property('hint')
        .to.deep.equal({ html: 'Maestro cannot be used because 3D Secure is switched off for this service' })
    })

    it('should add hint to American Express if payment provider is Worldpay and account is live', () => {
      const acceptedCards = [...allCards]
      const account = { requires3ds: true, paymentProvider: 'worldpay', type: 'live' }
      const cards = formatCardTypesForTemplate(allCards, acceptedCards, account, true)
      expect(cards.creditCards.filter(card => card.text === 'American Express')[0])
        .to.have.property('hint').to.deep.equal({ html: 'You must have already enabled this with Worldpay' })
    })
  })

  describe('present read-only list for non-admin user', () => {
    it('should return all card types arranged by type and whether accepted or not', () => {
      const acceptedCards = [...allCards].filter(card => card.id !== 'id-001' && card.id !== 'id-002')
      const account = { requires3ds: true }
      const cards = formatCardTypesForTemplate(allCards, acceptedCards, account, false)
      expect(cards['debit/enabled']).to.deep.equal({ cards: ['Mastercard debit', 'Maestro'], heading: 'Enabled debit cards' })
      expect(cards['debit/disabled']).to.deep.equal({ cards: ['Visa debit'], heading: 'Not enabled debit cards' })
      expect(cards['credit/enabled']).to.deep.equal({ cards: ['American Express', 'JCB'], heading: 'Enabled credit cards' })
      expect(cards['credit/disabled']).to.deep.equal({ cards: ['Visa credit'], heading: 'Not enabled credit cards' })
    })
  })
})
