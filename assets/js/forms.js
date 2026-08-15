/* ============================================================
   INGLY DESIGN — CONTATTI E RICHIESTA PREVENTIVO
   ------------------------------------------------------------
   Campi richiesti dal master command §18:
   nome, email, telefono, azienda, tipologia, prodotto, quantità,
   personalizzazione, messaggio, allegato.

   Il sito è statico: senza backend il form compone una email
   precompilata (mailto:) invece di fingere un invio che non avviene.
   Quando ci sarà un endpoint, basta valorizzare CONFIG.forms.endpoint.
   ============================================================ */

import { $, $$, esc, loc, icon } from './utils.js';
import { publicProducts } from './catalog.js';

let D = null, lang = 'it', t = () => '';

export function initForms(data, l, translate) { D = data; lang = l; t = translate; }

export function renderContact(root, query) {
  const c = D.CONTENT?.contatti || {};
  const cfg = D.CONFIG || {};
  const preselect = query?.get('prodotto') || '';
  const type = query?.get('tipo') || '';
  const products = publicProducts();

  root.innerHTML = `
    <div class="container container--narrow">
      <header class="page-head">
        <p class="eyebrow">${esc(loc(c.eyebrow, lang))}</p>
        <h1>${esc(loc(c.title, lang))}</h1>
        <p>${esc(loc(c.lead, lang))}</p>
      </header>

      <p class="form-note">${esc(loc(c.responseTime, lang))}</p>

      <form class="form-grid" id="contactForm" novalidate style="margin-top:var(--sp-6)">
        <div class="field">
          <label for="f-name">${esc(t('form.name'))}</label>
          <input type="text" id="f-name" name="name" required autocomplete="name" aria-describedby="e-name">
          <span class="field-error" id="e-name" aria-live="polite"></span>
        </div>

        <div class="grid grid--2">
          <div class="field">
            <label for="f-email">${esc(t('form.email'))}</label>
            <input type="email" id="f-email" name="email" required autocomplete="email" aria-describedby="e-email">
            <span class="field-error" id="e-email" aria-live="polite"></span>
          </div>
          <div class="field">
            <label for="f-phone">${esc(t('form.phone'))} <span class="opt">(${esc(t('form.optional'))})</span></label>
            <input type="tel" id="f-phone" name="phone" autocomplete="tel">
          </div>
        </div>

        <div class="grid grid--2">
          <div class="field">
            <label for="f-company">${esc(t('form.company'))} <span class="opt">(${esc(t('form.optional'))})</span></label>
            <input type="text" id="f-company" name="company" autocomplete="organization">
          </div>
          <div class="field">
            <label for="f-type">${esc(t('form.type'))}</label>
            <select id="f-type" name="type">
              <option value="b2c" ${type === 'b2c' ? 'selected' : ''}>${esc(t('form.typeB2c'))}</option>
              <option value="b2b" ${type === 'b2b' ? 'selected' : ''}>${esc(t('form.typeB2b'))}</option>
              <option value="evento" ${type === 'evento' ? 'selected' : ''}>${esc(t('form.typeEvent'))}</option>
              <option value="custom" ${type === 'custom' ? 'selected' : ''}>${esc(t('form.typeCustom'))}</option>
            </select>
          </div>
        </div>

        <div class="grid grid--2">
          <div class="field">
            <label for="f-product">${esc(t('form.product'))} <span class="opt">(${esc(t('form.optional'))})</span></label>
            <select id="f-product" name="product">
              <option value="">—</option>
              ${products.map((p) => `
                <option value="${esc(p.id)}" ${p.id === preselect ? 'selected' : ''}>
                  ${esc(p.name)} — ${esc(p.subtitle)}
                </option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label for="f-qty">${esc(t('form.quantity'))} <span class="opt">(${esc(t('form.optional'))})</span></label>
            <input type="number" id="f-qty" name="quantity" min="1" step="1" inputmode="numeric">
          </div>
        </div>

        <div class="field">
          <label for="f-custom">${esc(t('form.customization'))} <span class="opt">(${esc(t('form.optional'))})</span></label>
          <input type="text" id="f-custom" name="customization" placeholder="logo, colore, misura, testo…">
        </div>

        <div class="field">
          <label for="f-message">${esc(t('form.message'))}</label>
          <textarea id="f-message" name="message" required aria-describedby="e-message"></textarea>
          <span class="field-error" id="e-message" aria-live="polite"></span>
        </div>

        <div class="field">
          <label for="f-file">${esc(t('form.attachment'))} <span class="opt">(${esc(t('form.optional'))})</span></label>
          <input type="file" id="f-file" name="attachment" accept=".pdf,.svg,.ai,.eps,.dxf,.png,.jpg,.jpeg,.webp">
          <span class="field-error" id="e-file" aria-live="polite"></span>
        </div>

        <label class="checkbox">
          <input type="checkbox" id="f-privacy" name="privacy" required>
          <span>${esc(t('form.privacy'))}</span>
        </label>
        <span class="field-error" id="e-privacy" aria-live="polite"></span>

        <div class="hero-actions">
          <button type="submit" class="btn btn--primary btn--lg">${esc(t('cta.send'))} ${icon('arrow', 16)}</button>
          ${cfg.contact?.whatsapp ? `
            <a class="btn btn--outline btn--lg" href="${esc(cfg.contact.whatsapp)}" target="_blank" rel="noopener">
              ${icon('whatsapp', 16)} ${esc(t('cta.whatsapp'))}
            </a>` : ''}
        </div>

        <p class="form-status" id="formStatus" role="status" aria-live="polite"></p>
      </form>

      ${cfg.contact?.email ? `
        <p style="margin-top:var(--sp-6);font-size:var(--fs-sm);color:var(--text-3)">
          Oppure scrivi direttamente a
          <a href="mailto:${esc(cfg.contact.email)}" style="color:var(--accent-text)">${esc(cfg.contact.email)}</a>.
        </p>` : ''}
    </div>`;

  bindForm();
}

function setError(id, message) {
  const el = $(`#e-${id}`);
  const input = $(`#f-${id}`);
  if (el) el.textContent = message || '';
  if (input) {
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }
  return !message;
}

