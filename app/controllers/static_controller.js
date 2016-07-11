module.exports.naxsiError = function (req, res) {
  res.status(400);
  res.render('error', { message: "Please try again later"});
};
