/** Lightweight typed HTTP error carried up to the error middleware. */
export class ApiError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    this.details = details
    this.expose = true
  }
  static badRequest(msg = 'Bad request', d) { return new ApiError(400, msg, d) }
  static unauthorized(msg = 'Unauthorized') { return new ApiError(401, msg) }
  static forbidden(msg = 'Forbidden') { return new ApiError(403, msg) }
  static notFound(msg = 'Not found') { return new ApiError(404, msg) }
  static conflict(msg = 'Conflict') { return new ApiError(409, msg) }
  static paymentRequired(msg = 'Upgrade required') { return new ApiError(402, msg) }
}

export default ApiError
