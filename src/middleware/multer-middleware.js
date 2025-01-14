const Multer = require('multer')
const storage = Multer.memoryStorage()
const multer = Multer({ storage })
const upload = multer.single('government-entity-document')

const multerPromise = (req, res) => {
  return new Promise((resolve, reject) => {
    upload(req, res, (err) => {
      if (!err) resolve()
      reject(err)
    })
  })
}

module.exports = async function uploadGovernmentEntityDocument (req, res, next) {
  try {
    await multerPromise(req, res)
    next()
  } catch (e) {
    next(e)
  }
}
