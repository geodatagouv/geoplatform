'use strict'

const moment = require('moment')
const Handlebars = require('handlebars')
const {get, filter, kebabCase} = require('lodash')
const {strRight} = require('underscore.string')
const debug = require('debug')('mapping')

moment.locale('fr')

const {ROOT_URL} = process.env

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

{{#if alternateResources}}
__Liens annexes__

{{#each alternateResources}}
 * [{{name}}]({{location}})
{{/each}}

{{/if}}
➞ [Consulter cette fiche sur geo.data.gouv.fr](https://geo.data.gouv.fr/datasets/{{recordId}})`
)

exports.map = function (sourceDataset) {
  sourceDataset.alternateResources = filter(sourceDataset.alternateResources || [], 'name')
  sourceDataset.inlineOrganizations = (sourceDataset.organizations || []).join(', ')

  sourceDataset.history = (sourceDataset.metadata.history || [])
    .filter(ev => {
      return ev.date && moment(ev.date).isValid() && ev.type && ['creation', 'revision', 'publication'].includes(ev.type)
    })
    .map(ev => {
      const labels = {
        creation: 'Création',
        revision: 'Mise à jour',
        publication: 'Publication'
      }
      return {date: moment(ev.date).format('L'), description: labels[ev.type]}
    })

  const out = {
    title: sourceDataset.metadata.title,
    description: bodyTemplate(sourceDataset),
    extras: {
      'inspire:identifier': sourceDataset.metadata.id,
      'inspire:resource_identifier': get(sourceDataset, 'metadata.resourceId'),
      'geop:dataset_id': sourceDataset.recordId
    },
    license: sourceDataset.metadata.license,
    supplier: {},
    resources: []
  }

  if (sourceDataset.metadata.keywords) {
    out.tags = sourceDataset.metadata.keywords
      .map(tag => kebabCase(tag))
      .filter(tag => tag.length <= 32 && tag.length >= 3)
    out.tags.push('passerelle-inspire')
  }

  for (const resource of sourceDataset.resources) {
    switch (resource.type) {
      case 'service': {
        for (const feature of resource.features) {
          if (!feature.available) {
            continue
          }

          out.resources.push({
            url: `${ROOT_URL}/api/geogw/services/${resource.serviceId}/feature-types/${feature.name}/download?format=GeoJSON&projection=WGS84`,
            title: `${feature.name} (export GeoJSON)`,
            description: `Conversion à la volée du jeu de données d’origine ${feature.name} au format GeoJSON`,
            format: 'JSON',
            fileType: 'remote',
            extras: {
              'geop:resource_id': `${resource.serviceType}:${resource.serviceId}/${feature.typeName}`
            }
          })
          out.resources.push({
            url: `${ROOT_URL}/api/geogw/services/${resource.serviceId}/feature-types/${feature.name}/download?format=SHP&projection=WGS84`,
            title: `${feature.name} (export GeoJSON)`,
            description: `Conversion à la volée du jeu de données d’origine ${feature.name} au format GeoJSON`,
            format: 'SHP',
            fileType: 'remote'
          })
        }
        break
      }

      case 'download': {
        for (const download of resource.downloads) {
          if (download.archive) {
            out.resources.push({
              url: download.url,
              title: `${download.name} (archive)`,
              description: resource.name,
              format: 'ZIP',
              fileType: 'remote'
            })
          }

          switch (resource.resourceType) {
            case 'vector': {

            }
          }
        }
        break
      }

      default:
        break
    }
  }

  // if (sourceDataset.dataset.distributions) {
  //   const processedFeatureTypes = []

  //     } else if (distribution.type === 'file-package' && distribution.layer) {
  //       rootUrl = process.env.ROOT_URL + '/api/geogw/file-packages/' + distribution.hashedLocation + '/download'
  //       out.resources.push({
  //         url: distribution.location,
  //         title: 'Archive complète',
  //         format: 'ZIP',
  //         fileType: 'remote'
  //       })
  //       out.resources.push({
  //         url: rootUrl + '?format=GeoJSON&projection=WGS84',
  //         title: `${distribution.layer} (export GeoJSON)`,
  //         description: 'Conversion à la volée au format GeoJSON',
  //         format: 'JSON',
  //         fileType: 'remote',
  //         extras: {
  //           'geop:resource_id': `file-package:${distribution.hashedLocation}/${distribution.layer}`
  //         }
  //       })
  //       out.resources.push({
  //         url: rootUrl + '?format=SHP&projection=WGS84',
  //         title: `${distribution.layer} (export SHP/WGS-84)`,
  //         description: 'Conversion à la volée au format Shapefile (WGS-84)',
  //         format: 'SHP',
  //         fileType: 'remote'
  //       })
  //     } else if (distribution.type === 'file-package' && distribution.originalDistribution) {
  //       out.resources.push({
  //         url: distribution.location,
  //         title: distribution.name,
  //         format: 'ZIP',
  //         fileType: 'remote'
  //       })
  //     }
  //   })
  // }

  if (out.resources.length === 0) {
    debug('No publishable resources for %s (%s)', sourceDataset.metadata.title, sourceDataset.recordId)
  }

  if (out.title.length === 0) {
    throw new Error('title is a required field')
  }
  if (out.description.length === 0) {
    throw new Error('description is a required field')
  }

  return out
}
