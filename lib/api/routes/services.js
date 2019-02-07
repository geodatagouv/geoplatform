const services = require('../controllers/services')
const featureTypes = require('../controllers/feature-types')

const {TRANSCODER_URL} = process.env

module.exports = function (app) {
  // Params
  app.param('serviceId', services.service)
  app.param('syncId', services.sync)
  app.param('typeName', featureTypes.featureType)

  // Routes
  app.route('/services')
    .get(services.list)
    .post(services.create)

  app.route('/services/by-protocol/:protocol')
    .get(services.list)

  app.route('/services/:serviceId')
    .get(services.show)

  app.route('/services/:serviceId/sync')
    .post(services.handleSync)

  app.route('/services/:serviceId/synchronizations')
    .get(services.listSyncs)

  app.route('/services/:serviceId/synchronizations/:syncId')
    .get(services.showSync)

  app.route('/services/by-protocol/:protocol/sync-all')
    .post(services.syncAllByProtocol)

  app.route('/services/:serviceId/feature-types/:typeName')
    .get(featureTypes.show)

  app.route('/services/:serviceId/feature-types/:typeName/download')
    .get((req, res) => {
      const {serviceId, typeName} = req.params
      const {search} = req._parsedUrl

      res.redirect(`${TRANSCODER_URL}/services/${serviceId}/feature-types/${typeName}${search}`)
    })

  app.route('/services/:serviceId/feature-types')
    .get(featureTypes.list)
}
