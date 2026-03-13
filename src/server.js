const { createUnoRoom, joinUnoRoom, startUnoGame, handleUnoPlay, handleUnoDraw, unoRooms, broadcastUnoAll, unoSend } = require('./uno');

const { WebSocketServer } = require('ws');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static(path.join(__dirname, '../public')));

// ── BLAGUES ─────────────────────────────────────────────────────────────────
const BLAGUES = [
  "🚿 Le saviez-vous ? Lilou a déjà pas pris sa douche pendant plus d'une semaine. Les voisins pensaient que c'était une nouvelle espèce.",
  "💀 Brubru est vraiment une burne. C'est officiel, c'est même écrit dans le Larousse maintenant.",
  "🦵 La légende raconte que Brubru a des jambes de coq. En fait il s'est rasé les cheveux pour les mettre ailleurs.",
  "🥚 Brubru a tellement peu de cheveux sur le caillou qu'il utilise son crâne comme miroir pour se raser les jambes.",
  "💸 Amélia la kassos. Elle arrive en soirée les mains dans les poches et repart avec les bouteilles des autres.",
  "🤧 Amélia est tellement tout le temps malade qu'elle a sa propre place réservée chez le médecin, avec son prénom gravé.",
  "😴 Amélia la kassos... même ses microbes sont fatigués.",
  "💪 Mathéo est le plus fort. Pas la peine de débattre, c'est une vérité universelle comme la gravité.",
  "🚗 La légende raconte que Lilou est rentrée dans plus de voitures que Brubru a de cheveux sur le caillou. Pour vous dire la performance.",
  "🧼 Lilou pu. Même son téléphone a demandé à être mis en mode avion pour s'éloigner.",
  "📚 Lilou a redoublé. Elle a tellement aimé l'année qu'elle l'a faite deux fois pour être sûre.",
  "🪓 Brubru a des jambes de coq et un crâne de boule de billard. En gros c'est un oiseau chauve.",
  "🤒 Amélia est tellement souvent malade que son médecin lui a proposé un abonnement mensuel.",
  "🚙 Lilou au volant c'est Grand Theft Auto en vrai. Les voitures garées la voient arriver et tremblent.",
  "👑 Mathéo est le plus fort du groupe et tout le monde le sait. Même Brubru, mais il avoue pas.",
  "💨 Lilou pu tellement que son déo a demandé un congé sabbatique.",
  "🍗 Les jambes de Brubru sont tellement fines qu'on les voit pas de face. Il faut tourner autour comme une sculpture.",
  "😷 Amélia a été malade tellement souvent que la Sécu lui a envoyé une carte de fidélité.",
  "🪩 Le crâne de Brubru reflète tellement bien la lumière qu'on peut l'utiliser comme boule de discothèque.",
  "🏎️ Lilou conduit tellement mal que les radars ont peur d'elle.",
];

function randBlague() {
  return BLAGUES[Math.floor(Math.random() * BLAGUES.length)];
}

