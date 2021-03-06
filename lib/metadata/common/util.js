const parseUrl = require('url').parse // eslint-disable-line node/no-deprecated-api
const {removeDiacritics} = require('natural')
const {uniq, compact, flatten} = require('lodash')

exports.makeStringComparable = function (str) {
  return removeDiacritics(str)
    .replace(/(\s|-|'|,)/g, '')
    .toLowerCase()
}

exports.getFileNameFromHref = function (href) {
  if (!href) {
    return null
  }

  const {pathname} = parseUrl(href)
  if (!pathname) {
    return null
  }

  const fullPath = parseUrl(href).pathname.split('/')
  return fullPath[fullPath.length - 1]
}

exports.getUniformArray = function (src) {
  return uniq(compact(flatten(src)))
}
