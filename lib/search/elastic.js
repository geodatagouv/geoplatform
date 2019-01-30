const elastic = require('../utils/elastic')

function safeParseInt(input, fallback) {
  let value

  try {
    value = parseInt(input, 10)
  } catch (error) {
    return fallback
  }

  return value > 0 ? value : fallback
}

function getQueryString(q) {
  if (Array.isArray(q)) {
    q = q.find(v => v)
  }

  return q ? q.trim() : ''
}

function mapFacets(key, value) {
  switch (key) {
    case 'availability':
      return {
        downloadable: value === 'yes'
      }

    case 'dgvPublication':
      return {
        published: value === 'yes'
      }

    case 'opendata':
      return {
        opendata: value === 'yes'
      }

    case 'distributionFormat':
      return {
        distributionFormats: value
      }

    case 'catalog':
      return {
        catalogs: value
      }

    case 'organization':
      return {
        organizations: value
      }

    case 'type':
    case 'metadataType':
    case 'representationType':
    case 'license':
      return {
        [key]: value
      }

    default:
      return null
  }
}

function createQuery(q, filters, options) {
  const match = {
    multi_match: {
      query: q,
      analyzer: 'french',
      operator: 'and',
      zero_terms_query: 'all',
      fields: [
        'title^20',
        'description',
        'lineage',
        'organizations^15',
        'keywords^10'
      ],
      fuzziness: 'AUTO'
    }
  }

  const filter = []

  for (const [key, value] of Object.entries(filters)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        const term = mapFacets(key, v)
        if (term) {
          filter.push({
            term
          })
        }
      }
    } else {
      const term = mapFacets(key, value)
      if (term) {
        filter.push({
          term
        })
      }
    }
  }

  const query = {
    bool: {
      must: [
        match,
        ...filter
      ],
      must_not: []
    }
  }

  if (options.excludeServices) {
    query.bool.must_not.push({
      term: {
        type: 'service'
      }
    })
  }

  return {query}
}

async function search(query, options) {
  let {
    q,
    limit,
    offset,
    ...filters
  } = query

  q = getQueryString(q)
  limit = safeParseInt(limit, 10)
  offset = safeParseInt(offset, 0)

  options = {
    excludeServices: false,
    ...options
  }

  const result = await elastic.client.search({
    index: 'records',
    body: {
      aggs: {
        type: {
          terms: {
            field: 'type'
          }
        },
        representationType: {
          terms: {
            field: 'representationType'
          }
        },
        metadataType: {
          terms: {
            field: 'metadataType'
          }
        },
        organizations: {
          terms: {
            field: 'organizations',
            size: 20
          }
        },
        catalogs: {
          terms: {
            field: 'catalogs',
            size: 20
          }
        },
        license: {
          terms: {
            field: 'license'
          }
        },
        distributionFormats: {
          terms: {
            field: 'distributionFormats'
          }
        },
        downloadable: {
          terms: {
            field: 'downloadable'
          }
        },
        opendata: {
          terms: {
            field: 'opendata'
          }
        },
        published: {
          terms: {
            field: 'published'
          }
        }
      },
      size: limit,
      from: offset,
      sort: [
        '_score',
        {createdAt: 'desc'}
      ],
      ...createQuery(q, filters, options)
    }
  })

  return result
}

module.exports = search
