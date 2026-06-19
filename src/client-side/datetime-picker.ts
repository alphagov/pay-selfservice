declare const $: JQueryStatic | undefined

const initDateTimePicker = () => {
  const datePicker = () => {
    $!('.date-picker').datepicker({
      format: 'dd/mm/yyyy',
      autoclose: true,
    })
  }

  const timePicker = () => {
    $!('.time-picker').timepicker({
      showDuration: true,
      timeFormat: 'G:i:s',
      roundingFunction: () => null,
    })
  }

  const datePair = () => {
    $!('.datetime-pair').datepair({
      dateClass: 'date-picker',
      timeClass: 'time-picker',
    })
  }

  if (Object.hasOwn(window, '$') && $) {
    datePicker()
    timePicker()
    datePair()
  }
}

export default initDateTimePicker
