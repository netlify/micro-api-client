import {getPagination} from './pagination';

class HTTPError extends Error {
  constructor(response) {
    super(response.statusText);
    this.name = this.constructor.name;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else { 
      this.stack = (new Error(message)).stack; 
    }
    this.status = response.status;
  }
}

class TextHTTPError extends HTTPError {
  constructor(response, data) {
    super(response);
    this.data = data;
  }
}

class JSONHTTPError extends HTTPError {
  constructor(response, json) {
    super(response)
    this.json = json;
  }
}

export { HTTPError, TextHTTPError, JSONHTTPError };

export default class API {
  constructor(apiURL) {
    this.apiURL = apiURL;
  }

  headers(headers = {}) {
    return {
      'Content-Type': 'application/json',
      ...headers
    };
  }

  parseJsonResponse(response) {
    return response.json().then((json) => {
      if (!response.ok) {
        return Promise.reject(new JSONHTTPError(response, json));
      }

      const pagination = getPagination(response);
      return pagination ? {pagination, items: json} : json;
    });
  }

  request(path, options = {}) {
    const headers = this.headers(options.headers || {});
    return fetch(this.apiURL + path, {...options, headers}).then((response) => {
      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.match(/json/)) {
        return this.parseJsonResponse(response);
      }

      if (!response.ok) {
        return response.text().then(data => {
          return Promise.reject(new TextHTTPError(response, data));
        });
      }
      return response.text().then((data) => {data});
    });
  }
}