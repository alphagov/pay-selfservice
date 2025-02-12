// TODO PP-13353
function get (re, res) {
  res.status(501).json({ error: 'not implemented' })
}

module.exports = {
  get
}
