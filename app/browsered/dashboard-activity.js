'use strict'

exports.init = () => {
  const rangeSelector = document.getElementById('activity-period')

  if (rangeSelector) {
    rangeSelector.addEventListener('change', submit, false)
  }
}

const submit = e => {
  e.target.form.submit()
}
