class Http404 extends Error {
  constructor(message) {
    super(message)

    this.name = 'Http404'
    this.statusCode = 404
  }

  toJSON() {
    return {
      code: this.statusCode,
      error: this.message || 'The requested resource was not found'
    }
  }
}

module.exports = {
  Http404
}
