import { getPagination } from "./pagination";

export class HTTPError extends Error {
  constructor(response) {
    super(response.statusText);
    this.name = this.constructor.name;
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(response.statusText).stack;
    }
    this.status = response.status;
  }
}

export class TextHTTPError extends HTTPError {
  constructor(response, data) {
    super(response);
    this.data = data;
  }
}

export class JSONHTTPError extends HTTPError {
  constructor(response, json) {
    super(response);
    this.json = json;
  }
}

export default class API {
  constructor(apiURL = '', options) {
    this.apiURL = apiURL;
    if (this.apiURL.match(/\/[^\/]?/)) { // eslint-disable-line no-useless-escape
      this._sameOrigin = true;
    }
    this.defaultHeaders = (options && options.defaultHeaders) || {};
  }

  headers(headers = {}) {
    return {
      ...this.defaultHeaders,
      "Content-Type": "application/json",
      ...headers
    };
  }

  parseJsonResponse(response) {
    return response.json().then(json => {
      if (!response.ok) {
        return Promise.reject(new JSONHTTPError(response, json));
      }

      const pagination = getPagination(response);
      return pagination ? { pagination, items: json } : json;
    });
  }

  request(path, options = {}) {
    const headers = this.headers(options.headers || {});
    if (this._sameOrigin) {
      options.credentials = options.credentials || "same-origin";
    }
    return fetch(this.apiURL + path, { ...options, headers }).then(response => {
      const contentType = response.headers.get("Content-Type");
      if (contentType && contentType.match(/json/)) {
        return this.parseJsonResponse(response);
      }

      if (!response.ok) {
        return response.text().then(data => {
          return Promise.reject(new TextHTTPError(response, data));
        });
      }
      return response.text().then(data => {
        data;
      });
    });
  }
}
