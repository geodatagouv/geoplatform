'use strict'

const {compact} = require('lodash')
const {normalizeName} = require('../../../france/producer')

exports.normalizeContacts = function (contacts) {
  return compact(contacts.map(contact => {
    try {
      return {
        ...contact,
        organizationName: normalizeName(contact.organizationName)
      }
    } catch (err) {
      return null
    }
  }))
}
