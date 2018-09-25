'use strict'

const debug = require('debug')('geoplatform:jobs:consolidate-record:links')
const {proxyLink, getProxiedLink} = require('../../services/link-proxy')

const resourceTypes = {
  vector: [
    'shp',
    'mif',
    'tab',
    'geojson',
    'kml',
    'gpx'
  ],
  raster: [
    'tiff',
    'ecw',
    'jpeg2000'
  ],
  table: [
    'csv',
    'xls'
  ],
  data: [
    'grib2',
    'owl',
    'rdf',
    'dbf'
  ]
}

function getResourceType(type) {
  for (const [name, types] of Object.entries(resourceTypes)) {
    if (types.includes(type)) {
      return name
    }
  }

  return 'other'
}

async function resolveLinks(rawLinks = []) {
  return Promise.all(
    rawLinks.map(async link => {
      try {
        const proxy = await proxyLink(link.href)

        return {
          ...link,
          proxyId: proxy._id
        }
      } catch (error) {
        debug(`Unable to proxy link: ${link.href}`)
        console.error(error)
      }

      return link
    })
  )
}

function retrieveResourcesFromLinks(links = []) {
  return Promise.all(
    links.map(async link => {
      if (!link.proxyId) {
        return link
      }

      const proxied = await getProxiedLink(link.proxyId)
      if (!proxied || !proxied.downloads || proxied.downloads.length === 0) {
        return {
          ...link,
          type: 'page'
        }
      }

      return {
        ...link,
        type: 'download',
        downloads: proxied.downloads.map(download => ({
          id: download._id,
          resourceType: getResourceType(download.type),
          name: download.name,
          path: download.path,
          archive: download.archive,
          type: download.type,
          url: download.url,
          files: download.files
        }))
      }
    })
  )
}

module.exports = {resolveLinks, retrieveResourcesFromLinks}
