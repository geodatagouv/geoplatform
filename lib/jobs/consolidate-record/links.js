'use strict'

const {clone} = require('lodash')
const debug = require('debug')('geoplatform:jobs:consolidate-record:links')
const {proxyLink, getProxiedLink} = require('../../services/link-proxy')

async function withDownloads(link) {
  const withDownloadsLink = clone(link)

  try {
    const proxiedLink = await getProxiedLink(link.id)
    if (proxiedLink.downloads && proxiedLink.downloads.length > 0) {
      withDownloadsLink.downloads = proxiedLink.downloads
    }
  } catch (error) {
    debug(`Unable to fetch proxied link: ${link.id}`)
    console.error(error)
  }

  return withDownloadsLink
}

async function resolveLinks(rawLinks = [], cachedLinks = []) {
  const rawLinksHref = rawLinks.map(rawLink => rawLink.href)

  // Drop obsolete links
  const links = cachedLinks.filter(link => rawLinksHref.includes(link.href))

  // Add upsert new liks to analyzer
  const knownLinks = links.map(link => link.href)
  const unknownLinks = rawLinksHref.filter(linkHref => !knownLinks.includes(linkHref))

  const proxiedLinks = await Promise.all(
    unknownLinks.map(async unknownLink => {
      try {
        return await proxyLink(unknownLink)
      } catch (error) {
        debug(`Unable to proxy link: ${unknownLink}`)
        console.error(error)
      }
    })
  )

  for (const proxiedLink of proxiedLinks) {
    if (proxiedLink) {
      links.push({
        id: proxiedLink._id,
        href: proxiedLink.locations[0]
      })
    } else {
      // TODO Handle errors
    }
  }

  return links
}

async function buildResourcesFromLinks(metadata, links = []) {
  const withDownloadsLinks = await Promise.all(links.map(withDownloads))

  const alt = []
  const dist = []

  for (const link of withDownloadsLinks) {
    if (link.downloads) {
      for (const download of link.downloads) {
        dist.push({
          type: download.archive ? 'file-package' : 'file',
          linkId: link.id,
          distType: download.fileType,
          path: download.path,
          location: download.url,
          files: download.files,

          // Temporary so that it is displayed correctly in geo.data.gouv.fr
          available: true,
          hashedLocation: link.id,
          layer: download.name,
          uniqueId: `${link.id}@@${download.path}`
        })
      }
    } else {
      alt.push({
        type: 'page',
        name: link.name,
        location: link.href
      })
    }
  }

  return {alt, dist}
}

module.exports = {resolveLinks, buildResourcesFromLinks}
