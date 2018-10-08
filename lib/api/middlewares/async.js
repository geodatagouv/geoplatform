module.exports = middleware => async (req, res, next) => {
  try {
    await middleware(req, res, next)
  } catch (error) {
    next(error)
  }
}
