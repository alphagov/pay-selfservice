import { expect } from 'chai'
import { describe, it, beforeEach, afterEach } from 'mocha'
import sinon from 'sinon'
import {
  dateToDefaultFormat,
  fromDateToApiFormat,
  toDateToApiFormat,
  utcToDisplay,
  utcToDate,
  utcToTime,
  isBritishSummerTime,
} from '../simplified-account/dates'

describe('dates utils tests', () => {
  let clock: sinon.SinonFakeTimers

  beforeEach(() => {
    clock = sinon.useFakeTimers(new Date())
  })

  afterEach(() => {
    clock.restore()
  })

  it('dateToDefaultFormat formats ISO string and Date object', () => {
    const iso = '2025-12-31T23:00:00Z'
    expect(dateToDefaultFormat(iso)).to.equal('2025-12-31 23:00:00')
    expect(dateToDefaultFormat(new Date('2025-12-31T23:00:00Z'))).to.equal('2025-12-31 23:00:00')
  })

  it('dateToDefaultFormat returns \\`Invalid date\\` for invalid input', () => {
    expect(dateToDefaultFormat('not-a-date')).to.equal('Invalid date')
  })

  it('utcToDisplay / utcToDate / utcToTime format correctly', () => {
    const utc = '2025-01-02T08:09:10Z'
    expect(utcToDisplay(utc)).to.equal('02 Jan 2025 — 08:09:10')
    expect(utcToDate(utc)).to.equal('02 Jan 2025')
    expect(utcToTime(utc)).to.equal('08:09:10')
  })

  it('fromDateToApiFormat returns ISO when date and time provided', () => {
    const iso = fromDateToApiFormat('1/1/2025', '00:00:00')
    expect(iso).to.equal('2025-01-01T00:00:00.000Z')
  })

  it('fromDateToApiFormat returns empty string when date missing', () => {
    expect(fromDateToApiFormat(undefined, '00:00:00')).to.equal('')
  })

  it('fromDateToApiFormat with missing time sets time to 00:00:00', () => {
    console.log(fromDateToApiFormat('1/1/2025'))
    expect(fromDateToApiFormat('1/1/2025')).to.equal('2025-01-01T00:00:00.000Z')
  })

  it('toDateToApiFormat adds one second and uses MAX_TIME when time omitted', () => {
    expect(toDateToApiFormat('1/1/2025', '12:34:56')).to.equal('2025-01-01T12:34:57.000Z')
    expect(toDateToApiFormat('1/1/2025')).to.equal('2025-01-02T00:00:00.000Z')
  })

  it('isBritishSummerTime returns true during BST and false outside BST', () => {
    clock.setSystemTime(new Date('2025-07-01T12:00:00Z'))
    expect(isBritishSummerTime()).to.be.true

    clock.setSystemTime(new Date('2025-01-01T12:00:00Z'))
    expect(isBritishSummerTime()).to.be.false
  })

  it('fromDateToApiFormat returns null for impossible date', () => {
    expect(fromDateToApiFormat('32/13/2025', '00:00:00')).to.be.null
  })
})
