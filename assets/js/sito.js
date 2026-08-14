/* ============ IL POCO JAVASCRIPT CHE SERVE ============
   Il sito è già completo senza: le pagine sono statiche e il contenuto è
   nell'HTML. Qui c'è solo ciò che senza JavaScript non si può fare — il tema
   e il menu sul telefono. Se questo file non arriva, il sito funziona lo stesso. */

(function(){
  'use strict';

  /* ---- tema chiaro / scuro / sistema ----
     Tre stati, non due: «sistema» è quello di partenza e va rispettato, perché
     chi ha impostato il telefono in scuro non vuole scegliere di nuovo qui. */
  var CHIAVE = 'ingly_tema';
  var radice = document.documentElement;
  var bottone = document.getElementById('tema');

  function attuale(){
    return radice.getAttribute('data-tema') ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'scuro' : 'chiaro');
  }
  function applica(t){
    if(t === 'sistema'){ radice.removeAttribute('data-tema'); try{ localStorage.removeItem(CHIAVE) }catch(e){} }
    else { radice.setAttribute('data-tema', t); try{ localStorage.setItem(CHIAVE, t) }catch(e){} }
    if(bottone) bottone.setAttribute('aria-label',
      'Tema ' + (t === 'sistema' ? 'automatico' : t) + ' — tocca per cambiare');
  }
  if(bottone){
    bottone.addEventListener('click', function(){
      applica(attuale() === 'scuro' ? 'chiaro' : 'scuro');
    });
  }

  /* ---- menu sul telefono ----
     Costruito qui e non nell'HTML: senza JavaScript il menu della testata
     resta nascosto dal CSS, ma tutte le voci sono comunque nel piede. Nessuno
     resta senza navigazione. */
  var testata = document.querySelector('.testata-in');
  var menu = document.querySelector('.menu');
  if(testata && menu && matchMedia('(max-width: 48rem)').matches){
    var apri = document.createElement('button');
    apri.className = 'tema menu-apri';
    apri.type = 'button';
    apri.textContent = '☰';
    apri.setAttribute('aria-label', 'Apri il menu');
    apri.setAttribute('aria-expanded', 'false');
    apri.addEventListener('click', function(){
      var aperto = menu.style.display === 'flex';
      menu.style.display = aperto ? '' : 'flex';
      menu.style.position = 'absolute';
      menu.style.top = '4rem'; menu.style.left = '0'; menu.style.right = '0';
      menu.style.flexDirection = 'column';
      menu.style.background = 'var(--carta)';
      menu.style.borderBottom = '1px solid var(--linea)';
      menu.style.padding = '1rem 1.25rem';
      menu.style.gap = '.85rem';
      apri.setAttribute('aria-expanded', String(!aperto));
      apri.textContent = aperto ? '☰' : '✕';
    });
    testata.insertBefore(apri, testata.querySelector('#tema'));
  }
})();