function validate(form) {
  let ok = true;
  const data = new FormData(form);

  ok = setError('name', String(data.get('name') || '').trim() ? '' : t('form.required')) && ok;

  const email = String(data.get('email') || '').trim();
  if (!email) ok = setError('email', t('form.required')) && ok;
  else ok = setError('email', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? '' : t('form.invalidEmail')) && ok;

  ok = setError('message', String(data.get('message') || '').trim() ? '' : t('form.required')) && ok;
  ok = setError('privacy', $('#f-privacy')?.checked ? '' : t('form.required')) && ok;

  return ok;
}

function bindForm() {
  const form = $('#contactForm');
  if (!form) return;
  const status = $('#formStatus');
  const cfg = D.CONFIG || {};

  // Un allegato non può viaggiare in un mailto: lo si segnala invece di perderlo.
  $('#f-file')?.addEventListener('change', (e) => {
    const has = e.target.files?.length;
    const el = $('#e-file');
    if (el) {
      el.style.color = 'var(--text-3)';
      el.textContent = has
        ? 'Il file non può essere allegato automaticamente: te lo richiedo nella risposta via email.'
        : '';
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate(form)) {
      status.dataset.state = 'err';
      status.textContent = t('form.error');
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    const d = Object.fromEntries(new FormData(form));
    const product = d.product ? publicProducts().find((p) => p.id === d.product) : null;

    const endpoint = cfg.forms?.endpoint;
    if (endpoint) {
      submitToEndpoint(endpoint, d, form, status);
      return;
    }

    // Nessun backend configurato: si apre il client di posta con tutto compilato.
    const subject = product
      ? `Richiesta — ${product.name} (${product.id})`
      : 'Richiesta di preventivo — INGLY DESIGN';

    const body = [
      `Nome: ${d.name}`,
      `Email: ${d.email}`,
      d.phone ? `Telefono: ${d.phone}` : null,
      d.company ? `Azienda: ${d.company}` : null,
      `Tipologia: ${d.type}`,
      product ? `Creazione: ${product.name} — ${product.subtitle} (${product.id})` : null,
      d.quantity ? `Quantità: ${d.quantity}` : null,
      d.customization ? `Personalizzazione: ${d.customization}` : null,
      '',
      d.message
    ].filter(Boolean).join('\n');

    const to = cfg.contact?.email || '';
    location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    status.dataset.state = 'ok';
    status.textContent = 'Ho aperto il tuo client di posta con la richiesta già compilata. Controlla che si sia aperto e premi invia.';
  });
}

async function submitToEndpoint(endpoint, data, form, status) {
  const btn = form.querySelector('button[type="submit"]');
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.textContent = t('form.sending');
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(form)
    });
    if (!res.ok) throw new Error(String(res.status));
    form.reset();
    status.dataset.state = 'ok';
    status.textContent = t('form.success');
  } catch {
    status.dataset.state = 'err';
    status.textContent = t('form.error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = original;
  }
}
