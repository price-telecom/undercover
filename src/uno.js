// ── UNO GAME LOGIC ───────────────────────────────────────────────────────────

const UNO_COLORS = ['rouge', 'vert', 'bleu', 'jaune'];
const UNO_VALUES = ['0','1','2','3','4','5','6','7','8','9','passe','inverse','+2'];

function buildUnoDeck() {
  const deck = [];
  // 2x chaque carte colorée sauf 0
  for (const color of UNO_COLORS) {
    deck.push({ color, value: '0', id: `${color}-0` });
    for (const val of UNO_VALUES.filter(v => v !== '0')) {
      deck.push({ color, value: val, id: `${color}-${val}-a` });
      deck.push({ color, value: val, id: `${color}-${val}-b` });
    }
  }
  // Jokers (4x joker, 4x +4)
  for (let i = 0; i < 4; i++) {
    deck.push({ color: 'noir', value: 'joker', id: `joker-${i}` });
    deck.push({ color: 'noir', value: '+4', id: `plus4-${i}` });
  }
  // 🍲 Attaque Semoule — seulement 2 exemplaires
  deck.push({ color: 'semoule', value: 'semoule', id: 'semoule-1', special: true });
  deck.push({ color: 'semoule', value: 'semoule', id: 'semoule-2', special: true });

  return shuffle(deck);
}

function unoCanPlay(card, topCard, currentColor) {
  if (card.special) return true; // semoule toujours jouable
  if (card.color === 'noir') return true;
  if (card.color === currentColor) return true;
  if (card.value === topCard.value) return true;
  return false;
}

function unoRooms() { return _unoRooms; }
const _unoRooms = new Map();

function createUnoRoom(code, hostWs, hostName) {
  const room = {
    code,
    clients: new Set([hostWs]),
    players: [],
    phase: 'lobby', // lobby → playing → gameover
    deck: [],
    pile: [],
    currentColor: null,
    direction: 1, // 1 = normal, -1 = inversé
    currentIdx: 0,
    drawStack: 0, // cartes accumulées (+2/+4)
    pendingColor: false,
  };
  _unoRooms.set(code, room);
  const player = { name: hostName, ws: hostWs, isHost: true, hand: [] };
  room.players.push(player);
  return room;
}

function joinUnoRoom(room, ws, name) {
  room.clients.add(ws);
  const player = { name, ws, isHost: false, hand: [] };
  room.players.push(player);
}

function startUnoGame(room) {
  room.deck = buildUnoDeck();
  room.phase = 'playing';
  room.direction = 1;
  room.currentIdx = 0;
  room.drawStack = 0;
  room.pendingColor = false;

  // Deal 7 cards each
  room.players.forEach(p => {
    p.hand = [];
    for (let i = 0; i < 7; i++) p.hand.push(room.deck.pop());
  });

  // First card (no special)
  let first;
  do { first = room.deck.pop(); } while (first.color === 'noir' || first.special);
  room.pile = [first];
  room.currentColor = first.color;

  broadcastUnoState(room);
}

function broadcastUnoState(room) {
  const top = room.pile[room.pile.length - 1];
  room.players.forEach((p, idx) => {
    unoSend(p.ws, {
      type: 'uno_state',
      phase: room.phase,
      yourHand: p.hand,
      handCounts: room.players.map(pl => ({ name: pl.name, count: pl.hand.length })),
      topCard: top,
      currentColor: room.currentColor,
      currentPlayer: room.players[room.currentIdx].name,
      isMyTurn: idx === room.currentIdx,
      direction: room.direction,
      drawStack: room.drawStack,
      pendingColor: room.pendingColor && idx === room.currentIdx,
    });
  });
}

function unoNextTurn(room, skip = 0) {
  const n = room.players.length;
  room.currentIdx = ((room.currentIdx + room.direction * (1 + skip)) % n + n) % n;
}

function handleUnoPlay(room, playerWs, cardId, chosenColor) {
  const player = room.players.find(p => p.ws === playerWs);
  if (!player) return;
  const idx = room.players.indexOf(player);
  if (idx !== room.currentIdx) return;

  const cardIdx = player.hand.findIndex(c => c.id === cardId);
  if (cardIdx === -1) return;
  const card = player.hand[cardIdx];
  const top = room.pile[room.pile.length - 1];

  // If drawStack active, must play +2/+4/semoule or draw
  if (room.drawStack > 0 && card.value !== '+2' && card.value !== '+4' && !card.special) return;
  if (!unoCanPlay(card, top, room.currentColor)) return;

  player.hand.splice(cardIdx, 1);
  room.pile.push(card);

  // Check win
  if (player.hand.length === 0) {
    room.phase = 'gameover';
    broadcastUnoState(room);
    broadcastUnoAll(room, { type: 'uno_winner', name: player.name });
    return;
  }

  // Apply card effect
  if (card.special) {
    // Attaque Semoule = +2 pour le suivant
    room.drawStack += 2;
    room.currentColor = room.currentColor; // garde la couleur actuelle
    broadcastUnoAll(room, { type: 'uno_semoule', from: player.name });
    unoNextTurn(room);
  } else if (card.value === '+2') {
    room.drawStack += 2;
    room.currentColor = card.color;
    unoNextTurn(room);
  } else if (card.value === '+4') {
    room.drawStack += 4;
    room.pendingColor = true;
    if (chosenColor) {
      room.currentColor = chosenColor;
      room.pendingColor = false;
    }
    unoNextTurn(room);
  } else if (card.value === 'joker') {
    room.pendingColor = true;
    if (chosenColor) {
      room.currentColor = chosenColor;
      room.pendingColor = false;
    }
    unoNextTurn(room);
  } else if (card.value === 'passe') {
    room.currentColor = card.color;
    unoNextTurn(room, 1); // skip next
  } else if (card.value === 'inverse') {
    room.currentColor = card.color;
    room.direction *= -1;
    unoNextTurn(room);
  } else {
    room.currentColor = card.color;
    unoNextTurn(room);
  }

  broadcastUnoState(room);
}

function handleUnoDraw(room, playerWs) {
  const player = room.players.find(p => p.ws === playerWs);
  if (!player) return;
  const idx = room.players.indexOf(player);
  if (idx !== room.currentIdx) return;

  const count = room.drawStack > 0 ? room.drawStack : 1;
  room.drawStack = 0;

  for (let i = 0; i < count; i++) {
    if (room.deck.length === 0) {
      // reshuffle pile
      const top = room.pile.pop();
      room.deck = shuffle(room.pile);
      room.pile = [top];
    }
    if (room.deck.length > 0) player.hand.push(room.deck.pop());
  }

  unoNextTurn(room);
  broadcastUnoState(room);
}

function unoSend(ws, msg) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg)); }
function broadcastUnoAll(room, msg) {
  const data = JSON.stringify(msg);
  room.clients.forEach(ws => { if (ws.readyState === 1) ws.send(data); });
}

module.exports = { createUnoRoom, joinUnoRoom, startUnoGame, handleUnoPlay, handleUnoDraw, unoRooms, broadcastUnoAll, unoSend };
