'use strict'

const moment = require('moment')
const debug = require('debug')('geoplatform:jobs:consolidate-record:links')
const {proxyLink, getLink, getLinkByLocation, getLastCheck} = require('../../services/link-proxy')

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

async function resolveLinks(rawLinks = [], cachedLinks = []) {
  return Promise.all(
    rawLinks.map(async link => {
      try {
        let proxyId
        let proxiedAt

        const cachedLink = cachedLinks.find(l => l.href === link.href)

        if (cachedLink) {
          ({proxyId, proxiedAt} = cachedLink)
        } else {
          try {
            const proxiedLink = await getLinkByLocation(link.href)

            if (proxiedLink) {
              proxyId = proxiedLink._id
            }
          } catch (error) {
            // We could not find the link, let’s swallow this error.
          }
        }

        if (proxyId && !proxiedAt) {
          try {
            const check = await getLastCheck(proxyId)

            if (check) {
              proxiedAt = new Date(check.updatedAt)
            }
          } catch (error) {
            // We could not find a completed check, let’s swallow this error.
          }
        }

        if (!proxyId || !proxiedAt || moment().diff(proxiedAt, 'hours') > 24) {
          debug(`Proxying link "${link.href}"`)

          const proxy = await proxyLink(link.href)
          proxyId = proxy._id
          proxiedAt = null
        }

        return {
          ...link,
          proxyId,
          proxiedAt
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

      const proxied = await getLink(link.proxyId)
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
