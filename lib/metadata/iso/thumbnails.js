const hasha = require('hasha')

const {isPublicURL} = require('../../utils/url')

exports.prepareThumbnails = function (graphicOverviews = []) {
  return graphicOverviews
    .map(go => ({
      originalUrl: go.fileName && go.fileName.trim(),
      description: go.fileDescription && go.fileDescription.trim()
    }))
    .filter(thumbnail => thumbnail.originalUrl && isPublicURL(thumbnail.originalUrl))
    .map(thumbnail => {
      thumbnail.originalUrlHash = hasha(thumbnail.originalUrl, {algorithm: 'sha1'}).substr(0, 7)
      return thumbnail
    })
}
