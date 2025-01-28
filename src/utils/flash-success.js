function flashSuccess (req, flashMessage) {
  req.flash('messages', { state: 'success', icon: '&check;', heading: flashMessage })
}

module.exports = flashSuccess
