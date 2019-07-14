'use strict';

/* eslint-disable no-unused-vars */
const MAZE_URL = 'http://mazemasterjs.com/api/maze';
// const GAME_URL = 'http://game-server-maze-master-js.b9ad.pro-us-east-1.openshiftapps.com/game';
const GAME_URL = 'http://mazemasterjs.com/game';
// const GAME_URL = 'http://localhost:8080/game';
const TEAM_URL = 'http://mazemasterjs.com/api/team';

// global configuration vars
let botCallBackTimer = -1;
const CALLBACK_TIMEOUT = 3000;
const CALLBACK_DELAY = 0;
const FAIL_IMG_COUNT = 31;
const SUCC_IMG_COUNT = 31;
const QUIT_IMG_COUNT = 11;
const AJAX_TIMEOUT = 5000;
const TEXTLOG_MAX_CHILDREN = 250;
const DBG = true;

// eslint-disable-next-line prefer-const
let EMERGENCY_STOP_BUTTON_PUSHED = false; // set to true from index.html on STOP button press

// Game & Bot global tracking variables
let botCallback = null; // allows step/loop/debug modes to behave differently
let lastActionResult = null; // stores the last action result returned from the game server
let curGame = {}; // stores the current game data in memory, referenced by send/execute action
let totalMoves = 0; // track the total move count (accumulated via action/result moveCount )
let totalScore = 1000; // tracks total score (accumulated via action/result score)
let BOT_RAM = {}; // used to persist bot-data (memory) while step-running a bot

// user credentials
const USER_NAME = Cookies.get('userName');
const USER_CREDS = Cookies.get('userCreds');

// global data storage vars
let DATA_MAZES = [];
let DATA_TEAM = {};
let DATA_USER = {};
let DATA_BOT = {};

/**
 * Returns the number of object keys in BOT_RAM
 *
 * @return {number} The number of object keys found in BOT_RAM
 */
const getBotRamLength = () => {
  return Object.keys(BOT_RAM).length;
};

/**
 * Stringify and formaat return json string for cleaner action/engram rendering
 *
 * @param {JSONObject} obj
 * @return {string}
 */
