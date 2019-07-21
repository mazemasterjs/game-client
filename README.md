# game-client

The MazeMasterJS Game Client

## TODO

[ ] Render trophies and score on bot-editor
[ ] Display detailed stats on scoreboard (including trophy data)
[ ] Replace minimap with the cooler version
[ ] Add an actual scoreboard (bummer - didn't get to it this weekend)
[ ] Secure the quickHash route

## Change Notes

### v1.1.2

- BOT EDITOR
  - Added modal loading dialog when bot versions/bot code are loading (prevents people switching versions or running bots before they're loaded)
  - Bot version loading / parsing is now much, much faster
- SCOREBOARD
  - Fixed bug with bot identification that was preventing scoreboard from loading if team scores were returned in the top-3 list for each maze
  - Switching to camper-only view no longer makes it impossible to switch back to all-players view.
  - Cleaned up logging / error handling in general

### v1.1.2

- Trophies now render in action log
- Since playerState is a bitwise value, players may run into problems with the standard GameData.player.state == PLAYER_STATES.SITTING check once they start to encounter traps that add additional states. To prevent the need to have to teach bitwise comparisons (which can be confusing), the following booleans have been added to GameData.player:
  - isSitting
  - isLyingDown
  - isStunned
  - isSlowed
  - isPoisoned
- player health is now rendered in the the action window. There are no recovery or poison-curing actions available, so it's really only there to bring attention to poison traps (dart).
- Run Bot - the score and move count displayed in in the action window now resets whenever a maze is defeated and the next maze starts automatically.

### v1.1.1

- fixed GameData type error (.feel changed to .touch)

### v1.1.0

- Team Editor is functional and complete enough for camp.
- Made engram data spacier in the action log so it's easier to read
- Fixed issue with bot-weight not being handled correction on save
- First-time users now start with a simple, base-bot
- Static content (images, javascript libraries) are all hosted in the media project and served directly from mazemasterjs.com
