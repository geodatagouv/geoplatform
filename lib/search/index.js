'use strict'

const mongoose = require('mongoose')
const Promise = require('bluebird')
const {mapValues, isString, isNumber, isArray, clone, forEach, take} = require('lodash')

const RESULT_PARTS = ['results', 'count', 'facets', 'query']

function parseResultParts(resultParts = '') {
  const parts = resultParts.split(',').filter(part => RESULT_PARTS.includes(part))
  return parts.length > 0 ? parts : RESULT_PARTS
}

function prepareTextInput(textInput) {
  if (!textInput || !isString(textInput) || textInput.length === 0) {
    return
  }
  return textInput
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => `"${word}"`)
    .join(' ')
}

module.exports = function (searchQuery, catalogName) {
  const resultParts = parseResultParts(searchQuery.resultParts)
  const ConsolidatedRecord = mongoose.model('ConsolidatedRecord')

  const preparedTextInput = prepareTextInput(searchQuery.q)
  let limit = parseInt(searchQuery.limit, 10)
  limit = isNumber(limit) && limit > 0 && limit <= 500 ? Math.floor(limit) : 20
  let offset = parseInt(searchQuery.offset, 10)
  offset = isNumber(offset) && offset > 0 ? Math.floor(offset) : 0

  const query = {}

  // Text search
  if (preparedTextInput) {
    query.$text = {$search: preparedTextInput, $language: 'french'}
  }

  // Facets
  const facetKeys = [
    'organization',
    'type',
    'keyword',
    'representationType',
    'opendata',
    'distributionFormat',
    'availability',
    'metadataType',
    'dgvPublication'
  ]
  if (!catalogName) {
    facetKeys.push('catalog')
  }

  const facetsFromQuery = []
  facetKeys.forEach(facetKey => {
    if (!(facetKey in searchQuery)) {
      return
    }

    const values = isArray(searchQuery[facetKey]) ? searchQuery[facetKey] : [searchQuery[facetKey]]
    values.forEach(value => {
      facetsFromQuery.push({name: facetKey, value})
    })
  })

  const facetsToUse = clone(facetsFromQuery)

  if (catalogName) {
    facetsToUse.push({name: 'catalog', value: catalogName})
  }

  if (facetsToUse.length > 0) {
    query.facets = {
      $all: facetsToUse.map(facet => {
        return {$elemMatch: facet}
      })
    }
  }

  const resolvers = {

    results: () => {
      return ConsolidatedRecord.find(query)
        .select({score: {$meta: 'textScore'}, facets: 0}) // TODO: $meta seems to break selection :/
        .sort({score: {$meta: 'textScore'}})
        .skip(offset)
        .limit(limit)
        .lean()
        .exec()
    },

    count: () => {
      return ConsolidatedRecord.count(query).exec()
    },

    facets: async () => {
      const result = await ConsolidatedRecord
        .aggregate([
          {$match: query},
          {$unwind: '$facets'},
          {$group: {_id: {name: '$facets.name', value: '$facets.value'}, count: {$sum: 1}}},
          {$sort: {count: -1}}
        ])
        .exec()

      const outputFacets = {}
      result.forEach(facet => {
        if (catalogName && facet._id.name === 'catalog') {
          return
        }
        if (!outputFacets[facet._id.name]) {
          outputFacets[facet._id.name] = []
        }
        outputFacets[facet._id.name].push({
          value: facet._id.value,
          count: facet.count
        })
      })

      if (!searchQuery.facets) {
        searchQuery.facets = {organization: 20, keyword: 20, catalog: 20}
      }

      forEach(outputFacets, (facetList, facetName) => {
        if (facetName in searchQuery.facets) {
          if (parseInt(searchQuery.facets[facetName], 10) === 0) {
            outputFacets[facetName] = undefined
            return
          }
          outputFacets[facetName] = take(outputFacets[facetName], searchQuery.facets[facetName])
        }
      })
      return outputFacets
    },

    query: () => {
      return {q: searchQuery.q, facets: facetsFromQuery, limit, offset}
    }

  }

  const filteredResolvers = mapValues(resolvers, (resolver, partName) => {
    if (resultParts.includes(partName)) {
      return resolver()
    }
  })

  return Promise.props(filteredResolvers)
}