const jsonToStr = obj => {
  return JSON.stringify(obj).replace(/\,\"/g, ', "');
};

/**
 * Load global game and user data elements
 */
async function loadData() {
  // load maze stubs
  $('#loadMsgBody').text('... loading game data');

  //
  // LOAD MAZES
  //
  if (DBG) console.log('loadData() -> Load maze stubs...');
  doAjax(MAZE_URL + '/get').then(mazes => {
    let opts = '';
    for (const maze of mazes) {
      opts = opts + `<option value="${maze.id}">${maze.name}</option>\n`;
    }
    $('#selMaze').html(opts);

    DATA_MAZES = mazes;
    if (DBG) console.log(`loadData(): ${DATA_MAZES.length} maze stubs loaded.`);
  });

  //
  // LOAD USER-SPECIFIC DATA
  //
  if (DBG) console.log('loadData() -> Load User: ' + USER_NAME);
  doAjax(TEAM_URL + '/get/user?userName=' + USER_NAME)
    .then(user => {
      DATA_USER = user[0];
      if (DBG) console.log('loadData() -> User Loaded.');
    })
    .then(() => {
      if (DBG) console.log('loadData() -> Load Team: ' + DATA_USER.teamId);
      doAjax(TEAM_URL + '/get?id=' + DATA_USER.teamId)
        .then(team => {
          DATA_TEAM = team[0];
          $('#userTeam').html(DATA_TEAM.name);
          if (DBG) console.log('loadData() -> Team Loaded.');
        })
        .then(() => {
          if (DBG) console.log('loadData() -> Find Bot: ' + DATA_USER.botId);
          DATA_BOT = DATA_TEAM.bots.find(bot => {
            return bot.id === DATA_USER.botId;
          });

          $('#userBot').html(DATA_BOT.name);
          if (DBG) console.log('loadData() -> Bot Found.', DATA_BOT);

          loadBotVersions(DATA_USER.botId, true);
        })
        .then(() => {
          //
          // LOAD ELEVATED USER DATA (if needed)
          //
          if (DATA_USER.role > USER_ROLES.USER) {
            if (DBG) console.log('loadData() -> All Teams.');
            doAjax(TEAM_URL + '/get').then(teams => {
              let opts = '';
              for (const team of teams) {
                opts = opts + `<option value="${team.id}"`;
                if (team.id === DATA_USER.teamId) {
                  opts = opts + ' selected="selected"';

                  // load bots for selected team
                  let botOpts = '';
                  for (const bot of team.bots) {
                    botOpts += `<option value="${bot.id}" name="${bot.name}"`;
                    if (bot.id === DATA_USER.botId) {
                      botOpts = botOpts + ' selected="selected"';
                      loadBotVersions(bot.id, false);
                    }
                    botOpts = botOpts + `>${bot.name}</option>\n`;
                  }
                  $('#selBot').html(botOpts);
                }
                opts = opts + `>${team.name}</option>\n`;
              }
              $('#selTeam').html(opts);
            });

            // $('.adminControl').css('visibility', 'visible');
            $('#adminSelects').css('visibility', 'visible');
          }
        })
        .then(() => {
          $('#loadingDialog').dialog('close');
          setBotButtonStates(true);
        });
    });
}

/**
 * Loads bot values into controls for given team
 * @param {*} teamId
 */
async function loadBots(teamId) {
  const BOT_GET_URL = `${TEAM_URL}/get?id=${teamId}`;
  if (DBG) console.log('loadBots() -> ', teamId, BOT_GET_URL);

  if (!teamId) return;

  return $.ajax({
    url: BOT_GET_URL,
    dataType: 'json',
    method: 'GET',
    headers: { Authorization: 'Basic ' + USER_CREDS },
  })
    .then(data => {
      const team = data[0];
      const botSel = [];
      for (const bot of team.bots) {
        botSel.push(`<option value='${bot.id}'>${bot.name}</option>`);
      }
      $('#selBot').html(botSel.join());
      $('#selBot').change();
    })
    .catch(error => {
      logMessage('err', 'ERROR LOADING BOTS', error.status !== 0 ? `${error.status} - ${error.statusText}` : undefined);
    })
    .done(() => {
      loadBotVersions($('#selBot :selected').val());
    });
}

/**
 * Scroll to the bottom of the textLog window
 */
function scrollToBottom() {
  $('#textLog').scrollTop($('#textLog')[0].scrollHeight);
}

/**
 * Resets global tracking variables
 */
function resetGlobals() {
  curGame = {};
  BOT_RAM = {};
  botCallback = null;
  totalMoves = 0;
  totalScore = 1000;
  clearInterval(botCallBackTimer);
  setBotButtonStates(true);
}

/**
 * Loads maze data into local controls
 * @return {Promise}
 */
function loadMazes() {
  return doAjax(`${MAZE_URL}/get`);
}

/**
 * Populates the version select control with all versions available for the given bot
 * @param {*} botId
 * @param {*} autoLoadBot
 * @return {void}
 */
function loadBotVersions(botId, autoLoadBot = true) {
  $('#loadMsgBody').text('... collecting versions for bot ' + botId);

  const BOT_CODE_URL = TEAM_URL + '/get/botCode?botId=' + botId;
  if (DBG) console.log('loadBotVersions() -> ', botId, autoLoadBot);

  return $.ajax({
    url: BOT_CODE_URL,
    dataType: 'json',
    method: 'GET',
    headers: { Authorization: 'Basic ' + USER_CREDS },
  })
    .then(docs => {
      const opts = [];
      for (const doc of docs.reverse()) {
        opts.push(`<option value="${doc.version}">${doc.version}</option>\n`);
      }
      $('#selBotVersion').html(opts.join());

      if (autoLoadBot) {
        loadBotCode(botId);
      }
    })
    .catch(lbvError => {
      if (lbvError.status === 404) {
        if (DBG) console.log('loadBotVersions() -> No versions found, auto-generating v0.0.1.');
        versionBotCode(botId, editor.getValue());
      } else {
        logMessage('err', `ERROR LOADING BOT CODE`, `Cannot load code for bot <b>${botId}</b> - ${lbvError.status} (${lbvError.statusText})`);
      }
    });
}

/**
 * Delete teh specified code version for the given botId
 *
 * @param {*} botId
 * @param {*} version
 */
function deleteBotCodeVersion(botId, version) {
  const DELETE_BOT_CODE_URL = TEAM_URL + `/delete/botCode/${botId}/${version}`;
  $.ajax({
    url: DELETE_BOT_CODE_URL,
    dataType: 'json',
    method: 'DELETE',
    headers: { Authorization: 'Basic ' + USER_CREDS },
  })
    .then(() => {
      logMessage('wrn', `BOT CODE v${version} DELETED`);
    })
    .catch(error => {
      logMessage('err', `ERROR DELETING BOT CODE v${version}`, error.message === undefined ? `${error.status} - ${error.statusText}` : error.message);
    });
}

/**
 * Loads the version of bot  code associated with botId.version - if no
 * version is provided, loads the latest version instead
 *
 * @param {*} botId
 * @param {*} version
 * @return {void}
 */
function loadBotCode(botId, version) {
  let BOT_CODE_URL = TEAM_URL + '/get/botCode?botId=' + botId;

  // if no version supplied, assume we're getting the latest version
  if (version === undefined) {
    version = -1;
  } else {
    BOT_CODE_URL += `&version=${version}`;
  }

  console.log('loadBotCode', botId, version, BOT_CODE_URL);

  return $.ajax({
    url: BOT_CODE_URL,
    dataType: 'json',
    method: 'GET',
    headers: { Authorization: 'Basic ' + USER_CREDS },
  })
    .then(docs => {
      // if no version given, find the higest version returned
      if (version === -1) {
        version = docs.sort((first, second) => {
          return parseInt(second.version.replace(/\./g, '')) - parseInt(first.version.replace(/\./g, ''));
        })[0].version;
      }

      $('#loadMsgBody').text(`... loading ${$('#selBot :selected').val()} v${version}`);

      // now load the version
      const botCode = docs.find(doc => {
        return doc.version === version;
      });

      if (botCode !== undefined) {
        $('#selBotVersion').val(botCode.version);
        const date = new Date(botCode.lastUpdated);

        let botName = DATA_BOT.name;
        if (DATA_USER.role > USER_ROLES.USER && DATA_USER.botId !== $('#selBot :selected').text()) {
          botName = $('#selBot :selected').text();
        }

        logMessage(
          'log',
          `"${botName}" v${botCode.version} Loaded.`,
          `"${botName}" v${botCode.version} was last saved on ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}.`,
        );

        // load the code into the editor
        $('#loadMsgBody').text(`... gently placing ${$('#selBot :selected').val()} v${version} into the editor`);
        editor.setValue(botCode.code);

        // and format the code once that's done
        $('#loadMsgBody').text(`... violently formatting ${$('#selBot :selected').val()} v${version}'s syntax`);
        editor.trigger('', 'editor.action.formatDocument');

        setSaveButtonStates(false);
        setBotButtonStates(true);
      } else {
        logMessage('wrn', 'BOT CODE NOT FOUND');
      }

      $('#loadMsgBody').text(`...finally done with all this prep. LET'S CODE!`);
      $('#loadingDialog').dialog('close');
    })
    .catch(codeLoadError => {
      logMessage(
        'err',
        `ERROR LOADING BOT CODE &rsaquo; ${codeLoadError.status} (${codeLoadError.statusText})`,
        `Cannot load code for bot&nbsp;<b>${botId}.</b>`,
      );
    });
}

/**
 * Generates a new version of the bot's code and stores it in
 * the bot_code collection.
 *
 * @param {*} botId
 * @param {*} version
 * @param {*} code
 * @return {void}
 */
function updateBotCode(botId, version, code) {
  const putUrl = TEAM_URL + '/update/botCode';

  // first, format the code in the editor
  editor.trigger('', 'editor.action.formatDocument');

  $.ajax({
    url: putUrl,
    dataType: 'json',
    timeout: AJAX_TIMEOUT,
    method: 'PUT',
    headers: { Authorization: 'Basic ' + USER_CREDS },
    data: {
      botId: botId,
      version: version,
      code,
    },
  })
    .then(() => {
      let botName = DATA_BOT.name;
      if (DATA_USER.role > USER_ROLES.USER && DATA_USER.botId !== $('#selBot :selected').val()) {
        botName = $('#selBot :selected').text();
      }

      logMessage('bot', `"${botName}" v<b>${version}</b>&nbsp;- Updated.`);
      setSaveButtonStates(false);
    })
    .catch(error => {
      logMessage('err', 'ERROR UPDATING BOT CODE', JSON.stringify(error));
    });
  // .done(() => {
  //   loadBotVersions(botId, false);
  // });
}

/**
 * Calculate and return the next mock-version number
 *
 * @param {*} version
 * @return {string}
 */
function getNextVersion(version) {
  const curVer = version.split('.');
  if (parseInt(curVer[2]) === 9) {
    curVer[2] = 0;
    if (parseInt(curVer[1]) === 9) {
      curVer[1] = 0;
      curVer[0] = parseInt(curVer[0]) + 1;
    } else {
      curVer[1] = parseInt(curVer[1]) + 1;
    }
  } else {
    curVer[2] = parseInt(curVer[2]) + 1;
  }

  return curVer.join('.');
}

/**
 * Generates a new version of the bot's code and stores it in
 * the bot_code collection.
 *
 * @param {*} botId
 * @param {*} code
 * @return {void}
 */
function versionBotCode(botId, code) {
  const GET_BOT_CODE_URL = TEAM_URL + '/get/botCode?botId=' + botId;
  const PUT_BOT_CODE_URL = TEAM_URL + '/insert/botCode';

  // first, format the code in the editor
  editor.trigger('', 'editor.action.formatDocument');

  $.ajax({
    url: GET_BOT_CODE_URL,
    dataType: 'json',
    timeout: AJAX_TIMEOUT,
    method: 'GET',
    headers: { Authorization: 'Basic ' + USER_CREDS },
  })
    .then(docs => {
      const topVersion = docs.sort((first, second) => {
        return parseInt(second.version.replace(/\./g, '')) - parseInt(first.version.replace(/\./g, ''));
      })[0].version;

      const newVersion = getNextVersion(topVersion);

      $.ajax({
        url: PUT_BOT_CODE_URL,
        dataType: 'json',
        timeout: AJAX_TIMEOUT,
        method: 'PUT',
        headers: { Authorization: 'Basic ' + USER_CREDS },
        data: {
          botId: botId,
          version: newVersion,
          code,
        },
      })
        .then(() => {
          let botName = DATA_BOT.name;
          if (DATA_USER.role > USER_ROLES.USER && DATA_USER.botId !== $('#selBot :selected').val()) {
            botName = $('#selBot :selected').text();
          }

          logMessage('bot', `"${botName}" v<b>${newVersion}</b>&nbsp;- New Version Saved.`);
          setSaveButtonStates(false);
        })
        .catch(error => {
          if (error.status !== 404) {
            logMessage('err', 'ERROR SAVING BOT', `${error.status} - ${error.statusText}`);
          }
        })
        .done(() => {
          loadBotVersions(botId, false);
        });
    })
    .catch(() => {
      $.ajax({
        url: PUT_BOT_CODE_URL,
        dataType: 'json',
        timeout: AJAX_TIMEOUT,
        method: 'PUT',
        headers: { Authorization: 'Basic ' + USER_CREDS },
        data: {
          botId: botId,
          version: '0.0.1',
          code,
        },
      })
        .then(() => {
          logMessage('bot', `${$('selBot').text()}&nbsp;<b>v0.0.1</b>&nbsp;Initialized!`);
          if ($('#selBotVersion').children().length === 0) {
            $('#selBotVersion').append(`<option value="${botId}">0.0.1</option>`);
          }
        })
        .catch(error => {
          logMessage('err', 'ERROR INITIALIZING BOT', `${error.status} - ${error.statusText} initializing bot&nbsp;<b>${botId}</span>`);
        });
    });
}

/**
 * Adds a formatted message to the output log.
 *
 * @param {*} source log | bot | wrn | err
 * @param {*} header The contents of the header section
 * @param {*} message The contents of the body section
 * @return {void}
 */
function logMessage(source, header, message) {
  const textLog = $('#textLog');
  const hdr = `logHdr ${source}MsgHdr`;
  const bdy = `logBdy ${source}MsgBdy autoScroll`;

  // build the html content
  let htmlOut = `<h3 class="${hdr}">${header}</h3>`;

  if (message !== undefined) {
    if (source === 'err') {
      htmlOut += `<div class="${bdy}"><pre class='autoScroll'>${message}</pre></div>`;
    } else {
      htmlOut += `<div class="${bdy}">${message}</div>`;
    }
  } else {
    htmlOut += `<div class="${bdy}"></div>`;
  }

  // added it to the log and update display
  textLog.append(htmlOut);

  // prune the text log from the top down to avoid choking the browser to death
  while (textLog[0].children.length > TEXTLOG_MAX_CHILDREN) {
    textLog[0].children[0].remove();

    // don't leave a content section stranded
    if (textLog[0].children.length > 0 && textLog[0].children[0].tagName !== 'H3') {
      textLog[0].children[0].remove();
    }
  }
}

/**
 * Attempts to create a new MMJS Game
 *
 * @param {boolean} autoPlay - optional, if true will not reset all globals
 * @return {void}
 */
async function startGame(autoPlay = false) {
  const mazeId = $('#selMaze').val();
  let teamId = DATA_USER.teamId;
  let botId = DATA_USER.botId;

  if (DATA_USER.role > USER_ROLES.USER && DATA_USER.teamId === $('#selTeam :selected').val()) {
    teamId = $('#selTeam :selected').val();
  }

  if (DATA_USER.role > USER_ROLES.USER && DATA_USER.botId === $('#selBot :selected').val()) {
    botId = $('#selBot :selected').val();
  }

  const NEW_GAME_URL = GAME_URL + '/new/' + mazeId + '/' + teamId + '/' + botId;

  return await $.ajax({
    url: NEW_GAME_URL,
    dataType: 'json',
    timeout: AJAX_TIMEOUT,
    method: 'PUT', // method is any HTTP method
    headers: { Authorization: 'Basic ' + USER_CREDS },
    data: {},
  })
    .then(gameData => {
      // log game creation
      logMessage('log', 'Game Created', `gameId ->${gameData.game.gameId}`);

      // reset appropriate logs and globals
      if (!autoPlay) {
        $('#textLog').empty();
        $('#actionLog').empty();
        resetGlobals();
        totalScore = totalScore + gameData.totalScore;
        totalMoves = gameData.game.score.moveCount;
      } else {
        BOT_RAM = {};
        totalScore = totalScore + gameData.totalScore;
        totalMoves = totalMoves + gameData.game.score.moveCount;
      }

      // set global refs to new game data
      curGame = gameData.game;
      lastActionResult = gameData;

      if (DBG) {
        console.log('startGame() : curGame set.', curGame);
        console.log('startGame() : lastActionResult set.', lastActionResult);
      }

      // load the minimap
      scaleMiniMap(faceAvatar(gameData.action.outcomes[gameData.action.outcomes.length - 1], DIRS.SOUTH));

      // and display the most recent action (new game action)
      renderAction(gameData);

      // return the new game id
      return Promise.resolve(curGame.gameId);
    })
    .catch(ngErr => {
      console.error('startGame() ngErr -> ', ngErr);
      return Promise.reject(ngErr);
    });
}

/**
 * Attempts to load an existing MMJS game from the given gameId
 *
 * @param {*} gameId
 */
async function loadGame(gameId) {
  const LOAD_GAME_URL = GAME_URL + `/get/${gameId}`;
  if (DBG) {
    console.log('loadGame', LOAD_GAME_URL);
  }

  return await $.ajax({
    url: LOAD_GAME_URL,
    dataType: 'json',
    timeout: AJAX_TIMEOUT,
    method: 'GET', // method is any HTTP method
    headers: { Authorization: 'Basic ' + USER_CREDS },
    data: {},
  })
    .then(data => {
      resetGlobals();
      if (DBG) {
        console.log('loadGame() : curGame set.', data.game);
      }
      curGame = data.game;
      totalScore = data.totalScore;
      totalMoves = data.game.score.moveCount;
      lastActionResult = data;

      // render the game action
      renderAction(data);

      // load the minimap
      const mapText = faceAvatar(data.action.outcomes[data.action.outcomes.length - 1], data.playerFacing);
      scaleMiniMap(mapText);

      return Promise.resolve(data.game);
    })
    .catch(loadError => {
      console.error('loadGame', loadError);
      logMessage('err', 'ERROR LOADING GAME', loadError.status !== 0 ? `${loadError.status} - ${loadError.statusText}` : undefined);
      return Promise.reject(loadError);
    });
}

/**
 * Attempts to quit the current game in progress
 *
 * @param {*} gameId
 */
async function quitGame() {
  if (!curGame || curGame.gameId === undefined) {
    logMessage('wrn', 'QUIT WHAT, EXACTLY?', "You aren't currently connected to a game. Try to Run, Step, or Debug your bot to start (or resume) a game.");
    return;
  }
  const QUIT_GAME_URL = GAME_URL + `/abandon/${curGame.gameId}`;

  if (DBG) console.log('quitGame', QUIT_GAME_URL);

  // clear logs and miniMap first
  curGame = null;

  // $('#textLog').empty();
  // $('#actionLog').empty();
  // $('#miniMapContent').empty();

  await $.ajax({
    url: QUIT_GAME_URL,
    dataType: 'json',
    timeout: AJAX_TIMEOUT,
    method: 'DELETE', // method is any HTTP method
    headers: { Authorization: 'Basic ' + USER_CREDS },
  })
    .then(data => {
      if (DBG) console.log('quitGame, successful.');
      logMessage('wrn', `GAME ABANDONED`, `You successfully abandoned game #${data.gameId}. ${getEndGameImg('quit')}`);
    })
    .catch(quitError => {
      console.error('quitGame', quitError);
      logMessage('err', 'ERROR QUITTING GAME', quitError.status !== 0 ? `${quitError.status} - ${quitError.statusText}` : undefined);
    });
}

/**
 * Ensures prerequisites are met and in place before actually attempting to
 * execute the bot's code via runBot()
 *
 * @param {*} stepBot - if true, starts the bot without a callback parameter
 * @param {*} debugBot - adds/removes debugger; lines in bot code, as needed
 *
 */
async function startBot(stepBot = true, debugBot = false) {
  if (DBG) console.log('runBot(stepBot, debugBot)', stepBot, debugBot);
  setBotButtonStates(false);
  const botCode = editor.getValue();

  // validate and report errors - if any are found, do not continue
  if (!validateSyntax()) {
    setBotButtonStates(true);
    return;
  }

  // save any outstanding changes when run
  if ($('#btnSaveBotCode').hasClass('btnEnabled')) {
    let botId = DATA_USER.botId;

    // admin botId select override
    if (DATA_USER.role > USER_ROLES.USER && DATA_USER.botId !== $('#selBot :selected').val()) {
      botId = $('#selBot :selected').val();
    }

    // don't update on debug - break points cause the ajax call to timeout
    if (!debugBot) {
      updateBotCode(botId, $('#selBotVersion :selected').val(), botCode);
    }
  }

  // make sure there's some code to run
  if (botCode.trim() === '') {
    logMessage('err', 'NO CODE TO RUN', 'Your bot code editor appears to be empty. You must write some code before you can run it!');
    setBotButtonStates(true);
    return;
  }

  // if we don't have curGame.gameId or lastActionResult, we'll need to start/resume a game before proceeding
  if (!curGame || !lastActionResult || curGame.gameId === undefined) {
    await startGame()
      .then(gameData => {
        if (DBG) console.log('startBot() -> New game started. gameData.gameId=' + gameData.gameId);
      })
      .catch(async ngErr => {
        if (ngErr && ngErr.responseJSON && ngErr.responseJSON.gameId) {
          logMessage('wrn', 'GAME IN PROGRESS - RESUMING', `Let's pick up where you left off. Good luck!`);
          await loadGame(ngErr.responseJSON.gameId)
            .then(gameData => {
              if (DBG) console.log('startBot() -> Game in progress, resuming game. gameData.gameId=' + gameData.gameId);
            })
            .catch(rgErr => {
              logMessage('err', 'ERROR RESUMING GAME', rgErr.responseText ? rgErr.responseText : 'Check console log for details.');
              console.error('startBot() -> Unable to resume game. rgErr -> ', rgErr);
            });
        } else {
          logMessage('err', 'ERROR STARTING GAME', ngErr.responseText ? ngErr.responseText : 'Check console log for details.');
          console.error('startBot() -> Unable to resume game. rgErr -> ', ngErr);
        }
      });
  }

  // check once more to make sure everything is in order before calling the bot
  // any errors will have previously been logged
  if (curGame && lastActionResult && curGame.gameId !== undefined) {
    // everything appears to be in place, so go ahead and run the bot
    console.log('startBot -> calling runBot', curGame);
    runBot(botCode, stepBot, debugBot);
  } else {
    setBotButtonStates(true);
  }
}

/**
 * After startBot() makes sure a game is in order, runBot() actually preps and
 * executes the bot's code.
 *
 * @param {string} botCode - the bot code to run
 * @param {boolean} stepBot - if true, starts the bot without a callback parameter
 * @param {boolean} debugBot - adds/removes debugger; lines in bot code, as needed
 * @return {any}
 *
 */
async function runBot(botCode, stepBot, debugBot) {
  if (DBG) console.log('runBot', botCode.length, stepBot, debugBot);
  const injectTag = ' // @INJECTED\n';
  const strictScript = '"use strict";' + injectTag;
  const gdDeclareScript = 'let GameData = {};' + injectTag;
  const debugStart = `\nbotCallback = null;${injectTag}\ngoBot(reformatData(lastActionResult));${injectTag}`;
  const stepStart = `\nbotCallback = null;${injectTag}\ngoBot(reformatData(lastActionResult));${injectTag}`;
  const loopStart = `\nbotCallback = goBot;${injectTag}\ngoBot(reformatData(lastActionResult))${injectTag}`;
  const gdMapScript = '\nObject.assign(GameData, data);' + injectTag;
  const debugScript = '\ndebugger;' + injectTag;

  // inject script values appropriate to the run time selected
  const insKey = 'function goBot(data) {';
  const insAt = botCode.indexOf(insKey);
  const bcTop = botCode.substr(0, insAt + insKey.length);
  const bcBot = botCode.substr(insAt + insKey.length);
  if (debugBot) {
    botCode = bcTop + gdMapScript + debugScript + bcBot;
    botCode = botCode + debugStart;
  } else if (stepBot) {
    botCode = bcTop + gdMapScript + bcBot;
    botCode = botCode.replace(/debugger;/g, '');
    botCode = botCode + stepStart;
  } else {
    botCode = bcTop + gdMapScript + bcBot;
    botCode = botCode.replace(/debugger;/g, '');
    botCode = botCode + loopStart;
  }

  // force use of strict mode
  if (botCode.indexOf('"use strict";') === -1) {
    botCode = strictScript + gdDeclareScript + botCode;
  } else {
    botCode = gdDeclareScript + botCode;
  }

  try {
    // convert the bot text to a js function
    if (DBG) console.log(`runBot(${stepBot}, ${debugBot}) : Creating botFn, botCode ->`, '\n' + botCode);
    const botFn = new Function(botCode);
    clearInterval(botCallBackTimer);
    botCallBackTimer = setInterval(callbackTimeout, CALLBACK_TIMEOUT); // safety check for bots that fall out of the function (or get stuck) before sending an action
    botFn();
  } catch (botCodeErr) {
    console.error(`runBot(${stepBot}, ${debugBot}) : Error running bot. botBuildErr -> `, botCodeErr);
    logMessage('err', `BOT CODE ERROR<br />-= ${botCodeErr.message} =-`, botCodeErr.stack);
  }
}

/**
 * Sends the given action to the game server to be processed
 * and returns the resulting data
 *
 * @param {*} action
 */
async function executeAction(action) {
  if (DBG) console.log('executeAction', action);

  const GAME_ACTION_URL = GAME_URL + '/action';

  return await $.ajax({
    url: GAME_ACTION_URL,
    method: 'PUT',
    dataType: 'json',
    headers: { Authorization: 'Basic ' + USER_CREDS },
    data: action,
  })
    .then(data => {
      renderAction(data);
      return Promise.resolve(data);
    })
    .catch(putError => {
      return Promise.reject(putError);
    });
}

/**
 * Renders the given action result
 *
 * @param {*} result
 */
async function renderAction(result) {
  if (DBG) {
    console.log('renderAction', result);
  }
  const action = result.action;
  const engram = action.engram;

  let logMsg = '<div class="actionBody">';

  logMsg += `Command: <b>${getObjValName(COMMANDS, action.command)}</b>&nbsp;&nbsp[&nbsp;${action.command}&nbsp;]<br>`;
  logMsg += `Direction: <b>${getObjValName(DIRS, action.direction)}</b>&nbsp;&nbsp[&nbsp;${action.direction}&nbsp;]<br>`;
  if (action.message !== '') logMsg += `Message: <b>${action.message}</b><br>`;
  logMsg += `Player State(s): ${getSelectedValueNames(PLAYER_STATES, result.playerState)}<br>`;
  logMsg += `Player Facing: <b>${getObjValName(DIRS, result.playerFacing)}</b>&nbsp;&nbsp[&nbsp;${result.playerFacing}&nbsp;]<br>`;

  // add outcomes to the log
  if (action.outcomes.length > 1) {
    logMsg += 'Outcomes:<br />';
    for (let pos = 0; pos < action.outcomes.length - 1; pos++) {
      logMsg += `&nbsp;&nbsp;&nbsp;&nbsp;<b>${pos}:</b>&nbsp;${action.outcomes[pos]}<br />`;
    }
    logMsg += '<hr>';
  }

  // grab the current millis time as an action/engram ID
  const actId = Date.now();

  // log the local "here" engram
  logMsg += `<div id="${actId}_HERE" class="engramContainer" onclick="toggleEngramContent('${actId}_HERE');">`;
  logMsg += `  <h5><span id="${actId}_HERE_icon" class="ui-icon ui-icon-plus"></span>data.engram.<b>here</b></h5>`;
  logMsg += `  <p class='engramData' style="display:none"><b>.exitNorth=</b>${jsonToStr(engram.here.exitNorth)}</p>`;
  logMsg += `  <p class='engramData' style="display:none"><b>.exitSouth=</b>${jsonToStr(engram.here.exitSouth)}</p>`;
  logMsg += `  <p class='engramData' style="display:none"><b>.exitEast=</b>${jsonToStr(engram.here.exitEast)}</p>`;
  logMsg += `  <p class='engramData' style="display:none"><b>.exitWest=</b>${jsonToStr(engram.here.exitWest)}</p>`;
  logMsg += `  <p class='engramData' style="display:none"><b>.messages=</b>${jsonToStr(engram.here.messages)}</p>`;
  logMsg += `  <p class='engramData' style="display:none"><b>.intuition=</b>${jsonToStr(engram.here.intuition)}</p>`;
  logMsg += `</div>`;

  // log directional engrams
  for (const dir in DIRS) {
    if (DIRS[dir] >= DIRS.NORTH && DIRS[dir] <= DIRS.WEST) {
      logMsg += `<div id="${actId}_${dir}" class="engramContainer" onclick="toggleEngramContent('${actId}_${dir}');">`;
      logMsg += `  <h5><span id="${actId}_${dir}_icon" class="ui-icon ui-icon-plus"></span>data.engram.<b>${dir.toLowerCase()}</b></h5>`;
      logMsg += `  <p class='engramData' style="display:none"><b>.see=</b>${jsonToStr(engram[dir.toLowerCase()].see)}</p>`;
      logMsg += `  <p class='engramData' style="display:none"><b>.hear=</b>${jsonToStr(engram[dir.toLowerCase()].hear)}</p>`;
      logMsg += `  <p class='engramData' style="display:none"><b>.smell=</b>${jsonToStr(engram[dir.toLowerCase()].smell)}</p>`;
      logMsg += `  <p class='engramData' style="display:none"><b>.feel=</b>${jsonToStr(engram[dir.toLowerCase()].feel)}</p>`;
      logMsg += `  <p class='engramData' style="display:none"><b>.taste=</b>${jsonToStr(engram[dir.toLowerCase()].taste)}</p>`;
      logMsg += `</div>`;
    }
  }
  logMsg += '</div>';

  // track total move count and score
  totalMoves += action.moveCount;
  totalScore += action.score;

  // now dump it all in the log
  logMessage('log', `Move ${totalMoves} | Score ${totalScore} ${getCommandIcon(action.command)}${getDirectionIcon(action.direction)}`, logMsg);

  // log the game results if game has ended
  let textMap;
  if (result.game.score.gameResult !== GAME_RESULTS.IN_PROGRESS) {
    let win = false;
    let msg = 'GAME OVER';

    // present game over cues
    switch (result.game.score.gameResult) {
      case GAME_RESULTS.DEATH_LAVA:
        msg += ' - You stepped into the lava.';
        logMessage('err', msg, getEndGameImg('fail'));
        break;
      case GAME_RESULTS.DEATH_TRAP:
        msg += ' - You hit a trap.';
        logMessage('err', msg, getEndGameImg('fail'));
        break;
      case GAME_RESULTS.OUT_OF_MOVES:
        msg += ' - You ran out of moves.';
        logMessage('err', msg, getEndGameImg('fail'));
        break;
      case GAME_RESULTS.WIN:
        win = true;
        msg += ' - You won!';
        logMessage('win', msg, getEndGameImg('win'));
        break;
      case GAME_RESULTS.WIN_FLAWLESS:
        win = true;
        msg += ' - You won... FLAWLESS VICTORY!';
        logMessage('win', msg, getEndGameImg('win'));
        break;
      default:
        msg += ' - You lost somehow... gameResult=' + result.game.score.gameResult;
        logMessage('err', msg, getEndGameImg('fail'));
    }

    // if we win in full-auto mode, start the next maze automatically
    if (win && botCallback !== null) {
      let idx = $('#selMaze :selected').index();
      const selMaze = $('#selMaze');
      const kids = selMaze.children();
      const max = kids.length - 1;

      if (idx < max) {
        idx++;
        while (kids[idx].value.toLowerCase().indexOf('debug') > -1) {
          logMessage('wrn', 'Skipping debug maze: ' + kids[idx].value);
          idx++;
          if (idx >= kids.length - 1) {
            break; // reached the end of the maze list
          }
        }

        // load the next maze if we're not at the end
        if (idx < max) {
          selMaze.children()[idx].selected = true;
          await startGame(true).then(() => {
            startBot(false, false);
          });
        }
      }
    } else if (win) {
      // game is over - end of maze list
      logMessage('win', 'End of maze list - CONGRATULATIONS!');
      resetGlobals();
    } else {
      resetGlobals();
    }

    // TODO: RE-ENABLE FOR CAMP!!

    // if ($('#miniMapContent').css('display') !== 'none') {
    //   // set a nifty ascii on the minimap
    //   if (win) {
    //     scaleMiniMap(cheesy);
    //   } else {
    //     scaleMiniMap(skully);
    //   }

    //   // toggle hide/show to reset map dimensions
    //   $('#miniMapContent').hide();
    //   $(':root').css('--miniMapFontSize', '0.4rem');
    //   $('#miniMap').css('height', 'var(--miniMapBaseSize)rem');
    //   $('#miniMap').css('width', 'var(--miniMapBaseSize)rem');
    //   $('#miniMapContent').show();
    // }
  } else {
    textMap = faceAvatar(action.outcomes[action.outcomes.length - 1], result.playerFacing);
    const mmcPre = $('#miniMapContent > pre');
    if (mmcPre.length === 0) {
      scaleMiniMap(textMap);
    } else {
      mmcPre.text(textMap);
    }
  }
}

/**
 * Randomly selectes an image from the images/success folder
 *
 * @param {string} imgType - quit, fail, or win
 * @return {string}
 */
function getEndGameImg(imgType) {
  let maxImgNum = 0;
  let folder = '';
  switch (imgType) {
    case 'quit': {
      maxImgNum = QUIT_IMG_COUNT;
      folder = 'quit';
      break;
    }
    case 'fail': {
      folder = 'fail';
      maxImgNum = FAIL_IMG_COUNT;
      break;
    }
    case 'win': {
      folder = 'win';
      maxImgNum = SUCC_IMG_COUNT;
      break;
    }
  }

  const imgNum = Math.floor(Math.random() * maxImgNum);
  return `<div class='gameOverImgContainer'><img class='gameOverImg' src='http://mazemasterjs.com/media/images/${folder}/${imgNum}.gif' onload='scrollToBottom();' /></div>`;
}

/**
 * Generate and return an HTML element with a ui-icon representation of
 * the given command.
 *
 * @param {*} command
 * @return {string}
 */
function getCommandIcon(command) {
  switch (command) {
    case COMMANDS.NONE:
      return '<div class="ui-icon ui-icon-cancel" title="No Command"></div>';
    case COMMANDS.FACE:
      return '<div class="ui-icon ui-icon-refresh" title="Face"></div>';
    case COMMANDS.LISTEN:
      return '<div class="ui-icon ui-icon-volume-on" title="Listen"></div>';
    case COMMANDS.LOOK:
      return '<div class="ui-icon ui-icon-search" title="Look"></div>';
    case COMMANDS.SIT:
      return '<div class="ui-icon ui-icon-arrowstop-1-s" title="Sit"></div>';
    case COMMANDS.SNIFF:
      return '<div class="ui-icon ui-icon-caret-2-e-w" title="Sniff"></div>';
    case COMMANDS.STAND:
      return '<div class="ui-icon ui-icon-arrowstop-1-n" title="Stand"></div>';
    case COMMANDS.TURN:
      return '<div class="ui-icon ui-icon-refresh" title="Turn"></div>';
    case COMMANDS.MOVE:
      return '<div class="ui-icon ui-icon-transfer-e-w" title="Move"></div>';
    case COMMANDS.JUMP:
      return '<div class="ui-icon ui-icon-eject" title="Jump"></div>';
    case COMMANDS.WAIT:
      return '<div class="ui-icon ui-icon-clock" title="Wait"></div>';
    case COMMANDS.WRITE:
      return '<div class="ui-icon ui-icon-pencil" title="Write"></div>';
    case COMMANDS.QUIT:
      return '<div class="ui-icon ui-icon-power" title="Quit"></div>';
  }
  return '';
}

/**
 * Generate and return an HTML element with a ui-icon representation of
 * the given direction.
 *
 * @param {*} direction
 * @return {string}
 */
function getDirectionIcon(direction) {
  switch (direction) {
    case DIRS.NONE:
      return '<div class="ui-icon ui-icon-arrow-4-diag" title="No Direction"></div>';
    case DIRS.NORTH:
      return '<div class="ui-icon ui-icon-triangle-1-n" title="North"></div>';
    case DIRS.SOUTH:
      return '<div class="ui-icon ui-icon-triangle-1-s" title="South"></div>';
    case DIRS.EAST:
      return '<div class="ui-icon ui-icon-triangle-1-e" title="East"></div>';
    case DIRS.WEST:
      return '<div class="ui-icon ui-icon-triangle-1-w" title="West"></div>';
    case DIRS.LEFT:
      return '<div class="ui-icon ui-icon-arrowrefresh-1-w" title="Left"></div>';
    case DIRS.RIGHT:
      return '<div class="ui-icon ui-icon-arrowrefresh-1-e" title="Right"></div>';
  }
  return '';
}

/**
 * If there are error markers on the editor, enumerate as HTML log them.
 *
 * @return {boolean}
 */
function validateSyntax() {
  const markers = monaco.editor.getModelMarkers();

  if (markers.length > 0) {
    let msg = '<span class="botCodeError">';
    for (const marker of markers) {
      msg += `Line <b>${marker.endLineNumber}</b>, Column <b>${marker.endColumn}</b>: ${marker.message}<br>`;
    }
    msg += '</span>';
    logMessage('err', 'BOT CODE HAS ERRORS', msg);
  }

  return markers.length === 0;
}

/**
 * Toggles warning queue css classes when sytnax errors exist
 *
 * @param {*} enabled
 * @return {void}
 */
function setWarningCues(enabled) {
  if (enabled) {
    $('#editor').addClass('codeWarnings');
  } else {
    $('#editor').removeClass('codeWarnings');
  }
}

//
/**
 * Returns the key name of the given for an iterable
 *
 * @param {*} obj
 * @param {*} val
 * @return {string}
 */
function getObjValName(obj, val) {
  for (const item in obj) {
    if (obj[item] === val) {
      return item;
    }
  }
}

/**
 * A list of all selected values in a bitwise iterable
 *
 * @param {*} obj
 * @param {*} val
 * @return {array}
 */
function getSelectedValueNames(obj, val) {
  const vals = [];
  for (const item in obj) {
    if (!!(obj[item] & val)) {
      vals.push(`<b>${item}</b>&nbsp;&nbsp[&nbsp;${obj[item]}&nbsp;]`);
    }
  }
  return vals.join(', ');
}

/**
 * Scale the minimap content to best fit the conteainer size
 *
 * @param {*} textRender
 */
function scaleMiniMap(textRender = '') {
  const mm = $('#miniMap');
  const mmc = $('#miniMapContent');
  const pre = $('#miniMapContent > pre');
  let rows;
  let cols;

  // make sure there's something to scale first and that we're
  if (textRender === '' && pre.length === 0) {
    return;
  }

  //   if (DBG) { console.log('starting size: ', mm.width(), mm.height()) };

  if (textRender !== '') {
    rows = textRender.split('\n').length;
    cols = textRender.split('\n')[0].length;
  } else {
    rows = pre.text().split('\n').length;
    cols = pre.text().split('\n')[0].length;
  }

  // determine the number of characters - scale determined based on
  // 3x3 maze with text-render of 13 chars per maze column
  const baseFontSize = parseInt($(':root').css('font-size'));
  const mazeModOffset = baseFontSize - 13;
  const mazeMod = (rows > cols ? rows : cols) + mazeModOffset;
  // if (DBG) { console.log(`row-chars: ${rows}, col-chars: ${cols}, mazeMod: ${mazeMod}`) };

  const baseSize = parseInt($(':root').css('--miniMapBaseSize'));
  const newRemSize = (mmc.width() / mazeMod / baseSize).toFixed(3); // :1 aspect ratio, so only check width
  // if (DBG) { console.log(`newRemSize: ${newRemSize}`) };

  $(':root').css('--miniMapFontSize', newRemSize + 'rem');

  if (textRender !== '') {
    if (pre.length === 0) {
      mmc.html(`<pre>${textRender}</pre`);
    } else {
      pre.html(textRender);
    }
  }

  mm.width(pre.width() + pre.width() * 0.1);
  mm.height(pre.height() + $('#miniMap h3').height() + pre.width() * 0.1);
  // if (DBG) { console.log('final size: ', mm.width(), mm.height()) };
}

/**
 * Update the avatar icon with a facing direction, if provided
 *
 * @param {*} textMap
 * @param {*} dir
 *
 * @return {string}
 */
function faceAvatar(textMap, dir) {
  if (dir != -1) {
    switch (dir) {
      case DIRS.NORTH: {
        textMap = textMap.replace('@', '▲');
        break;
      }
      case DIRS.SOUTH: {
        textMap = textMap.replace('@', '▼');
        break;
      }
      case DIRS.EAST: {
        textMap = textMap.replace('@', '►');
        break;
      }
      case DIRS.WEST: {
        textMap = textMap.replace('@', '◄');
        break;
      }
    }
  }

  return textMap;
}

/**
 * Toggle run/step/debug button states while bot running
 *
 * @param {*} enabled
 */
function setBotButtonStates(enabled) {
  if (!pageLoadComplete) return;

  // cancel the bot timer
  clearInterval(botCallBackTimer);

  if (enabled) {
    $('.btnBot').attr('disabled', false);
    $('.btnBot').removeClass('btnDisabled');
    $('.btnBot').addClass('btnEnabled');
  } else {
    $('.btnBot').attr('disabled', true);
    $('.btnBot').addClass('btnDisabled');
    $('.btnBot').removeClass('btnEnabled');
  }

  // force hide any potentially stuck tooltips
  $('.ui-tooltip').hide();
}

/**
 * Toggle save/version buttons based on current bot code state
 *
 * @param {*} enabled
 */
function setSaveButtonStates(enabled) {
  if (!pageLoadComplete) return;

  if (enabled) {
    $('#btnSaveBotCode').attr('disabled', false);
    $('#btnSaveBotCode').removeClass('btnDisabled');
    $('#btnSaveBotCode').addClass('btnEnabled');
    $('#btnSaveBotCode').attr('title', 'Save Bot (shortcut: [CTRL + S] in editor');

    // botcode is dirty - bind the unload warning event
    window.onbeforeunload = function(e) {
      e.preventDefault();
      e.returnValue = '';
    };
  } else {
    $('#btnSaveBotCode').attr('disabled', true);
    $('#btnSaveBotCode').addClass('btnDisabled');
    $('#btnSaveBotCode').removeClass('btnEnabled');
    $('#btnSaveBotCode').attr('title', '');

    // botcode saved, unbind the unload warning event
    window.onbeforeunload = function() {};
  }

  // force hide any potentially stuck tooltips
  $('.ui-tooltip').hide();
}

/**
 * Toggles display of an engram Data container
 *
 * @param {*} containerId
 */
function toggleEngramContent(containerId) {
  const icon = $(`#${containerId}_icon`);
  const content = $(`#${containerId} > p`);

  if (content.css('display') !== 'none') {
    icon.removeClass('ui-icon-minus');
    icon.addClass('ui-icon-plus');
    content.hide();
  } else {
    icon.addClass('ui-icon-minus');
    icon.removeClass('ui-icon-plus');
    content.show();
  }
}

/**
 * Sends a command to the MazeMasterJS Game Server
 *
 * @param {action} action Actions include a command, a direction, and an optional message.
 * @param {action} callback The function to call back to with response data.
 */
async function SendAction(action) {
  const method = `SendAction(action)`;
  if (DBG) console.log(method, action, 'botCallback == null ? ' + botCallback === null);

  if (!action) {
    const actErr = new Error('Missing Action - You must supply an action object.');
    logMessage('err', 'Invalid Action', actErr.message);
    throw actErr;
  }

  if (!action.command) {
    const cmdErr = new Error('Missing action.command - Your action must include a command.');
    logMessage('err', 'Missing action.command', cmdErr.message);
    throw cmdErr;
  }

  if (!action.direction) {
    action.direction = DIRECTIONS.NONE;
  }

  if (!curGame || !curGame.gameId || curGame.gameId.trim() === '') {
    const gameIdErr = new Error('Invalid Game - No game is currently in progress.');
    logMessage('err', 'Invalid Game', gameIdErr.message);
    throw gameIdErr;
  } else {
    action.gameId = curGame.gameId;
  }

  return await executeAction(action)
    .then(data => {
      lastActionResult = data;

      // Stop the chain if EMERGENCY STOP was requested
      setTimeout(() => {
        if (EMERGENCY_STOP_BUTTON_PUSHED) {
          $('#emergencyStopDialog').html(getEndGameImg('fail'));
          $('#emergencyStopDialog').dialog('open');
          logMessage('err', 'EMERGENCY STOP');
          setBotButtonStates(true);
          return;
        }

        // Only continue chain if game is still in progress and botCallback is set
        if (botCallback !== null && data.game.score.gameResult === GAME_RESULTS.IN_PROGRESS) {
          clearInterval(botCallBackTimer);
          botCallBackTimer = setInterval(callbackTimeout, CALLBACK_TIMEOUT); // safety check for bots that fall out of the function (or get stuck) before sending an action
          botCallback(reformatData(data));
        } else {
          if (DBG) console.log(method, 'Chain Stopped. gameResult=', data.game.score.gameResult, 'botCallback == null? ' + botCallback === null);
          setBotButtonStates(true);
        }
      }, CALLBACK_DELAY);
    })
    .catch(reqError => {
      if (reqError.status === 404) {
        logMessage('err', 'Game Not Found', `Game ${curGame.gameId} was not found. Please try again.`);
        resetGlobals();
        throw reqError;
      } else {
        if (DBG) console.log('SendAction() -> gameFuncs.executeAction Error: ' + reqError.statusText);
        logMessage('err', `ACTION ERROR - ${reqError.status}`, reqError.statusText);
        setBotButtonStates(true);
      }
    });
}

/**
 * Reformats an actionResult to be more intuitive and less verbose
 *
 * @param {*} data
 * @return {*}
 */
function reformatData(data) {
  if (DBG) console.log('reformatData(data)', data);
  const nData = {};
  nData.player = {};

  // clear out some unused data elements
  delete data.action.engram.here.intuition;
  delete data.action.engram.here.items;

  // outcomes
  nData.outcomes = data.action.outcomes;

  // map player data
  nData.player.facing = data.playerFacing;
  nData.player.state = data.playerState;
  nData.player.health = data.action.playerLife;

  // the here engrams
  nData.room = data.action.engram.here;

  nData.see = {};
  nData.see.north = data.action.engram.north.see;
  nData.see.south = data.action.engram.south.see;
  nData.see.east = data.action.engram.east.see;
  nData.see.west = data.action.engram.west.see;

  nData.hear = {};
  nData.hear.north = data.action.engram.north.hear;
  nData.hear.south = data.action.engram.south.hear;
  nData.hear.east = data.action.engram.east.hear;
  nData.hear.west = data.action.engram.west.hear;

  nData.smell = {};
  nData.smell.north = data.action.engram.north.smell;
  nData.smell.south = data.action.engram.south.smell;
  nData.smell.east = data.action.engram.east.smell;
  nData.smell.west = data.action.engram.west.smell;

  nData.touch = {};
  nData.touch.north = data.action.engram.north.touch;
  nData.touch.south = data.action.engram.south.touch;
  nData.touch.east = data.action.engram.east.touch;
  nData.touch.west = data.action.engram.west.touch;

  nData.taste = {};
  nData.taste.north = data.action.engram.north.taste;
  nData.taste.south = data.action.engram.south.taste;
  nData.taste.east = data.action.engram.east.taste;
  nData.taste.west = data.action.engram.west.taste;

  if (DBG) console.log('reformatData(data) -> return ->', nData);

  return nData;
}

/**
 * Reset botCallback and enables bot control if goBot() fails to call SendAction within
 * the timeout value set by CALLBACK_TIMEOUT
 *
 */
function callbackTimeout() {
  clearInterval(botCallBackTimer);
  botCallback = null;
  setBotButtonStates(true);
  logMessage('wrn', 'BOT TIMEOUT', 'Your bot timed out. It may have forgotten to call SendAction() before it exited or returned.');
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
