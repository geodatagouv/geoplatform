'use strict'

const {pick, get} = require('lodash')
const {cleanKeywords} = require('../common/keywords')
const {normalizeContacts} = require('../common/contacts')
const {getLicenseFromLinks, getLicenseFromCatalogs} = require('../common/licenses')
const {getFileNameFromHref, getUniformArray} = require('../common/util')
const {castLink} = require('../common/links')

exports.convert = function (record, catalogs = []) {
  const dataset = pick(record, 'title', 'description', 'type')
  dataset.id = record.identifier
  dataset.metadataType = 'Dublin Core'

  // Keywords
  dataset.keywords = cleanKeywords(get(record, 'subject') || [])

  // Contacts
  const candidateContributors = [record.publisher, record.creator, record.contributor]
  dataset.contacts = normalizeContacts(getUniformArray(candidateContributors).map(contributor => ({
    organizationName: contributor,
    relatedTo: 'data',
    role: 'notDefined'
  })))

  // Links
  dataset.links = getUniformArray([record.relation, record.references])
    .map(link => ({
      name: getFileNameFromHref(link),
      href: link
    }))
    .map(castLink)
    .filter(link => link.href)

  // License
  dataset.license = getLicenseFromLinks(dataset.links) || getLicenseFromCatalogs(catalogs)

  // Additional rules (custom)
  // ...placeholder...

  return dataset
}
