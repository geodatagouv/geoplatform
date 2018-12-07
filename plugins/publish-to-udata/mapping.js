const moment = require('moment')
const Handlebars = require('handlebars')
const {kebabCase} = require('lodash')
const debug = require('debug')('geoplatform:udata:mapping')

moment.locale('fr')

const {GEODATAGOUV_URL, ROOT_URL} = process.env

const bodyTemplate = Handlebars.compile(
  `{{metadata.description}}

{{#if metadata.lineage}}
__Origine__

{{metadata.lineage}}
{{/if}}

{{#if history}}
__Historique__

{{#each history}}
 * {{date}} : {{description}}
{{/each}}
{{/if}}

{{#if inlineOrganizations}}
__Organisations partenaires__

{{inlineOrganizations}}
{{/if}}

{{#if alternateLinks}}
__Liens annexes__

{{#each alternateLinks}}
 * [{{name}}]({{href}})
{{/each}}

{{/if}}
➞ [Consulter cette fiche sur geo.data.gouv.fr](${GEODATAGOUV_URL}/fr/datasets/{{recordId}})`
)

function extractServiceResources(service) {
  const resources = []

  for (const feature of service.features) {
    if (!feature.available) {
      continue
    }

    resources.push({
      url: `${ROOT_URL}/api/geogw/services/${service.serviceId}/feature-types/${feature.name}/download?format=GeoJSON&projection=WGS84`,
      title: `${feature.typeName} (export GeoJSON)`,
      description: 'Conversion à la volée au format GeoJSON',
      format: 'JSON',
      fileType: 'remote',
      extras: {
        'geop:resource_id': `service.${service.serviceType}:${service.serviceId}/${feature.name}`
      }
    })

    resources.push({
      url: `${ROOT_URL}/api/geogw/services/${service.serviceId}/feature-types/${feature.name}/download?format=SHP&projection=WGS84`,
      title: `${feature.typeName} (export SHP/WGS-84)`,
      description: 'Conversion à la volée au format Shapefile (WGS-84)',
      format: 'SHP',
      fileType: 'remote'
    })
  }

  return resources
}

function extractDownloadResources(resource) {
  const resources = []

  for (const download of resource.downloads) {
    if (download.archive) {
      resources.push({
        url: download.url,
        title: `${download.name} (archive)`,
        format: 'ZIP',
        fileType: 'remote'
      })
    }

    switch (download.resourceType) {
      case 'vector': {
        resources.push({
          url: `${ROOT_URL}/api/geogw/links/${resource.proxyId}/downloads/${download.id}/download?format=GeoJSON&projection=WGS84`,
          title: `${download.name} (export GeoJSON)`,
          description: 'Conversion à la volée au format GeoJSON',
          format: 'JSON',
          fileType: 'remote',
          extras: {
            'geop:resource_id': `download:${resource.proxyId}/${download.id}`
          }
        })
        resources.push({
          url: `${ROOT_URL}/api/geogw/links/${resource.proxyId}/downloads/${download.id}/download?format=SHP&projection=WGS84`,
          title: `${download.name} (export SHP/WGS-84)`,
          description: 'Conversion à la volée au format Shapefile (WGS-84)',
          format: 'SHP',
          fileType: 'remote'
        })
        break
      }

      default:
        // Do not publish "other" resourceTypes for now
        // The resource type mappings are defined in lib/jobs/consolidate-records/links.js
        if (!download.archive && download.resourceType !== 'other') {
          resources.push({
            url: download.url,
            title: download.name,
            format: download.type.toUpperCase(),
            description: resource.description || resource.name,
            fileType: 'remote'
          })
        }
        break
    }
  }

  return resources
}

function extractResources(inputResources) {
  const alternateLinks = []
  const resources = []

  for (const resource of inputResources) {
    switch (resource.type) {
      case 'page': {
        alternateLinks.push(resource)
        break
      }

      case 'service':
        resources.push(...extractServiceResources(resource))
        break

      case 'download':
        resources.push(...extractDownloadResources(resource))
        break

      default:
        debug(`Unknown resource type found: ${resource.type}`)
        break
    }
  }

  return {alternateLinks, resources}
}

function extractHistory(history = []) {
  const labels = {
    creation: 'Création',
    revision: 'Mise à jour',
    publication: 'Publication'
  }
  const types = Object.keys(labels)

  return history
    .filter(ev =>
      ev.date && moment(ev.date).isValid() && ev.type && types.includes(ev.type)
    )
    .map(ev => ({
      date: moment(ev.date).format('L'),
      description: labels[ev.type]
    }))
}

function extractTags(keywords = []) {
  const tags = keywords
    .map(tag => kebabCase(tag))
    .filter(tag => tag.length <= 32 && tag.length >= 3)

  tags.push('passerelle-inspire')

  return tags
}

function map(sourceDataset) {
  const inlineOrganizations = (sourceDataset.organizations || []).join(', ')

  const {alternateLinks, resources} = extractResources(sourceDataset.resources)
  const history = extractHistory(sourceDataset.metadata.history)
  const tags = extractTags(sourceDataset.metadata.keywords)

  const result = {
    title: sourceDataset.metadata.title,
    description: bodyTemplate({
      ...sourceDataset,
      history,
      inlineOrganizations,
      alternateLinks
    }),
    extras: {
      'inspire:identifier': sourceDataset.metadata.id,
      'inspire:resource_identifier': sourceDataset.metadata.resourceId,
      'geop:dataset_id': sourceDataset.recordId
    },
    license: sourceDataset.metadata.license,
    supplier: {},
    tags,
    resources
  }

  if (result.resources.length === 0) {
    debug('No publishable resources for %s (%s)', sourceDataset.metadata.title, sourceDataset.recordId)
  }

  if (result.title.length === 0) {
    throw new Error('title is a required field')
  }
  if (result.description.length === 0) {
    throw new Error('description is a required field')
  }

  return result
}

module.exports = {
  map
}
