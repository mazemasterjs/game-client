/**
 * uuid generator ripped from stackoverflow and modified
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
