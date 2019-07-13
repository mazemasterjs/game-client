const m = {};
let r = 0;
let c = 0;

// m['0x0'] = 1;
startActionChain({ command: COMMANDS.LOOK, direction: DIRS.NONE }, goBot);

function goBot(result) {
  let l = `${r}x${c}`;
  const a = result.actionResult.command;
  const d = result.actionResult.direction;
  const e = ge(result.actionResult.engram);

  if (!!(result.playerState & PLAYER_STATES.SITTING)) {
    logMessage('bot', 'Why am I sitting?', 'If I am sitting, I will stand UP!');
    return startActionChain({ command: COMMANDS.STAND, direction: DIRS.NONE }, goBot);
  }

  if (a == COMMANDS.MOVE) {
    r = d < 4 ? (d == 2 ? r + 1 : r - 1) : r;
    c = d > 2 ? (d == 4 ? c + 1 : c - 1) : c;
    l = `${r}x${c}`;
    logMessage('wrn', 'map', JSON.stringify(m));
  }

  let n = ltp(e, r, c);

  m[l] === undefined ? (m[l] = 1) : (m[l] = m[l] + 1);
  logMessage('bot', `I'm at ${r}, ${c}...`, `... and I've been here ${m[l]} times before. I want to go ${n}`);
  if (n == 0) return logMessage('wrn', 'Bot has stopped.');

  return startActionChain({ command: COMMANDS.MOVE, direction: n }, goBot);
}

function ge(en) {
  let ex = [];
  if (en.north.see[0].sight != 'lava' && en.north.see[0].distance > 0) ex.push(1);
  if (en.south.see[0].distance > 0) ex.push(2);
  if (en.east.see[0].distance > 0) ex.push(4);
  if (en.west.see[0].distance > 0) ex.push(8);
  return ex;
}

function ltp(e, rr, cc) {
  if (e.length == 1) return e[0];

  let s = 9999;
  let d = 0;
  for (let x = 0; x < e.length; x++) {
    debugger;
    if (e[x] == 1) rr--;
    if (e[x] == 2) rr++;
    if (e[x] == 4) cc++;
    if (e[x] == 8) cc--;

    let ll = `${rr}x${cc}`;

    if (m[ll] === undefined) return e[x];

    if (m[ll] < s) {
      s = m[ll];
      d = e[x];
    }
  }
  return d;
}
