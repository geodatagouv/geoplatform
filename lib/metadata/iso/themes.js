'use strict'

const {makeStringComparable} = require('../common/util')
const themes = require('./themes.json')

// Prepare themes registry
const themesPatterns = {}
themes.forEach(th => {
  themesPatterns[makeStringComparable(th.label.fr)] = th
  themesPatterns[makeStringComparable(th.label.en)] = th
})

exports.getInspireThemeFromKeywords = function (keywords = []) {
  const candidate = keywords.map(makeStringComparable).find(kwd => kwd in themesPatterns)
  if (candidate) {
    return themesPatterns[candidate]
  }
}
