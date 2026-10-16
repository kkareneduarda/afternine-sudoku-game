/* ============================ INÍCIO ============================ */
(async function boot(){
  buildBoard();
  // Jogo salvo e não terminado: volta direto para ele. Caso contrário, mostra o menu.
  const had = restore();
  setView(had && !G.done ? 'game' : 'menu');
  try { await handleCallback(); }
  catch (e) {
    spMsg('Não foi possível conectar (' + (e && e.message ? e.message : 'erro') + '). Confira o Client ID e se o Redirect URI cadastrado é idêntico ao mostrado em Configuração.', 0);
  }
  paint();
  if (readTokens()) pull();
})();
