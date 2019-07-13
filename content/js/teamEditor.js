const TEAM_URL = 'http://mazemasterjs.com/api/team';

/**
 * Load all existing teams
 */
function loadTeams() {
  doAjax(TEAM_URL + '/get').then(data => {
    data.forEach(team => {
      console.log('Team ->', team.name);
    });
  });
}

/**
 * Fetches and returns content from the provided url using the
 * provided user auth token (btoa)
 *
 * @param {string} url The content url to request content from
 * @param {string} method Optional (default 'GET'), HTTP method to use
 * @param {string} data Optional, POJO Data to upload to the given url
 */
async function doAjax(url, method = 'GET', data = {}) {
  return $.ajax({
    url,
    data,
    dataType: 'json',
    method: method,
    contentType: 'application/json',
    headers: { Authorization: 'Basic ' + USER_CREDS },
  })
    .then(data => {
      switch (method) {
        case 'PUT':
        case 'DELETE': {
          return Promise.resolve(true);
        }
        default: {
          return Promise.resolve(data);
        }
      }
    })
    .catch(ajaxError => {
      return Promise.reject(ajaxError);
    });
}
