'use strict'

const { expect } = require('chai')
const filters = require('./filters')

describe('filters', () => {
  describe('state filter', () => {
    describe('getFilter', () => {
      it('should transform In progress display states to connector states correctly', function () {
        const { result } = filters.getFilters({ query: { state: 'In progress' } })
        expect(result).to.have.property('selectedStates').to.deep.equal(['In progress'])
        expect(result)
          .to.have.property('payment_states')
          .to.deep.equal(['created', 'started', 'submitted', 'capturable'])
        expect(result).to.not.have.property('refund_states')
      })

      it('should transform some payment display states to connector states correctly', function () {
        const { result } = filters.getFilters({ query: { state: ['In progress', 'Timed out', 'Cancelled'] } })
        expect(result).to.have.property('selectedStates').to.deep.equal(['In progress', 'Timed out', 'Cancelled'])
        expect(result)
          .to.have.property('payment_states')
          .to.deep.equal(['created', 'started', 'submitted', 'capturable', 'timedout', 'cancelled'])
        expect(result).to.not.have.property('refund_states')
      })

      it('should transform all payment display states to connector states correctly', function () {
        const { result } = filters.getFilters({
          query: { state: ['In progress', 'Success', 'Error', 'Cancelled', 'Timed out', 'Declined'] },
        })
        expect(result)
          .to.have.property('selectedStates')
          .to.deep.equal(['In progress', 'Success', 'Error', 'Cancelled', 'Timed out', 'Declined'])
        expect(result)
          .to.have.property('payment_states')
          .to.deep.equal([
            'created',
            'started',
            'submitted',
            'capturable',
            'success',
            'error',
            'cancelled',
            'timedout',
            'declined',
          ])
        expect(result).to.not.have.property('refund_states')
      })

      it('should transform all refund display states to connector states correctly', function () {
        const { result } = filters.getFilters({
          query: { state: ['Refund success', 'Refund error', 'Refund submitted'] },
        })
        expect(result)
          .to.have.property('selectedStates')
          .to.deep.equal(['Refund success', 'Refund error', 'Refund submitted'])
        expect(result).to.have.property('refund_states').to.deep.equal(['success', 'error', 'submitted'])
        expect(result).to.not.have.property('payment_states')
      })

      it('should transform both payment and refund display states to connector states correctly', function () {
        const { result } = filters.getFilters({
          query: {
            state: [
              'In progress',
              'Success',
              'Error',
              'Cancelled',
              'Timed out',
              'Declined',
              'Refund success',
              'Refund error',
              'Refund submitted',
            ],
          },
        })
        expect(result)
          .to.have.property('selectedStates')
          .to.deep.equal([
            'In progress',
            'Success',
            'Error',
            'Cancelled',
            'Timed out',
            'Declined',
            'Refund success',
            'Refund error',
            'Refund submitted',
          ])
        expect(result).to.have.property('refund_states').to.deep.equal(['success', 'error', 'submitted'])
        expect(result)
          .to.have.property('payment_states')
          .to.deep.equal([
            'created',
            'started',
            'submitted',
            'capturable',
            'success',
            'error',
            'cancelled',
            'timedout',
            'declined',
          ])
      })

      it('should trim values from the query object', () => {
        const { result } = filters.getFilters({ query: { email: ' some-email@email.com ', reference: ' some-ref  ' } })
        expect(result.email).to.equal('some-email@email.com')
        expect(result.reference).to.equal('some-ref')
      })
      describe('date string sanitisation', () => {
        it('should not alter valid date strings', () => {
          const { result } = filters.getFilters({ query: { fromDate: '01/01/2026', toDate: '31/12/2026' } })
          expect(result.fromDate).to.equal('01/01/2026')
          expect(result.toDate).to.equal('31/12/2026')
        })

        it('should remove invalid dates from the query', () => {
          const { result } = filters.getFilters({ query: { fromDate: '00/00/0000', toDate: '32/13/9999' } })
          expect(result.fromDate).to.be.undefined
          expect(result.toDate).to.be.undefined
        })

        it('should remove dates with invalid characters from the query', () => {
          const { result } = filters.getFilters({ query: { fromDate: '01<01>2026', toDate: '31|12=2026' } })
          expect(result.fromDate).to.be.undefined
          expect(result.toDate).to.be.undefined
        })

        it('should remove dates with additional text', () => {
          const { result } = filters.getFilters({
            query: { fromDate: '01/01/2026 this is additional text', toDate: '31/12/2026 that should prevent parsing' },
          })
          expect(result.fromDate).to.be.undefined
          expect(result.toDate).to.be.undefined
        })
      })
    })

    describe('describeFilter', () => {
      it('should describe correctly when multiple states selected', function () {
        const testFilter = {
          fromDate: 'from-date',
          toDate: 'to-date',
          selectedStates: ['In progress', 'Refund success', 'Refund submitted'],
        }
        const result = filters.describeFilters(testFilter)
        expect(result.trim()).to.equal(
          'from <strong>from-date</strong> to <strong>to-date</strong> with <strong>In progress</strong>, <strong>Refund success</strong> or <strong>Refund submitted</strong> states'
        )
      })

      it('should describe correctly when one state selected', function () {
        const testFilter = {
          fromDate: 'from-date',
          toDate: 'to-date',
          selectedStates: ['Cancelled'],
        }
        const result = filters.describeFilters(testFilter)
        expect(result.trim()).to.equal(
          'from <strong>from-date</strong> to <strong>to-date</strong> with <strong>Cancelled</strong> state'
        )
      })

      it('should describe correctly when no state selected', function () {
        const testFilter = {
          fromDate: 'from-date',
          toDate: 'to-date',
          state: '',
        }
        const result = filters.describeFilters(testFilter)
        expect(result.trim()).to.equal('from <strong>from-date</strong> to <strong>to-date</strong>')
      })
    })

    describe('validateDateRange', () => {
      it('should validate the date range filter and return an array with the result and the associated from and to date', function () {
        const testFilter = {
          fromDate: '03/03/2023',
          toDate: '01/03/2023',
        }
        const result = filters.validateDateRange(testFilter)
        expect(result.isInvalidDateRange).to.equal(true)
        expect(result.fromDateParam).to.equal('03/03/2023')
        expect(result.toDateParam).to.equal('01/03/2023')
      })
    })
  })
})
