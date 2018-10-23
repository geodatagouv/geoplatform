const {get} = require('lodash')
const {bboxPolygon, union} = require('@turf/turf')
const bboxMatch = require('bbox-match')
const {communes, epci, departements, regions} = require('@etalab/fr-bounding-boxes')

const adminLevels = [
  ...communes,
  ...epci,
  ...departements,
  ...regions
]

const matchAdminLevel = bboxMatch(adminLevels)

exports.getCoveredTerritories = function (metadata) {
  const territories = []

  for (const {geographicElement} of get(metadata, 'identificationInfo.extent', [])) {
    if (!geographicElement) {
      continue
    }

    const bbox = getBbox(geographicElement)
    const level = matchAdminLevel(bbox)
    if (!level) {
      continue
    }

    territories.push(level.id)
  }

  return territories
}

exports.getConsolidatedExtent = function (metadata) {
  const candidateExtent = get(metadata, 'identificationInfo.extent')
  if (!candidateExtent) {
    return null
  }

  const polygons = []

  for (const {geographicElement} of candidateExtent) {
    if (!geographicElement) {
      continue
    }

    const bbox = getBbox(geographicElement)
    polygons.push(bboxPolygon(bbox))
  }

  if (polygons.length === 0) {
    return null
  }

  return polygons.length === 1 ? polygons[0].geometry : union(...polygons).geometry
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
