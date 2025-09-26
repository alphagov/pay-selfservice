interface PaginationItem {
  current?: boolean
  number?: number
  href?: string
  ellipsis?: boolean
}

interface PaginationResult {
  classes: string
  total: number
  startIndex: number
  endIndex: number
  previous?: { href: string }
  next?: { href: string }
  items?: PaginationItem[]
}

const getPagination = (
  currentPage: number,
  pageSize: number,
  totalItems: number,
  urlGenerator: (pageNumber: number) => string
) => {
  const startIndex = (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(startIndex + pageSize - 1, totalItems)
  const pagination: PaginationResult = {
    classes: 'pagination-links',
    total: totalItems,
    startIndex,
    endIndex,
  }

  if (totalItems <= pageSize) {
    return pagination
  }

  const totalPages = Math.ceil(totalItems / pageSize)

  if (currentPage !== 1) {
    pagination.previous = { href: urlGenerator(currentPage - 1) }
  }

  if (currentPage !== totalPages) {
    pagination.next = { href: urlGenerator(currentPage + 1) }
  }

  const items: PaginationItem[] = []
  // 5 pages or fewer, show all page numbers without ellipses
  if (totalPages <= 5) {
    for (let i = 0; i < totalPages; i++) {
      items[i] = {
        number: i + 1,
        href: urlGenerator(i + 1),
      }
      if (currentPage === i + 1) {
        items[i].current = true
      }
    }
    pagination.items = items
    return pagination
  }

  items.push({
    number: 1,
    href: urlGenerator(1),
    current: currentPage === 1,
  })

  if (currentPage <= 3) {
    // start: 1, 2, 3, 4, ..., totalPages
    for (let i = 2; i <= 4; i++) {
      items.push({
        number: i,
        href: urlGenerator(i),
        current: currentPage === i,
      })
    }
    items.push({ ellipsis: true })
  } else if (currentPage >= totalPages - 2) {
    // end: 1, ..., totalPages-3, totalPages-2, totalPages-1, totalPages
    items.push({ ellipsis: true })
    for (let i = totalPages - 3; i < totalPages; i++) {
      items.push({
        number: i,
        href: urlGenerator(i),
        current: currentPage === i,
      })
    }
  } else {
    // middle: 1, ..., currentPage-1, currentPage, currentPage+1, ..., totalPages
    items.push({ ellipsis: true })
    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
      items.push({
        number: i,
        href: urlGenerator(i),
        current: currentPage === i,
      })
    }
    items.push({ ellipsis: true })
  }

  items.push({
    number: totalPages,
    href: urlGenerator(totalPages),
    current: currentPage === totalPages,
  })

  pagination.items = items

  return pagination
}

export = getPagination
