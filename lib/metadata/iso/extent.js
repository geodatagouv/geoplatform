'use strict'

const {get} = require('lodash')
const {bboxPolygon, union} = require('@turf/turf')
const bboxMatch = require('bbox-match')
const {communes, epci, departements, regions} = require('@etalab/fr-bounding-boxes')

const adminLevels = communes
  .concat(epci)
  .concat(departements)
  .concat(regions)

const matchAdminLevel = bboxMatch(adminLevels)

exports.getCoveredTerritories = function (metadata) {
  return get(metadata, 'identificationInfo.extent', [])
    .map(extent => {
      const g = extent.geographicElement
      if (!g) {
        return
      }
      return getBbox(g)
    })
    .filter(bbox => Boolean(bbox))
    .map(bbox => {
      const matchResult = matchAdminLevel(bbox)
      if (matchResult) {
        return matchResult.id
      }
    })
    .filter(territories => Boolean(territories))
}

exports.getConsolidatedExtent = function (metadata) {
  const candidateExtent = get(metadata, 'identificationInfo.extent')
  if (!candidateExtent) {
    return
  }
  const bboxPolygons = metadata.identificationInfo.extent
    .map(extent => {
      const g = extent.geographicElement
      if (!g) {
        return
      }
      return [g.westBoundLongitude, g.southBoundLatitude, g.eastBoundLongitude, g.northBoundLatitude]
    })
    .filter(bbox => Boolean(bbox))
    .map(bbox => bboxPolygon(bbox))

  if (bboxPolygons.length === 0) {
    return
  }

  return bboxPolygons.length === 1 ? bboxPolygons[0].geometry : union(...bboxPolygons).geometry
}

function getBbox(g) {
  let xMin
  let xMax
  let yMin
  let yMax
  if (g.westBoundLongitude <= g.eastBoundLongitude) {
    xMin = g.westBoundLongitude
    xMax = g.eastBoundLongitude
  } else {
    xMax = g.westBoundLongitude
    xMin = g.eastBoundLongitude
  }
  if (g.northBoundLatitude >= g.southBoundLatitude) {
    yMax = g.northBoundLatitude
    yMin = g.southBoundLatitude
  } else {
    yMin = g.northBoundLatitude
    yMax = g.southBoundLatitude
  }
  return [xMin, yMin, xMax, yMax]
}
