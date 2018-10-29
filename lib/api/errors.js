class HttpError extends Error {
  constructor(message) {
    super(message)

    this.name = 'HttpError'
  }

  toJSON() {
    return {
      code: this.statusCode,
      error: this.message
    }
  }
}

class Http400 extends HttpError {
  constructor(message) {
    super(message || 'Bad Request')

    this.name = 'Http400'
    this.statusCode = 400
  }
}

class Http401 extends HttpError {
  constructor(message) {
    super(message || 'Unauthorized')

    this.name = 'Http401'
    this.statusCode = 401
  }
}

class Http403 extends HttpError {
  constructor(message) {
    super(message || 'Forbidden')

    this.name = 'Http403'
    this.statusCode = 403
  }
}

class Http404 extends Error {
  constructor(message) {
    super(message || 'The requested resource was not found')

    this.name = 'Http404'
    this.statusCode = 404
  }
}

module.exports = {
  Http400,
  Http401,
  Http403,
  Http404
}