// ── WORD PAIRS ──────────────────────────────────────────────────────────────
const PAIRS = [
  // OL / Foot français
  { theme: '🔴 OL', a: 'Tolisso', b: 'Fekir' },
  { theme: '🔴 OL', a: 'Lacazette', b: 'Benzema' },
  { theme: '🔴 OL', a: 'Ligue 1', b: 'Champions League' },
  { theme: '🔴 OL', a: 'Parc OL', b: 'Vélodrome' },
  { theme: '🔴 OL', a: 'Bruno Genesio', b: 'Peter Bosz' },
  { theme: '🔴 OL', a: 'Moussa Dembélé', b: 'Alexandre Lacazette' },
  { theme: '⚽ Foot FR', a: 'Mbappé', b: 'Dembélé' },
  { theme: '⚽ Foot FR', a: 'PSG', b: 'OM' },
  { theme: '⚽ Foot FR', a: 'Didier Deschamps', b: 'Zinedine Zidane' },
  { theme: '⚽ Foot FR', a: 'Giroud', b: 'Griezmann' },
  { theme: '⚽ Foot FR', a: 'Neymar', b: 'Ibrahimovic' },
  { theme: '⚽ Foot FR', a: 'Stade de France', b: 'Wembley' },
  { theme: '⚽ Foot FR', a: 'Coupe de France', b: 'Coupe du Monde' },
  // TV / Séries
  { theme: '📺 Séries', a: 'Squid Game', b: 'Money Heist' },
  { theme: '📺 Séries', a: 'Breaking Bad', b: 'Better Call Saul' },
  { theme: '📺 Séries', a: 'Game of Thrones', b: 'House of the Dragon' },
  { theme: '📺 Séries', a: 'Stranger Things', b: 'Dark' },
  { theme: '📺 Séries', a: 'Lupin', b: 'Arsène Lupin' },
  { theme: '📺 Séries', a: 'Netflix', b: 'Disney+' },
  { theme: '📺 Séries', a: 'Peaky Blinders', b: 'Boardwalk Empire' },
  { theme: '📺 Séries', a: 'The Bear', b: 'Chef\'s Table' },
  // Musique
  { theme: '🎵 Musique', a: 'Ninho', b: 'Niska' },
  { theme: '🎵 Musique', a: 'Jul', b: 'SCH' },
  { theme: '🎵 Musique', a: 'Drake', b: 'Travis Scott' },
  { theme: '🎵 Musique', a: 'Spotify', b: 'Apple Music' },
  { theme: '🎵 Musique', a: 'PNL', b: 'Hamza' },
  { theme: '🎵 Musique', a: 'Booba', b: 'Kaaris' },
  // Jeux vidéo
  { theme: '🎮 Gaming', a: 'FIFA', b: 'PES' },
  { theme: '🎮 Gaming', a: 'GTA V', b: 'GTA VI' },
  { theme: '🎮 Gaming', a: 'PS5', b: 'Xbox Series X' },
  { theme: '🎮 Gaming', a: 'Fortnite', b: 'Warzone' },
  { theme: '🎮 Gaming', a: 'Ronaldo dans FIFA', b: 'Messi dans FIFA' },
  // Lyon ville
  { theme: '🦁 Lyon', a: 'Vieux Lyon', b: 'Croix-Rousse' },
  { theme: '🦁 Lyon', a: 'Saône', b: 'Rhône' },
  { theme: '🦁 Lyon', a: 'Traboules', b: 'Bouchons' },
  { theme: '🦁 Lyon', a: 'Part-Dieu', b: 'Confluence' },
  // Resto / Food
  { theme: '🍔 Food', a: 'Big Mac', b: 'Whopper' },
  { theme: '🍔 Food', a: 'McDonald\'s', b: 'Burger King' },
  { theme: '🍔 Food', a: 'Sushi', b: 'Tacos' },
  { theme: '🍔 Food', a: 'Nutella', b: 'Speculoos' },
];

// ── ROOMS ───────────────────────────────────────────────────────────────────
const rooms = new Map(); // code → room

function makeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return rooms.has(code) ? makeCode() : code;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function broadcast(room, msg) {
  const data = JSON.stringify(msg);
  room.clients.forEach(ws => { if (ws.readyState === 1) ws.send(data); });
}

function send(ws, msg) {
  if (ws.readyState === 1) ws.send(JSON.stringify(msg));
}

function roomState(room) {
  return {
    type: 'room_state',
    code: room.code,
    players: room.players.map(p => ({ name: p.name, ready: true, isHost: p.isHost })),
    phase: room.phase,
    round: room.round,
    theme: room.theme || null,
  };
}

function startGame(room) {
  const pair = PAIRS[Math.floor(Math.random() * PAIRS.length)];
  room.theme = pair.theme;
  room.pair = pair;
  room.phase = 'reveal';
  room.round = (room.round || 0) + 1;
  room.eliminated = [];
  room.votes = {};

  // 3 civils get word A, 1 undercover gets word B (random who)
  const shuffled = shuffle(room.players);
  const ucIdx = Math.floor(Math.random() * shuffled.length);
  shuffled.forEach((p, i) => {
    p.role = i === ucIdx ? 'undercover' : 'civil';
    p.word = i === ucIdx ? pair.b : pair.a;
    p.alive = true;
  });

  // send each player their card
  room.players.forEach(p => {
    send(p.ws, {
      type: 'your_card',
      role: p.role,
      word: p.word,
      theme: pair.theme,
      round: room.round,
    });
  });

  broadcast(room, { type: 'phase', phase: 'reveal', theme: pair.theme, round: room.round });
}

function sendVoteState(room) {
  const alive = room.players.filter(p => p.alive);
  broadcast(room, {
    type: 'vote_state',
    players: alive.map(p => ({
      name: p.name,
      votes: Object.values(room.votes).filter(v => v === p.name).length,
    })),
    votes: room.votes,
    total: alive.length,
  });
}

