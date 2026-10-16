/* ============================ SPOTIFY ============================ */
const SP = {
  scopes: 'streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state',
  clientId(){ return (CLIENT_ID || store.get('sp.client') || '').trim(); },
  // "/index.html" vira "/", para o endereço ser sempre o mesmo, abra como abrir.
  redirect(){ return location.origin + location.pathname.replace(/index\.html$/, ''); },
  // O Spotify só aceita http em endereços de loopback (127.0.0.1 / [::1]); "localhost" é recusado.
  problem(){
    const h = location.hostname;
    if (location.protocol === 'file:')
      return 'Abra o site por um endereço http, por exemplo http://127.0.0.1:8888, e não direto do arquivo.';
    if (h === 'localhost')
      return 'O Spotify não aceita "localhost". Abra esta página em http://127.0.0.1:' + (location.port || '80') + ' e cadastre esse endereço como Redirect URI.';
    if (location.protocol === 'http:' && h !== '127.0.0.1' && h !== '[::1]')
      return 'O Spotify só aceita http em 127.0.0.1. Em outros endereços, use https.';
    return '';
  }
};

let player = null;        // último estado de /me/player
let sdk = null, browserId = null, hereReady = false;
let pollTimer = 0, msgTimer = 0;

function spMsg(t, ms){
  const el = $('#spMsg');
  el.textContent = t || '';
  clearTimeout(msgTimer);
  if (t && ms !== 0) msgTimer = setTimeout(() => { el.textContent = ''; }, ms || 7000);
}

function readTokens(){
  try { return JSON.parse(store.get('sp.tokens') || 'null'); } catch (e) { return null; }
}
function rand(n){
  const a = new Uint8Array(n); crypto.getRandomValues(a);
  const cs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  return Array.from(a, (x) => cs[x % cs.length]).join('');
}
async function challenge(v){
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v));
  return btoa(String.fromCharCode(...new Uint8Array(d))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function login(){
  const bad = SP.problem();
  if (bad) { $('#spDetails').open = true; spMsg(bad, 0); paint(); return; }
  const typed = $('#spClient').value.trim();
  if (!CLIENT_ID && typed) store.set('sp.client', typed);
  const id = SP.clientId();
  if (!id) { $('#spDetails').open = true; spMsg('Cole o Client ID do seu app em Configuração.', 0); return; }
  if (!window.crypto || !crypto.subtle) { spMsg('Este navegador não permite conectar fora de uma página segura.', 0); return; }
  const v = rand(96), st = rand(16);
  store.set('sp.verifier', v); store.set('sp.state', st);
  const q = new URLSearchParams({
    client_id: id, response_type: 'code', redirect_uri: SP.redirect(),
    code_challenge_method: 'S256', code_challenge: await challenge(v),
    scope: SP.scopes, state: st
  });
  location.href = 'https://accounts.spotify.com/authorize?' + q;
}

async function tokenRequest(body){
  const r = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body
  });
  if (!r.ok) {
    let d = '';
    try { const e = await r.json(); d = e.error_description || e.error || ''; } catch (_) {}
    throw new Error(d || ('HTTP ' + r.status));
  }
  const j = await r.json();
  const prev = readTokens();
  const t = { access: j.access_token, refresh: j.refresh_token || (prev && prev.refresh), exp: Date.now() + j.expires_in * 1000 };
  store.set('sp.tokens', JSON.stringify(t));
  return t;
}
async function handleCallback(){
  const p = new URLSearchParams(location.search);
  if (!p.has('code') && !p.has('error')) return;
  history.replaceState({}, '', location.pathname);
  if (p.get('error')) { spMsg(p.get('error') === 'access_denied' ? 'Conexão cancelada.' : 'O Spotify recusou a conexão: ' + p.get('error'), 0); return; }
  if (!store.get('sp.state') || p.get('state') !== store.get('sp.state')) {
    spMsg('Não foi possível confirmar a conexão. Comece de novo a partir do mesmo endereço (o navegador guarda o login por endereço).', 0);
    return;
  }
  await tokenRequest(new URLSearchParams({
    client_id: SP.clientId(), grant_type: 'authorization_code', code: p.get('code'),
    redirect_uri: SP.redirect(), code_verifier: store.get('sp.verifier') || ''
  }));
  store.del('sp.verifier'); store.del('sp.state');
}
async function getToken(){
  let t = readTokens();
  if (!t) return null;
  if (t.exp - 30000 < Date.now()) {
    if (!t.refresh) { logout(); return null; }
    try {
      t = await tokenRequest(new URLSearchParams({ client_id: SP.clientId(), grant_type: 'refresh_token', refresh_token: t.refresh }));
    } catch (e) { logout(); return null; }
  }
  return t.access;
}
function logout(){
  store.del('sp.tokens');
  clearTimeout(pollTimer);
  if (sdk) { try { sdk.disconnect(); } catch (e) {} sdk = null; browserId = null; hereReady = false; }
  player = null;
  paint();
}

