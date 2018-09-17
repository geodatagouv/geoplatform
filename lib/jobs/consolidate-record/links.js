'use strict'

const debug = require('debug')('geoplatform:jobs:consolidate-record:links')
const {proxyLink, getProxiedLink} = require('../../services/link-proxy')

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

const resourceTypes = {
  vector: [
    'gpkg',

    'shp',
    'mif',
    'tab'
  ],
  table: [
    'csv',
    'dbf',
    'xls'
  ],
  raster: [
    'tiff',
    'ecw',
    'jpeg2000'
  ]
}

function getResourceType(fileType) {
  if (resourceTypes.vector.includes(fileType)) {
    return 'vector'
  }

  if (resourceTypes.table.includes(fileType)) {
    return 'table'
  }

  if (resourceTypes.raster.includes(fileType)) {
    return 'raster'
  }

  return 'other'
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
          name: download.name,
          path: download.path,
          type: getResourceType(download.type),
          archive: download.archive,
          fileType: download.type,
          location: download.url,
          files: download.files
        }))
      }
    })
  )
}

module.exports = {resolveLinks, retrieveResourcesFromLinks}
