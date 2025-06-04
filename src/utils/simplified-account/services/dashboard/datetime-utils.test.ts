import { expect } from 'chai'
import { describe, it, beforeEach, afterEach } from 'mocha'
import sinon from 'sinon'
import { DateTime } from 'luxon'
import { getPeriodUKDateTimeRange, Period, DT_FULL } from './datetime-utils'

describe('DateTime Utility', () => {
  let clock: sinon.SinonFakeTimers

  beforeEach(() => {
    // January 15, 2025, 14:30:00 UTC as fixed "now"
    const fixedDate = new Date('2025-01-15T14:30:00.000Z')
    clock = sinon.useFakeTimers(fixedDate)
  })

  afterEach(() => {
    clock.restore()
  })

  describe('DT_FULL constant', () => {
    it('should have correct datetime format options set', () => {
      expect(DT_FULL).to.deep.equal({
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: undefined,
        timeZoneName: 'short',
        hour12: true
      })
    })
  })

  describe('getPeriodUKDateTimeRange', () => {
    describe('when period is "today"', () => {
      it('should return range from start of today to current time', () => {
        const result = getPeriodUKDateTimeRange('today')

        const expectedStart = DateTime.fromISO('2025-01-15T00:00:00.000', { zone: 'Europe/London' })
        const expectedEnd = DateTime.fromISO('2025-01-15T14:30:00.000', { zone: 'Europe/London' })

        expect(result.start.toISO()).to.equal(expectedStart.toISO())
        expect(result.end.toISO()).to.equal(expectedEnd.toISO())
      })

      it('should use UK locale and London timezone', () => {
        const result = getPeriodUKDateTimeRange('today')

        expect(result.start.locale).to.equal('en-GB')
        expect(result.start.zoneName).to.equal('Europe/London')
        expect(result.end.locale).to.equal('en-GB')
        expect(result.end.zoneName).to.equal('Europe/London')
      })
    })

    describe('when period is "yesterday"', () => {
      it('should return range for entire previous day', () => {
        const result = getPeriodUKDateTimeRange('yesterday')

        const expectedStart = DateTime.fromISO('2025-01-14T00:00:00.000', { zone: 'Europe/London' })
        const expectedEnd = DateTime.fromISO('2025-01-14T23:59:59.999', { zone: 'Europe/London' })

        expect(result.start.toISO()).to.equal(expectedStart.toISO())
        expect(result.end.toISO()).to.equal(expectedEnd.toISO())
      })
    })

    describe('when period is "previous-seven-days"', () => {
      it('should return range for 7 days ending yesterday', () => {
        const result = getPeriodUKDateTimeRange('previous-seven-days')

        const expectedStart = DateTime.fromISO('2025-01-08T00:00:00.000', { zone: 'Europe/London' })
        const expectedEnd = DateTime.fromISO('2025-01-14T23:59:59.999', { zone: 'Europe/London' })

        expect(result.start.toISO()).to.equal(expectedStart.toISO())
        expect(result.end.toISO()).to.equal(expectedEnd.toISO())
      })

      it('should span exactly 7 days', () => {
        const result = getPeriodUKDateTimeRange('previous-seven-days')
        const daysDiff = result.end.diff(result.start, 'days').days

        expect(Math.floor(daysDiff)).to.equal(6)
        expect(daysDiff).to.be.greaterThan(6.9)
      })
    })

    describe('when period is "previous-thirty-days"', () => {
      it('should return range for 30 days ending yesterday', () => {
        const result = getPeriodUKDateTimeRange('previous-thirty-days')

        const expectedStart = DateTime.fromISO('2024-12-16T00:00:00.000', { zone: 'Europe/London' })
        const expectedEnd = DateTime.fromISO('2025-01-14T23:59:59.999', { zone: 'Europe/London' })

        expect(result.start.toISO()).to.equal(expectedStart.toISO())
        expect(result.end.toISO()).to.equal(expectedEnd.toISO())
      })

      it('should span exactly 30 days', () => {
        const result = getPeriodUKDateTimeRange('previous-thirty-days')
        const daysDiff = result.end.diff(result.start, 'days').days

        expect(Math.floor(daysDiff)).to.equal(29)
        expect(daysDiff).to.be.greaterThan(29.9)
      })
    })

    describe('edge cases', () => {
      it('should handle leap year correctly for period', () => {
        clock.restore()
        // Set date to March 1st in a leap year
        clock = sinon.useFakeTimers(new Date('2024-03-07T12:00:00.000Z'))

        const result = getPeriodUKDateTimeRange('previous-seven-days')

        const expectedStart = DateTime.fromISO('2024-02-29T00:00:00.000', { zone: 'Europe/London' })

        expect(result.start.toISO()).to.equal(expectedStart.toISO())
      })

      it('should handle daylight saving time transitions', () => {
        clock.restore()
        clock = sinon.useFakeTimers(new Date('2024-04-02T12:00:00.000Z'))

        const result = getPeriodUKDateTimeRange('previous-seven-days')

        expect(result.start.offset).to.equal(0)
        expect(result.end.offset).to.equal(60)
      })
    })

    describe('return structure', () => {
      it('should be object with start and end properties', () => {
        const result = getPeriodUKDateTimeRange('today')

        expect(result).to.have.property('start')
        expect(result).to.have.property('end')
        expect(result.start).to.be.instanceOf(DateTime)
        expect(result.end).to.be.instanceOf(DateTime)
      })

      it('should ensure start is always before or equal to end', () => {
        const periods: Period[] = ['today', 'yesterday', 'previous-seven-days', 'previous-thirty-days']

        periods.forEach(period => {
          const result = getPeriodUKDateTimeRange(period)
          expect(result.start.toMillis()).to.be.lessThan(result.end.toMillis())
        })
      })
    })

    describe('consistency across multiple calls', () => {
      it('should return identical results for same period when called multiple times', () => {
        const result1 = getPeriodUKDateTimeRange('previous-seven-days')
        const result2 = getPeriodUKDateTimeRange('previous-seven-days')

        expect(result1.start.toMillis()).to.equal(result2.start.toMillis())
        expect(result1.end.toMillis()).to.equal(result2.end.toMillis())
      })
    })
  })
})