async function api(path, opts){
  const t = await getToken();
  if (!t) throw new Error('auth');
  opts = opts || {};
  return fetch('https://api.spotify.com/v1' + path, {
    method: opts.method || 'GET',
    headers: Object.assign({ Authorization: 'Bearer ' + t }, opts.body ? { 'Content-Type': 'application/json' } : {}),
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
}

function schedule(ms){
  clearTimeout(pollTimer);
  if (readTokens()) pollTimer = setTimeout(pull, ms);
}
async function pull(){
  if (!readTokens()) return;
  let wait = document.hidden ? 12000 : 4000;
  try {
    const r = await api('/me/player?additional_types=episode');
    if (r.status === 204) player = null;
    else if (r.status === 200) {
      const j = await r.json();
      player = j && j.item ? j : null;
      if (player) player._at = Date.now();
    }
    else if (r.status === 401) { logout(); return; }
    else if (r.status === 429) wait = (parseInt(r.headers.get('Retry-After') || '5', 10) + 1) * 1000;
  } catch (e) { /* tenta de novo no próximo ciclo */ }
  paint();
  schedule(wait);
}

const fmt = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};

function paint(){
  const connected = !!readTokens();
  $('#spConnect').hidden = connected;
  $('#spLogout').hidden = !connected;
  $('#spIdle').hidden = !connected || !!player;
  $('#spPlayer').hidden = !connected || !player;

  if (!connected) {
    $('#spClientField').hidden = !!CLIENT_ID;
    if (!CLIENT_ID && !$('#spClient').value) $('#spClient').value = store.get('sp.client') || '';
    $('#spRedirect').value = SP.redirect();
    const bad = SP.problem();
    $('#spWarn').hidden = !bad;
    $('#spWarn').textContent = bad;
    if (!SP.clientId() || bad) $('#spDetails').open = true;
    return;
  }
  if (!player) {
    $('#spIdleText').textContent = hereReady
      ? 'Este navegador está pronto como "Sudoku". No Spotify, escolha uma música e selecione este dispositivo.'
      : 'Nada tocando agora. Abra o Spotify e toque uma música.';
    $('#spHereIdle').hidden = hereReady;
    return;
  }
  const it = player.item;
  const imgs = (it.album && it.album.images) || it.images || [];
  const art = $('#spArt');
  const src = (imgs[0] && imgs[0].url) || '';
  if (art.getAttribute('src') !== src) art.src = src;
  art.hidden = !src;
  $('#spTitle').textContent = it.name || '';
  $('#spArtist').textContent = it.artists ? it.artists.map((a) => a.name).join(', ') : (it.show ? it.show.name : '');
  const dev = player.device || {};
  $('#spDevice').textContent = dev.name ? 'Tocando em ' + dev.name : '';
  $('#spHere').hidden = !!(browserId && dev.id === browserId);
  const playing = !!player.is_playing;
  $('#spToggle').setAttribute('aria-label', playing ? 'Pausar' : 'Tocar');
  $('#spToggleIcon').innerHTML = playing
    ? '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>'
    : '<path d="M7 4v16l13-8z"/>';
  tick();
}

function tick(){
  if (!player || !player.item) return;
  const dur = player.item.duration_ms || 0;
  let pos = player.progress_ms || 0;
  if (player.is_playing && player._at) pos += Date.now() - player._at;
  pos = Math.min(pos, dur);
  $('#spBar').style.width = dur ? (pos / dur * 100).toFixed(2) + '%' : '0%';
  $('#spPos').textContent = fmt(pos);
  $('#spDur').textContent = fmt(dur);
}
setInterval(tick, 500);

async function ctl(path, method, body){
  try {
    const r = await api(path, { method, body });
    if (r.status === 403) spMsg('O controle da reprodução exige Spotify Premium.');
    else if (r.status === 404) spMsg('Nenhum dispositivo ativo. Abra o Spotify e toque uma música.');
    else if (r.status === 401) { logout(); return; }
    else if (r.status === 429) spMsg('Muitos pedidos seguidos. Tente de novo em instantes.');
  } catch (e) { spMsg('Não foi possível falar com o Spotify.'); }
  setTimeout(pull, 350);
}

function startHere(){
  if (sdk && browserId) { transfer(); return; }
  if (sdk) return;
  spMsg('Iniciando o player deste navegador…');
  window.onSpotifyWebPlaybackSDKReady = () => {
    sdk = new Spotify.Player({
      name: 'Sudoku',
      getOAuthToken: (cb) => { getToken().then((t) => cb(t)); },
      volume: 0.6
    });
    sdk.addListener('ready', ({ device_id }) => { browserId = device_id; hereReady = true; spMsg(''); transfer(); });
    sdk.addListener('not_ready', () => { browserId = null; });
    sdk.addListener('player_state_changed', () => { setTimeout(pull, 150); });
    sdk.addListener('initialization_error', () => spMsg('Este navegador não suporta o player do Spotify.'));
    sdk.addListener('authentication_error', () => spMsg('Falha de autenticação. Desconecte e conecte de novo.'));
    sdk.addListener('account_error', () => spMsg('Tocar no navegador exige Spotify Premium.'));
    sdk.connect();
    if (sdk.activateElement) sdk.activateElement();
  };
  const s = document.createElement('script');
  s.src = 'https://sdk.scdn.co/spotify-player.js';
  s.async = true;
  s.onerror = () => spMsg('Não foi possível carregar o player do Spotify.');
  document.head.appendChild(s);
}
function transfer(){
  // O dispositivo recém-criado pode demorar um instante para aparecer no Spotify.
  setTimeout(() => ctl('/me/player', 'PUT', { device_ids: [browserId], play: true }), 400);
}

$('#spLogin').addEventListener('click', login);
$('#spLogout').addEventListener('click', () => { logout(); spMsg(''); });
$('#spHere').addEventListener('click', startHere);
$('#spHereIdle').addEventListener('click', startHere);
$('#spToggle').addEventListener('click', () => {
  if (!player) return;
  const playing = !!player.is_playing;
  player.progress_ms = Math.min((player.progress_ms || 0) + (playing && player._at ? Date.now() - player._at : 0), player.item.duration_ms || 0);
  player._at = Date.now();
  player.is_playing = !playing;
  paint();
  ctl(playing ? '/me/player/pause' : '/me/player/play', 'PUT');
});
$('#spNext').addEventListener('click', () => ctl('/me/player/next', 'POST'));
$('#spPrev').addEventListener('click', () => ctl('/me/player/previous', 'POST'));
$('#spCopy').addEventListener('click', async () => {
  const inp = $('#spRedirect');
  try { await navigator.clipboard.writeText(inp.value); spMsg('Endereço copiado.', 2500); }
  catch (e) { inp.focus(); inp.select(); }
});
document.addEventListener('visibilitychange', () => { if (!document.hidden && readTokens()) pull(); });
$('#spClient').addEventListener('input', () => {
  if (!CLIENT_ID) store.set('sp.client', $('#spClient').value.trim());
});
