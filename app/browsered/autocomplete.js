'use strict'

const accessibleAutocomplete = require('accessible-autocomplete')

module.exports = () => {
  const autocompleteContainer = document.querySelector('#service-filter-container')

  if (autocompleteContainer) {
    const services = Array.prototype.slice.call(document.getElementsByClassName('service_list_item'))
    const names = services.map(service => service.dataset.name)

    const jumpToService = selected => {
      if (selected) {
        services.map(service => {
          service.style.display = service.dataset.name === selected ? 'block' : 'none'
        })
      }
    }

    accessibleAutocomplete({
      element: autocompleteContainer,
      id: 'service-filter',
      source: names,
      onConfirm: jumpToService,
      autoselect: true,
      showAllValues: false,
      displayMenu: 'overlay'
    })

    const clearButton = document.getElementById('clear-filters')

    clearButton.addEventListener('click', () => {
      document.getElementById('service-filter').value = ''
      const services = Array.prototype.slice.call(document.getElementsByClassName('service_list_item'))
      services.map(service => {
        service.style.display = 'block'
      })
    })
  }
}
