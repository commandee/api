export default class APIError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.statusCode = statusCode;
  }

  static noResult(message: string, statusCode = 404) {
    return () => new APIError(message, statusCode);
  }
}
