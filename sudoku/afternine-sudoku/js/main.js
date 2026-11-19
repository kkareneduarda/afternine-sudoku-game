/* ============================ INÍCIO ============================ */
(async function boot(){
  buildBoard();
  applyLang();
  // Jogo salvo e não terminado: volta direto para ele. Caso contrário, mostra o menu.
  const had = restore();
  setView(had && !G.done ? 'game' : 'menu');
  try { await handleCallback(); }
  catch (e) {
    const why = e && e.message ? e.message : 'erro';
    spMsg(CLIENT_ID
      ? 'Não foi possível conectar (' + why + '). Tente de novo. Se continuar, sua conta pode ainda não ter acesso a este site.'
      : 'Não foi possível conectar (' + why + '). Confira o Client ID e se o Redirect URI cadastrado é idêntico ao mostrado em Configuração.', 0);
  }
  paint();
  if (readTokens()) pull();
})();
