const mongoose = require('mongoose')

const {Http404} = require('../errors')
const am = require('../middlewares/async')

const Catalog = mongoose.model('Catalog')

function fetch(req, res, next, id) {
  Catalog
    .findById(id)
    .populate('service', 'location sync')
    .exec((err, catalog) => {
      if (err) {
        return next(err)
      }
      if (!catalog) {
        return next(new Http404())
      }
      req.catalog = catalog
      next()
    })
}

function show(req, res) {
  res.send(req.catalog)
}

const list = am(async (req, res) => {
  const catalogs = await Catalog
    .find()
    .populate('service', 'location sync')

  res.send(catalogs)
})

const update = am(async (req, res) => {
  if (req.body.name) {
    const catalog = await req.catalog.rename(req.body.name)
    res.send(catalog)
  } else {
    res.send(req.catalog)
  }
})

const destroy = am(async (req, res) => {
  await req.catalog.deleteAndClean()
  res.status(204).end()
})

module.exports = {
  fetch,
  list,
  show,
  destroy,
  update
}
