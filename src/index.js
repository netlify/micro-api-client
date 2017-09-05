import {getPagination} from './pagination';

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
      const pagination = getPagination(response);
      return pagination ? {pagination, items: json} : json;
    });
  }

  request(path, options = {}) {
    const headers = this.headers(options.headers || {});
    return fetch(this.apiURL + path, {...options, headers}).then((response) => {
      if (!response.ok) {
        return response.text().then(data => {
          const err = new Error(data);
          err.status = response.status;
          return Promise.reject(err);
        });
      }

      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.match(/json/)) {
        return this.parseJsonResponse(response);
      }
      return response.text().then((data) => {data});
    });
  }
}
