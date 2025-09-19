const SEARCH_CONTAINER_ID = 'service-search__container'
const SEARCH_INPUT_ID = 'service-search__input'
const SEARCH_CLEAR_ID = 'service-search__clear-button'
const SEARCH_STATS_CONTAINER_ID = 'search-stats'
const SERVICE_LINK_CLASS = 'service-link'

class ServiceSearch {
  private searchContainer
  private searchInput
  private searchClear
  private searchStats
  private services
  private serviceNames

  constructor() {
    this.searchContainer = document.getElementById(SEARCH_CONTAINER_ID) as HTMLDivElement
    this.searchInput = document.getElementById(SEARCH_INPUT_ID) as HTMLInputElement
    this.searchClear = document.getElementById(SEARCH_CLEAR_ID) as HTMLButtonElement
    this.searchStats = document.getElementById(SEARCH_STATS_CONTAINER_ID) as HTMLParagraphElement
    this.services = Array.from(document.getElementsByClassName(SERVICE_LINK_CLASS)) as HTMLDivElement[]
    this.serviceNames = this.services.map((service) => service.dataset.name)
    this.init()
  }

  init() {
    this.searchContainer.style.display = 'block'

    this.searchInput.addEventListener('input', (e) => {
      this.handleSearch((e.target as HTMLInputElement).value)
    })

    this.updateStats(this.services.length, this.services.length)

    this.searchClear.addEventListener('click', () => {
      this.handleClear()
    })
  }

  handleClear() {
    this.searchClear.style.display = 'none'
    this.searchInput.value = ''
    this.services.forEach((service) => {
      service.style.display = 'flex'
    })
    this.updateStats(this.services.length, this.services.length, '')
  }

  handleSearch(query: string) {
    const searchTerm = query.toLowerCase().trim()
    if (searchTerm.length > 0) {
      this.searchClear.style.display = 'block'
    } else {
      this.searchClear.style.display = 'none'
    }
    let visibleCount = 0

    this.services.forEach((service, index) => {
      const serviceName = this.serviceNames[index]

      if (!serviceName) return

      const matches = serviceName.toLowerCase().startsWith(searchTerm)

      if (matches || searchTerm === '') {
        service.style.display = 'flex'
        visibleCount++
      } else {
        service.style.display = 'none'
      }
    })

    this.updateStats(visibleCount, this.services.length, searchTerm)
  }

  updateStats(visibleCount: number, total: number, searchTerm = '') {
    if (visibleCount > 0) {
      if (searchTerm) {
        this.searchStats.textContent = `Showing ${visibleCount} of ${total} services`
      } else {
        this.searchStats.textContent = `${total} services`
      }
    } else {
      this.searchStats.textContent = `No matching services`
    }
  }
}

export default function inject() {
  if (document.getElementById(SEARCH_CONTAINER_ID)) {
    document.addEventListener('DOMContentLoaded', () => {
      new ServiceSearch()
    })
  }
}
