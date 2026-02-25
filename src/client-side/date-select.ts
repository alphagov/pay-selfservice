import { DateTime } from 'luxon'
import { Period, getPeriodUKDateTimeRange } from '@utils/simplified-account/services/dashboard/datetime-utils'

function register() {
  document.getElementById('dateFilter')?.addEventListener('change', (event) => {
    if (!(event.target instanceof HTMLSelectElement)) {
      return
    }
    if (event.target.value === 'custom-range') {
      clearDates()
      return
    }

    const dates = getPeriodUKDateTimeRange(event.target.value as Period)
    setFromDate(dates.start)
    setEndDate(dates.end)
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

function setFromDate(date: DateTime) {
  ;(document.getElementById('fromDate') as HTMLInputElement).value = date.toFormat('dd/LL/yyyy')
}

function setEndDate(date: DateTime) {
  ;(document.getElementById('toDate') as HTMLInputElement).value = date.toFormat('dd/LL/yyyy')
}

export default function inject() {
  document.addEventListener('DOMContentLoaded', register)
}
