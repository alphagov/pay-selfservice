const slugify = require('slugify')

module.exports = string => {
  return slugify(
    string,
    {
      remove: /[$*_+~.()'"!\-:@]/g,
      lower: true
    }
  )
}
