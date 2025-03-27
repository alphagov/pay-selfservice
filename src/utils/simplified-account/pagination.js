/**
 * @typedef page
 * @property [number] {number}
 * @property [href] {string}
 * @property [current] {boolean}
 * @property [ellipsis] {boolean}
 */

/**
 * @typedef arrowLink
 * @property href {string}
 */

/**
 * @param currentPage {number}
 * @param pageSize {number}
 * @param totalItems {number}
 * @param urlGenerator {function(number): string}
 * @returns {{startIndex: number, endIndex: number, total: number, [previous]: arrowLink, [next]: arrowLink, classes: string, [items]: Array.<page>}}
 */
module.exports = function getPagination (currentPage, pageSize, totalItems, urlGenerator) {
  const startIndex = (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(startIndex + pageSize - 1, totalItems)
  const pagination = {
    classes: 'pagination-links',
    total: totalItems,
    startIndex,
    endIndex
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

  // 5 pages or fewer, show all page numbers without ellipses
  if (totalPages <= 5) {
    /** @type page[] */
    const items = []
    for (let i = 0; i < totalPages; i++) {
      items[i] = {
        number: i + 1,
        href: urlGenerator(i + 1)
      }
      if (currentPage === i + 1) {
        items[i].current = true
      }
    }
    pagination.items = items
  } else {
    /** @type page[] */
    const items = [
      {
        number: 1,
        href: urlGenerator(1),
        current: currentPage === 1
      }
    ]

    if (currentPage <= 3) {
      // start: 1, 2, 3, 4, ..., totalPages
      for (let i = 2; i <= 4; i++) {
        items.push({
          number: i,
          href: urlGenerator(i),
          current: currentPage === i
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
          current: currentPage === i
        })
      }
    } else {
      // middle: 1, ..., currentPage-1, currentPage, currentPage+1, ..., totalPages
      items.push({ ellipsis: true })
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        items.push({
          number: i,
          href: urlGenerator(i),
          current: currentPage === i
        })
      }
      items.push({ ellipsis: true })
    }

    items.push({
      number: totalPages,
      href: urlGenerator(totalPages),
      current: currentPage === totalPages
    })

    pagination.items = items
  }

  return pagination
}
