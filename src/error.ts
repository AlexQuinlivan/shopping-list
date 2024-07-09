export class HTTPError extends Error {
  declare status: number;

  constructor(status: number) {
    super(`HTTP Error ${status}`);
    this.status = status;
  }
}