import accessibleAutocomplete from 'accessible-autocomplete'

const initAutocomplete = () => {
  const autocompleteContainer = document.querySelector('#service-filter-container')

  if (autocompleteContainer) {
    const services = Array.from(document.getElementsByClassName('service-section'))
    const names = services.map(service => service.dataset.name)

    const jumpToService = selected => {
      if (selected) {
        services.forEach(service => {
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
      const services = Array.from(document.getElementsByClassName('service-section'))
      services.forEach(service => {
        service.style.display = 'block'
      })
    })
  }
}

export default initAutocomplete
