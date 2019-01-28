const path = require('path')
const ogr2ogr = require('ogr2ogr')
const ms = require('ms')

const got = require('../got')
const {Http400, Http500} = require('../api/errors')
const am = require('../api/middlewares/async')

const defaultTimeout = ms('20m')

function getSource(method, source, type) {
  switch (type) {
    case 'wfs':
      return `WFS:${source}`

    case 'url':
      return got.stream(source).pause()

    default:
      return source
  }
}

function getProjection(projection) {
  switch (projection) {
    case 'WGS84':
      return 'EPSG:4326'

    case 'Lambert93':
      return 'EPSG:2154'

    default:
      return null
  }
}

function getInputFormat(format) {
  switch (format) {
    case 'mif':
      return 'MapInfo File'

    default:
      return format
  }
}

function getFormatInfo(format) {
  switch (format) {
    case 'GeoJSON':
      return {
        format,
        mime: 'application/json',
        ext: 'json'
      }

    case 'KML':
      return {
        format,
        mime: 'application/vnd.google-earth.kml+xml',
        ext: 'kml'
      }

    case 'SHP':
      return {
        format: 'ESRI Shapefile',
        mime: 'application/x-shapefile',
        ext: 'shp.zip'
      }

    case 'CSV':
      return {
        format,
        mime: 'text/csv',
        ext: 'csv'
      }

    default:
      return null
  }
}

function getName(input) {
  if (!input) {
    return 'dataset'
  }

  const {name} = path.parse(input)
  return name
}

function getOptions(opts) {
  switch (opts.type) {
    case 'wfs':
      return [opts.name]

    default:
      return []
  }
}

function downloadDataset(input, opts) {
  return am(async (req, res) => {
    const projection = getProjection(req.query.projection)
    if (!projection) {
      throw new Http400('No valid projection given')
    }

    const formatInfo = getFormatInfo(req.query.format)
    if (!formatInfo) {
      throw new Http400('No valid format given')
    }

    const {format, mime, ext} = formatInfo
    const name = getName(opts.name)

    res.type(mime)
    res.attachment(`${name}.${ext}`)

    if (req.method === 'HEAD') {
      return res.status(200).end()
    }

    const source = getSource(req.method, input, opts.type)
    const inputFormat = getInputFormat(opts.format)
    const options = getOptions(opts)

    const ogr = ogr2ogr(source, inputFormat)
      .timeout(defaultTimeout)
      .skipfailures()
      .project(projection)
      .format(format)
      .options(options)

    // Disable unarchiving if the input is not an archive
    if (opts.archive === false && ogr._inDriver.output === 'zip') {
      ogr._inDriver.output = opts.format
    }

    try {
      const data = await ogr.promise()
      res.send(data)
    } catch (error) {
      throw new Http500('Failed transcoding dataset')
    }
  })
}

exports.downloadDataset = downloadDataset
