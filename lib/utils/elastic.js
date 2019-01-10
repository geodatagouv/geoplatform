const elasticsearch = require('elasticsearch')
const debug = require('debug')('geoplatform:elastic')

const indices = {
  records: {
    mappings: {
      _doc: {
        properties: {
          title: {
            type: 'text',
            analyzer: 'french'
          },
          description: {
            type: 'text',
            analyzer: 'french'
          },
          lineage: {
            type: 'text',
            analyzer: 'french'
          },
          createdAt: {
            type: 'date'
          },
          revisionDate: {
            type: 'date'
          },

          type: {
            type: 'keyword'
          },
          representationType: {
            type: 'keyword'
          },
          metadataType: {
            type: 'keyword'
          },

          inspireTheme: {
            type: 'keyword'
          },
          topicCategory: {
            type: 'keyword'
          },
          organizations: {
            type: 'keyword'
          },
          keywords: {
            type: 'keyword'
          },
          catalogs: {
            type: 'keyword'
          },
          license: {
            type: 'keyword'
          },
          distributionFormats: {
            type: 'keyword'
          },

          downloadable: {
            type: 'boolean'
          },
          opendata: {
            type: 'boolean'
          },
          published: {
            type: 'boolean'
          }
        }
      }
    }
  }
}

class Elastic {
  constructor() {
    this.client = new elasticsearch.Client({
      host: process.env.ELASTIC_HOST || 'localhost:9200'
    })
  }

  createIndices() {
    return Promise.all(
      Object.entries(indices).map(async ([index, body]) => {
        const exists = await this.client.indices.exists({
          index
        })

        if (!exists) {
          await this.client.indices.create({
            index,
            body
          })

          debug(`created ${index} elasticsearch index`)
        }
      })
    )
  }

  index(index, id, body) {
    return this.client.index({
      index,
      type: '_doc',
      id,
      body
    })
  }
}

module.exports = new Elastic()
