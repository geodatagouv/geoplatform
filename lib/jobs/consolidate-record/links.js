'use strict'

const {clone, keyBy} = require('lodash')
const {upsertLink, getProxiedLink} = require('../../services/link-proxy')

async function withDownloads(link) {
  const withDownloadsLink = clone(link)
  try {
    const proxiedLink = await getProxiedLink(link.id)
    if (proxiedLink.downloads && proxiedLink.downloads.length > 0) {
      withDownloadsLink.downloads = proxiedLink.downloads
    }
  } catch (err) {
    console.error('Unable to fetch proxied link info %s', link.id)
  }
  return withDownloadsLink
}

async function resolveLinks(rawLinks = [], cachedLinks = []) {
  const rawLinksHref = rawLinks.map(rawLink => rawLink.href)

  const links = cachedLinks
    .filter(link => rawLinksHref.includes(link.href)) // Drop obsolete links

  // Add upsert new liks to analyzer
  const knownLinks = links.map(link => link.href)
  const unknownLinks = rawLinksHref.filter(linkHref => !knownLinks.includes(linkHref))
  const upsertingLinks = unknownLinks.map(unknownLink => {
    return upsertLink(unknownLink).catch(err => {
      console.error(`Unable to upsert link: ${unknownLink}`)
      console.error(err)
    })
  })

  const upsertedLinks = await Promise.all(upsertingLinks)

  upsertedLinks.forEach(upsertedLink => {
    if (upsertedLink) {
      links.push({
        id: upsertedLink._id,
        href: upsertedLink.locations[0]
      })
    } else {
      // TODO Handle errors
    }
  })

  return links
}

async function buildResourcesFromLinks(metadata, links = []) {
  const withDownloadsLinks = await Promise.all(links.map(withDownloads))
  const indexedLinks = keyBy(withDownloadsLinks, 'href')
  const originalLinks = metadata.links || []

  const alt = []
  const dist = []

  // Populate resources arrays with analyzed links
  // originalLinks.forEach(rawLink => {
  //   if (!indexedLinks[rawLink.href]) {
  //     // TODO Improve error detection
  //     // resources.push({
  //     //   name: rawLink.name,
  //     //   location: rawLink.href,
  //     //   type: 'error',
  //     // })
  //   } else if (!indexedLinks[rawLink.href].checkResult) {
  //     // TODO Improve error detection
  //     // resources.push({
  //     //   name: rawLink.name,
  //     //   location: rawLink.href,
  //     //   type: 'not-analyzed-yet',
  //     // })
  //   } else {
  //     const analyzedLink = indexedLinks[rawLink.href]
  //     if (['file-distribution', 'unknown-archive'].includes(analyzedLink.checkResult.type)) {
  //       if (analyzedLink.checkResult.archive && analyzedLink.checkResult.archive.datasets.length > 0) {
  //         analyzedLink.checkResult.archive.datasets.forEach(dataset => {
  //           dist.push({
  //             type: 'file-package',
  //             name: `${rawLink.name} (${dataset})`,
  //             location: rawLink.href,
  //             hashedLocation: analyzedLink.id,
  //             available: analyzedLink.checkResult.available,
  //             layer: dataset,
  //             uniqueId: analyzedLink.id + '@@' + dataset
  //           })
  //         })
  //       } else {
  //         dist.push({
  //           type: 'file-package',
  //           originalDistribution: true,
  //           name: rawLink.name,
  //           location: rawLink.href,
  //           hashedLocation: analyzedLink.id,
  //           available: analyzedLink.checkResult.available
  //         })
  //       }
  //     } else {
  //       alt.push({
  //         name: rawLink.name,
  //         location: rawLink.href,
  //         type: 'page'
  //       })
  //     }
  //   }
  // })

  return {alt, dist}
}

module.exports = {resolveLinks, buildResourcesFromLinks}
