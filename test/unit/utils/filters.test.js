'use strict'

const filters = require('../../../app/utils/filters')

describe('filters', () => {
  describe('state filter', () => {
    describe('getFilter', () => {
      it(
        'should transform In progress display states to connector states correctly',
        () => {
          const { result } = filters.getFilters({ query: { state: 'In progress' } })
          expect(result).to.have.property('selectedStates').toEqual(['In progress'])
          expect(result).to.have.property('payment_states').toEqual(['created', 'started', 'submitted', 'capturable'])
          expect(result).not.toHaveProperty('refund_states')
        }
      )

      it(
        'should transform some payment display states to connector states correctly',
        () => {
          const { result } = filters.getFilters({ query: { state: ['In progress', 'Timed out', 'Cancelled'] } })
          expect(result).to.have.property('selectedStates').toEqual(['In progress', 'Timed out', 'Cancelled'])
          expect(result).to.have.property('payment_states').toEqual(['created', 'started', 'submitted', 'capturable', 'timedout', 'cancelled'])
          expect(result).not.toHaveProperty('refund_states')
        }
      )

      it(
        'should transform all payment display states to connector states correctly',
        () => {
          const { result } = filters.getFilters({ query: { state: ['In progress', 'Success', 'Error', 'Cancelled', 'Timed out', 'Declined'] } })
          expect(result).to.have.property('selectedStates').toEqual(['In progress', 'Success', 'Error', 'Cancelled', 'Timed out', 'Declined'])
          expect(result).to.have.property('payment_states').toEqual(
            ['created', 'started', 'submitted', 'capturable', 'success', 'error', 'cancelled', 'timedout', 'declined']
          )
          expect(result).not.toHaveProperty('refund_states')
        }
      )

      it(
        'should transform all refund display states to connector states correctly',
        () => {
          const { result } = filters.getFilters({ query: { state: ['Refund success', 'Refund error', 'Refund submitted'] } })
          expect(result).to.have.property('selectedStates').toEqual(['Refund success', 'Refund error', 'Refund submitted'])
          expect(result).to.have.property('refund_states').toEqual(['success', 'error', 'submitted'])
          expect(result).not.toHaveProperty('payment_states')
        }
      )

      it(
        'should transform both payment and refund display states to connector states correctly',
        () => {
          const { result } = filters.getFilters({ query: { state: ['In progress', 'Success', 'Error', 'Cancelled', 'Timed out', 'Declined', 'Refund success', 'Refund error', 'Refund submitted'] } })
          expect(result).to.have.property('selectedStates').toEqual(
            ['In progress', 'Success', 'Error', 'Cancelled', 'Timed out', 'Declined', 'Refund success', 'Refund error', 'Refund submitted']
          )
          expect(result).to.have.property('refund_states').toEqual(['success', 'error', 'submitted'])
          expect(result).to.have.property('payment_states').toEqual(
            ['created', 'started', 'submitted', 'capturable', 'success', 'error', 'cancelled', 'timedout', 'declined']
          )
        }
      )
    })

    describe('describeFilter', () => {
      it('should describe correctly when multiple states selected', () => {
        const testFilter = {
          fromDate: 'from-date',
          toDate: 'to-date',
          selectedStates: ['In progress', 'Refund success', 'Refund submitted']
        }
        const result = filters.describeFilters(testFilter)
        expect(result.trim()).toBe(
          'from <strong>from-date</strong> to <strong>to-date</strong> with <strong>In progress</strong>, <strong>Refund success</strong> or <strong>Refund submitted</strong> states'
        )
      })

      it('should describe correctly when one state selected', () => {
        const testFilter = {
          fromDate: 'from-date',
          toDate: 'to-date',
          selectedStates: ['Cancelled']
        }
        const result = filters.describeFilters(testFilter)
        expect(result.trim()).toBe(
          'from <strong>from-date</strong> to <strong>to-date</strong> with <strong>Cancelled</strong> state'
        )
      })

      it('should describe correctly when no state selected', () => {
        const testFilter = {
          fromDate: 'from-date',
          toDate: 'to-date',
          state: ''
        }
        const result = filters.describeFilters(testFilter)
        expect(result.trim()).toBe('from <strong>from-date</strong> to <strong>to-date</strong>')
      })
    })
  })
})
