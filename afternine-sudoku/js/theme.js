/* Alternância claro/escuro.
   Carregado no <head> para aplicar o tema antes da primeira pintura (sem "piscar"). */
   (function () {
    var KEY = 'sudoku.theme';
    var root = document.documentElement;
    var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  
    function stored() {
      try { var v = localStorage.getItem(KEY); return v === 'light' || v === 'dark' ? v : null; }
      catch (e) { return null; }
    }
    function system() { return mq && mq.matches ? 'dark' : 'light'; }
  
    function apply(t) {
      root.setAttribute('data-theme', t);
      var btn = document.getElementById('themeBtn');
      if (btn) {
        var next = t === 'dark' ? 'claro' : 'escuro';
        btn.setAttribute('aria-label', 'Mudar para o modo ' + next);
        btn.setAttribute('title', 'Mudar para o modo ' + next);
      }
    }
  
    apply(stored() || system());
  
    // Enquanto a pessoa não escolher, acompanha o sistema.
    if (mq) {
      var onChange = function () { if (!stored()) apply(system()); };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  
    document.addEventListener('DOMContentLoaded', function () {
      var btn = document.getElementById('themeBtn');
      if (!btn) return;
      apply(root.getAttribute('data-theme') || system());
      btn.addEventListener('click', function () {
        var t = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem(KEY, t); } catch (e) {}
        apply(t);
      });
    });
  })();
  