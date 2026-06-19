import { DateTime } from 'luxon'
import {
  Period,
  getPeriodUKDateTimeRange,
  dateRangeAsPeriod,
} from '@utils/simplified-account/services/dashboard/datetime-utils'
declare const $: JQueryStatic

import { TRANSACTION_SEARCH_DATE_FORMAT } from '@utils/time/time-formats'

function register() {
  document.getElementById('dateFilter')?.addEventListener('change', (event) => {
    if (!(event.target instanceof HTMLSelectElement)) {
      return
    }
    if (event.target.value === 'custom-range' || event.target.value === 'all-time') {
      clearDates()
      return
    }

    const dates = getPeriodUKDateTimeRange(event.target.value as Period)
    setFromDate(dates.start)
    setEndDate(dates.end)
  })

  $('.date-picker')
    .datepicker()
    .on('changeDate', (_) => {
      console.log('date changed')
      setDateFilter()
    })

  document.getElementById('include-time-checkbox')?.addEventListener('change', (event) => {
    if (!(event.target instanceof HTMLInputElement)) {
      return
    }

    if (event.target.checked) {
      showTimePicker()
    } else {
      hideTimePicker()
    }
  })
  ;(document.getElementById('js-enabled') as HTMLInputElement).value = 'true'
}

function setDateFilter() {
  console.log('changed')
  const fromDate = (document.getElementById('fromDate') as HTMLInputElement).value
  const toDate = (document.getElementById('toDate') as HTMLInputElement).value

  const period = dateRangeAsPeriod(fromDate, toDate, TRANSACTION_SEARCH_DATE_FORMAT)
  console.log(period)
  ;(document.getElementById('dateFilter') as HTMLInputElement).value = period ?? 'custom-range'
}

function showTimePicker() {
  document.getElementById('time-picker')!.hidden = false
}

function hideTimePicker() {
  document.getElementById('time-picker')!.hidden = true
}

function clearDates() {
  ;(document.getElementById('fromDate') as HTMLInputElement).value = ''
  ;(document.getElementById('toDate') as HTMLInputElement).value = ''
}

function setFromDate(date: DateTime | undefined) {
  if (date) {
    ;(document.getElementById('fromDate') as HTMLInputElement).value = date.toFormat(TRANSACTION_SEARCH_DATE_FORMAT)
  }
}

function setEndDate(date: DateTime | undefined) {
  if (date) {
    ;(document.getElementById('toDate') as HTMLInputElement).value = date.toFormat(TRANSACTION_SEARCH_DATE_FORMAT)
  }
}

export default function inject() {
  document.addEventListener('DOMContentLoaded', register)
}
