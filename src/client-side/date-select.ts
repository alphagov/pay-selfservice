import { DateTime } from 'luxon'
import {
  Period,
  getPeriodUKDateTimeRange,
  dateRangeAsPeriod,
} from '@utils/simplified-account/services/dashboard/datetime-utils'
declare const $: JQueryStatic | undefined

import { TRANSACTION_SEARCH_DATE_FORMAT } from '@utils/time/time-formats'
import awaitJQuery from '@utils/client-side/await-jquery'

function register() {
  setJsEnabled()
  bindDateFilterChangeListener()
  bindIncludeTimeCheckboxListener()

  awaitJQuery(() => {
    bindDatePickerChangeListener()
  })
}

function bindDateFilterChangeListener() {
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
}

function bindIncludeTimeCheckboxListener() {
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
}

function setJsEnabled() {
  const jsEnabledHiddenInput = document.getElementById('js-enabled')
  if (jsEnabledHiddenInput instanceof HTMLInputElement) {
    jsEnabledHiddenInput.value = 'true'
  }
}

function setDateFilter() {
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

function bindDatePickerChangeListener() {
  if (Object.hasOwn(window, '$') && $) {
    $('.date-picker')
      .datepicker()
      .on('changeDate', (_) => {
        console.log('date changed')
        setDateFilter()
      })
  }
}

export default function inject() {
  document.addEventListener('DOMContentLoaded', register)
}
