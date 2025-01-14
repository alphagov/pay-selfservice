/**
 *
 * @param {{ line1: string, line2: string, city: string, postcode: string }}
 * @returns {string}
 */
const formatAddressAsParagraph = ({ line1, line2, city, postcode }) => {
  return [line1, line2, city, postcode].filter(v => v && v !== '').join('<br>')
}

module.exports.formatAddressAsParagraph = formatAddressAsParagraph
