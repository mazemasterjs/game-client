// ** WALL FOLLOWER ** //

if (getBotRamLength() == 0) {
  BOT_RAM.lastCmd = CMDS.NONE;
  BOT_RAM.lastDir = DIRS.NONE;
}

function goBot(data) {
  try {
    // I always check if I'm sitting first!
    if (GameData.player.state == PLAYER_STATES.SITTING) {
      logMessage(LOG_TYPES.BOT, 'Why am I sitting?', "If I'm sitting, I'll stand up.");
      SendAction({ command: CMDS.STAND, direction: DIRS.NONE });
      return;
    }

    if (BOT_RAM.lastCmd == CMDS.MOVE || BOT_RAM.lastCmd == CMDS.NONE) {
      var exitAhead = false; // we'll change this to true if we can continue forward
      var exitOnRight = false; // we'll change this BOOLEAN to TRUE if we find an exit to our right
      logMessage(LOG_TYPES.BOT, 'Hmmm... Do I need to turn?', "My last command was a move, so now I'm checking to see if there's a right turn available.");

      // SWITCH statements are very handy - like a whole pile of if/else statements all packed into one!
      // We'll use this one to check for an open exit to the RIGHT of the direction we're FACING
      switch (GameData.player.facing) {
        case DIRS.NORTH:
          exitOnRight = GameData.room.exitEast;
          exitAhead = GameData.room.exitNorth;
          break;
        case DIRS.SOUTH:
          exitOnRight = GameData.room.exitWest;
          exitAhead = GameData.room.exitSouth;
          break;
        case DIRS.EAST:
          exitOnRight = GameData.room.exitSouth;
          exitAhead = GameData.room.exitEast;
          break;
        case DIRS.WEST:
          exitOnRight = GameData.room.exitNorth && GameData.see.north[0].sight != 'lava';
          exitAhead = GameData.room.exitWest;
          break;
      }

      // if we set exitOnRight to TRUE in the SWITCH statement above, we know that we need to turn to face it
      if (exitOnRight) {
        logMessage(LOG_TYPES.BOT, 'I found a right turn!');

        // Store the next moves in BOT_RAM so that I'll know what I did on the previous turn
        // Otherwise we'll just end up turning in circles!!
        BOT_RAM.lastCmd = CMDS.TURN;
        BOT_RAM.lastDir = DIRS.RIGHT;

        // since I put the CMDS and DIRS I need in BOT_RAM, I can use them here!
        SendAction({ command: BOT_RAM.lastCmd, direction: BOT_RAM.lastDir });
        return;
      } else if (exitAhead) {
        logMessage(LOG_TYPES.BOT, 'Moving Forward!', 'There were no RIGHT turns, but since I can keep going forward, I will.');
        BOT_RAM.lastCmd = CMDS.MOVE;
        BOT_RAM.lastDir = DIRS.NONE;
        SendAction({ command: BOT_RAM.lastCmd, direction: BOT_RAM.lastDir });
        return;
      } else {
        logMessage(LOG_TYPES.BOT, 'Turning Left', "There were no RIGHT TURNS and I can't MOVE forward... My only option is to TURN LEFT, so I will!");
        BOT_RAM.lastCmd = CMDS.TURN;
        BOT_RAM.lastDir = DIRS.LEFT;

        // since I put the CMDS and DIRS I need in BOT_RAM, I can use them here!
        SendAction({ command: BOT_RAM.lastCmd, direction: BOT_RAM.lastDir });
        return;
      }
    }

    if (BOT_RAM.lastCmd == CMDS.TURN) {
      var exitAhead = false;

      switch (GameData.player.facing) {
        case DIRS.NORTH:
          exitAhead = GameData.room.exitNorth;
          break;
        case DIRS.SOUTH:
          exitAhead = GameData.room.exitSouth;
          break;
        case DIRS.EAST:
          exitAhead = GameData.room.exitEast;
          break;
        case DIRS.WEST:
          exitAhead = GameData.room.exitWest;
          break;
      }

      if (exitAhead) {
        BOT_RAM.lastCmd = CMDS.MOVE;
        BOT_RAM.lastDir = DIRS.NONE;
        SendAction({ command: BOT_RAM.lastCmd, direction: BOT_RAM.lastDir });
        return;
      } else {
        SendAction({ command: BOT_RAM.lastCmd, direction: BOT_RAM.lastDir });
        return;
      }
    }

    // fail-safe - My bot will warn me if my script didn't failed to determine what the next action
    // was supposed to be.
    logMessage(LOG_TYPES.WARN, "I'm stuck.", "I'm not sure where to go from here.  HELP!!");
  } catch (botError) {
    logMessage(LOG_TYPES.ERROR, 'My bot has encountered an error :(', botError.stack);
  }
}
