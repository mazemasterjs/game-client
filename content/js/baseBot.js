const starterBotLines = [];
starterBotLines.push('/** ');
starterBotLines.push(" * BOT_RAM is your bot's memory - you can store useful information here while running,");
starterBotLines.push(' *         stepping, or debugging your bot.  ');
starterBotLines.push(' * ');
starterBotLines.push(' * !! WARNING !! BOT_RAM is what\'s known as "volatile memory" - this means that it will be');
starterBotLines.push(' *               erased if you reload the page!');
starterBotLines.push(' */');
starterBotLines.push('if (getBotRamLength() == 0) {');
starterBotLines.push('  BOT_RAM.lastDir = DIRS.NONE;');
starterBotLines.push('}');
starterBotLines.push('');
starterBotLines.push('/**');
starterBotLines.push('* !! WARNING !! goBot(data) IS REQUIRED! This is the entry point for the game loop ');
starterBotLines.push('*/');
starterBotLines.push('function goBot(data) {');
starterBotLines.push('  try {');
starterBotLines.push('      // !!  START CODING HERE !!  START CODING HERE !!  START CODING HERE !! //');
starterBotLines.push('      // !!  START CODING HERE !!  START CODING HERE !!  START CODING HERE !! //');
starterBotLines.push('');
starterBotLines.push('      if (GameData.player.state == PLAYER_STATES.SITTING) {');
starterBotLines.push('          logMessage(LOG_TYPES.BOT, "Why am I sitting?", "If I\'m sitting, I\'ll stand up.");');
starterBotLines.push('          SendAction({ command: CMDS.STAND, direction: DIRS.NONE });');
starterBotLines.push('          return;');
starterBotLines.push('      }');
starterBotLines.push('');
starterBotLines.push('      if (GameData.room.exitSouth) {');
starterBotLines.push('          logMessage(LOG_TYPES.BOT, "Exit South", "If I can go South, I will...");');
starterBotLines.push('          SendAction({ command: CMDS.MOVE, direction: DIRS.SOUTH });');
starterBotLines.push('          return;');
starterBotLines.push('      }');
starterBotLines.push('');
starterBotLines.push('      logMessage(LOG_TYPES.BOT, "I\'m stuck.", "I couldn\'t figure out where to go next...");');
starterBotLines.push('      // !! STOP CODING HERE !! STOP CODING HERE !! STOP CODING HERE !! //');
starterBotLines.push('      // !! STOP CODING HERE !! STOP CODING HERE !! STOP CODING HERE !! //');
starterBotLines.push("      /** ... Unless you're ready to write your own functions, that is! **/");
starterBotLines.push('');
starterBotLines.push('  } catch (botError) {');
starterBotLines.push('      logMessage(LOG_TYPES.ERROR, "My bot has encountered an error :(", botError.stack);');
starterBotLines.push('  }');
starterBotLines.push('}');

const starterBotCode = 'basebot'; // starterBotLines.join('\n');
