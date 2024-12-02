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
      expect(cards.debitCards[0].text).to.equal('Visa debit')
      expect(cards.debitCards[0].checked).to.be.true // eslint-disable-line no-unused-expressions
      expect(cards.debitCards[1].text).to.equal('Mastercard debit')
      expect(cards.debitCards[1].checked).to.be.true // eslint-disable-line no-unused-expressions
      expect(cards.debitCards[2].text).to.equal('Maestro')
      expect(cards.debitCards[2].checked).to.be.true // eslint-disable-line no-unused-expressions
      expect(cards).to.have.property('creditCards').to.have.length(3)
      expect(cards.creditCards[0].text).to.equal('Visa credit')
      expect(cards.creditCards[0].checked).to.be.true // eslint-disable-line no-unused-expressions
      expect(cards.creditCards[1].text).to.equal('American Express')
      expect(cards.creditCards[1].checked).to.be.true // eslint-disable-line no-unused-expressions
      expect(cards.creditCards[2].text).to.equal('JCB')
      expect(cards.creditCards[2].checked).to.be.true // eslint-disable-line no-unused-expressions
    })

    it('should return unchecked boxes for not accepted card types', () => {
      const acceptedCards = [...allCards].filter(card => card.id !== 'id-001' && card.id !== 'id-002')
      const account = { requires3ds: true }
      const cards = formatCardTypesForTemplate(allCards, acceptedCards, account, true)
      expect(cards).to.have.property('debitCards').to.have.length(3)
      expect(cards.debitCards.filter(card => card.text === 'Visa debit')[0].checked).to.be.false // eslint-disable-line no-unused-expressions
      expect(cards.debitCards.filter(card => card.text === 'Mastercard debit')[0].checked).to.be.true // eslint-disable-line no-unused-expressions
      expect(cards.debitCards.filter(card => card.text === 'Maestro')[0].checked).to.be.true // eslint-disable-line no-unused-expressions
      expect(cards).to.have.property('creditCards').to.have.length(3)
      expect(cards.debitCards.filter(card => card.text === 'Visa credit')[0].checked).to.be.false // eslint-disable-line no-unused-expressions
      expect(cards.debitCards.filter(card => card.text === 'American Express')[0].checked).to.be.true // eslint-disable-line no-unused-expressions
      expect(cards.debitCards.filter(card => card.text === 'JCB')[0].checked).to.be.true // eslint-disable-line no-unused-expressions
    })

    it('should set checkbox to disabled for requires3ds card types if 3ds not enabled on account', () => {
      const acceptedCards = [...allCards]
      const account = { requires3ds: false }
      const cards = formatCardTypesForTemplate(allCards, acceptedCards, account, true)
      expect(cards.debitCards.filter(card => card.text === 'Maestro')[0]).to.have.property('disabled').to.be.true // eslint-disable-line no-unused-expressions
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
      expect(cards['Enabled debit cards']).to.have.length(2).to.deep.equal(['Mastercard debit', 'Maestro'])
      expect(cards['Not enabled debit cards']).to.have.length(1).to.deep.equal(['Visa debit'])
      expect(cards['Enabled credit cards']).to.have.length(2).to.deep.equal(['American Express', 'JCB'])
      expect(cards['Not enabled credit cards']).to.have.length(1).to.deep.equal(['Visa credit'])
    })
  })
})