function checkWin(room) {
  const alive = room.players.filter(p => p.alive);
  const ucAlive = alive.filter(p => p.role === 'undercover');
  const civAlive = alive.filter(p => p.role === 'civil');

  if (ucAlive.length === 0) return 'civils';
  if (ucAlive.length >= civAlive.length) return 'undercover';
  return null;
}

// ── WEBSOCKET ────────────────────────────────────────────────────────────────
wss.on('connection', ws => {
  ws.roomCode = null;
  ws.playerName = null;

  ws.on('message', raw => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    // CREATE ROOM
    if (msg.type === 'create_room') {
      const code = makeCode();
      const room = {
        code,
        clients: new Set([ws]),
        players: [],
        phase: 'lobby',
        round: 0,
        eliminated: [],
        votes: {},
      };
      rooms.set(code, room);
      ws.roomCode = code;
      const player = { name: msg.name, ws, isHost: true, role: null, word: null, alive: true };
      ws.playerName = msg.name;
      room.players.push(player);
      send(ws, { type: 'created', code, isHost: true });
      send(ws, roomState(room));
      return;
    }

    // JOIN ROOM
    if (msg.type === 'join_room') {
      const room = rooms.get(msg.code.toUpperCase());
      if (!room) { send(ws, { type: 'error', msg: 'Salle introuvable !' }); return; }
      if (room.phase !== 'lobby') { send(ws, { type: 'error', msg: 'Partie déjà en cours.' }); return; }
      if (room.players.length >= 6) { send(ws, { type: 'error', msg: 'Salle pleine !' }); return; }
      if (room.players.find(p => p.name.toLowerCase() === msg.name.toLowerCase())) {
        send(ws, { type: 'error', msg: 'Ce prénom est déjà pris !' }); return;
      }
      ws.roomCode = msg.code.toUpperCase();
      ws.playerName = msg.name;
      room.clients.add(ws);
      const player = { name: msg.name, ws, isHost: false, role: null, word: null, alive: true };
      room.players.push(player);
      send(ws, { type: 'joined', code: room.code, isHost: false });
      broadcast(room, roomState(room));
      return;
    }

    // ── UNO MESSAGES ──
    if (msg.type === 'uno_create') {
      const code = 'U' + makeCode().slice(1);
      const room = createUnoRoom(code, ws, msg.name);
      ws.unoCode = code;
      unoSend(ws, { type: 'uno_created', code, isHost: true });
      unoSend(ws, { type: 'uno_lobby', code, players: room.players.map(p=>p.name), isHost: true });
      return;
    }
    if (msg.type === 'uno_join') {
      const room = unoRooms().get(msg.code.toUpperCase());
      if (!room) { unoSend(ws, { type: 'error', msg: 'Salle UNO introuvable !' }); return; }
      if (room.phase !== 'lobby') { unoSend(ws, { type: 'error', msg: 'Partie déjà en cours.' }); return; }
      if (room.players.find(p => p.name.toLowerCase() === msg.name.toLowerCase())) { unoSend(ws, { type: 'error', msg: 'Prénom déjà pris !' }); return; }
      joinUnoRoom(room, ws, msg.name);
      ws.unoCode = msg.code.toUpperCase();
      unoSend(ws, { type: 'uno_joined', code: room.code, isHost: false });
      broadcastUnoAll(room, { type: 'uno_lobby', code: room.code, players: room.players.map(p=>p.name), isHost: false });
      return;
    }
    if (msg.type === 'uno_start') {
      const room = ws.unoCode ? unoRooms().get(ws.unoCode) : null;
      if (!room) return;
      const me = room.players.find(p => p.ws === ws);
      if (!me || !me.isHost) return;
      if (room.players.length < 2) { unoSend(ws, { type: 'error', msg: 'Il faut au moins 2 joueurs !' }); return; }
      startUnoGame(room);
      return;
    }
    if (msg.type === 'uno_play') {
      const room = ws.unoCode ? unoRooms().get(ws.unoCode) : null;
      if (!room) return;
      handleUnoPlay(room, ws, msg.cardId, msg.chosenColor);
      return;
    }
    if (msg.type === 'uno_draw') {
      const room = ws.unoCode ? unoRooms().get(ws.unoCode) : null;
      if (!room) return;
      handleUnoDraw(room, ws);
      return;
    }
    if (msg.type === 'uno_again') {
      const room = ws.unoCode ? unoRooms().get(ws.unoCode) : null;
      if (!room) return;
      const me = room.players.find(p => p.ws === ws);
      if (!me || !me.isHost) return;
      startUnoGame(room);
      return;
    }

    // ── UNDERCOVER MESSAGES ──
    const room = ws.roomCode ? rooms.get(ws.roomCode) : null;
    if (!room) return;
    const me = room.players.find(p => p.ws === ws);
    if (!me) return;

    // START GAME (host only)
    if (msg.type === 'start_game') {
      if (!me.isHost) return;
      if (room.players.length < 3) { send(ws, { type: 'error', msg: 'Il faut au moins 3 joueurs !' }); return; }
      startGame(room);
      return;
    }

    // READY (card seen)
    if (msg.type === 'card_seen') {
      me.cardSeen = true;
      const all = room.players.every(p => p.cardSeen);
      if (all) {
        room.phase = 'discuss';
        room.players.forEach(p => p.cardSeen = false);
        broadcast(room, { type: 'phase', phase: 'discuss' });
        broadcast(room, roomState(room));
      } else {
        const seen = room.players.filter(p => p.cardSeen).length;
        broadcast(room, { type: 'waiting_cards', seen, total: room.players.length });
      }
      return;
    }

    // OPEN VOTE (host)
    if (msg.type === 'open_vote') {
      if (!me.isHost) return;
      room.phase = 'vote';
      room.votes = {};
      broadcast(room, { type: 'phase', phase: 'vote' });
      sendVoteState(room);
      return;
    }

    // CAST VOTE
    if (msg.type === 'vote') {
      if (room.phase !== 'vote') return;
      room.votes[me.name] = msg.target;
      sendVoteState(room);

      const alive = room.players.filter(p => p.alive);
      if (Object.keys(room.votes).length === alive.length) {
        // tally
        const counts = {};
        Object.values(room.votes).forEach(v => counts[v] = (counts[v] || 0) + 1);
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const eliminated = sorted[0][0];
        const elim = room.players.find(p => p.name === eliminated);
        if (elim) elim.alive = false;
        room.eliminated.push(eliminated);

        const win = checkWin(room);
        if (win) {
          room.phase = 'result';
          broadcast(room, {
            type: 'game_over',
            winner: win,
            players: room.players.map(p => ({ name: p.name, role: p.role, word: p.word, alive: p.alive })),
            eliminated,
          });
        } else {
          room.phase = 'discuss';
          room.votes = {};
          broadcast(room, {
            type: 'eliminated',
            name: eliminated,
            role: elim ? elim.role : '?',
          });
          broadcast(room, { type: 'blague', text: randBlague() });
          broadcast(room, { type: 'phase', phase: 'discuss' });
          broadcast(room, roomState(room));
        }
      }
      return;
    }

    // PLAY AGAIN (host)
    if (msg.type === 'play_again') {
      if (!me.isHost) return;
      room.phase = 'lobby';
      room.votes = {};
      room.eliminated = [];
      room.players.forEach(p => { p.role = null; p.word = null; p.alive = true; p.cardSeen = false; });
      broadcast(room, { type: 'blague', text: randBlague() });
      broadcast(room, { type: 'phase', phase: 'lobby' });
      broadcast(room, roomState(room));
      return;
    }

    // KICK / CHANGE PLAYERS (host)
    if (msg.type === 'kick') {
      if (!me.isHost || room.phase !== 'lobby') return;
      const idx = room.players.findIndex(p => p.name === msg.name);
      if (idx > -1 && !room.players[idx].isHost) {
        const kicked = room.players[idx];
        send(kicked.ws, { type: 'kicked' });
        room.clients.delete(kicked.ws);
        room.players.splice(idx, 1);
        broadcast(room, roomState(room));
      }
      return;
    }
  });

  ws.on('close', () => {
    if (!ws.roomCode) return;
    const room = rooms.get(ws.roomCode);
    if (!room) return;
    room.clients.delete(ws);
    const idx = room.players.findIndex(p => p.ws === ws);
    if (idx > -1) {
      const wasHost = room.players[idx].isHost;
      room.players.splice(idx, 1);
      if (room.players.length === 0) { rooms.delete(ws.roomCode); return; }
      if (wasHost && room.players.length > 0) room.players[0].isHost = true;
      broadcast(room, roomState(room));
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🔥 Undercover running on port ${PORT}`));
