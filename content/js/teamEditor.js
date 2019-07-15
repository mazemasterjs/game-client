const TEAM_URL = 'http://mazemasterjs.com/api/team';

/**
 * uuid generator ripped from stackoverflow
 */
function uuidv4() {
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Fill in any empty botId fields
 */
function fillEmptyBotIds() {
  const botIds = $('.botId');
  for (var x = 0; x < botIds.length; x++) {
    if (botIds[x].value === '') {
      botIds[x].value = uuidv4();
    }
  }
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
