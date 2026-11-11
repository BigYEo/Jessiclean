// ─────────────────────────────────────────────────────────────
//  Jessiclean – envoi automatique des courriels aux clients
//  • Confirmations de soumission (mises en file par l'Admin dans « mail »)
//  • Rappels 24 h avant chaque visite (clients avec courriel et rappels activés)
//  Exécuté toutes les 15 minutes par GitHub Actions (.github/workflows/courriels.yml).
//  Secrets requis : FIREBASE_SERVICE_ACCOUNT (JSON) et BREVO_API_KEY.
// ─────────────────────────────────────────────────────────────

export const SITE = 'https://jessiclean.ca';
const PHONE = '819 598-0121';
const REMIND_HOURS = 24;       // envoyer le rappel quand la visite commence dans 24 h ou moins…
const REMIND_MIN_HOURS = 2;    // …mais pas si elle commence dans moins de 2 h
const MAX_TRIES = 3;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nk = s => String(s || '').trim().toLowerCase();
const fmtH = t => { const [h, m] = String(t || '').split(':'); return h == null ? '' : (+h) + ' h' + (m && m !== '00' ? ' ' + m : ''); };
const dObj = d => new Date(d + 'T12:00:00');
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const longDate = d => dObj(d).toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Toronto' });

// Heure de début d'une visite (date et heure locales de Gatineau, fuseau America/Toronto)
export function visitStart(date, start) {
  // Le programme tourne avec TZ=America/Toronto : la date locale est interprétée dans ce fuseau.
  return new Date(`${date}T${start || '00:00'}:00`);
}

function layout(title, bodyHtml, button) {
  return `<!DOCTYPE html><html lang="fr"><body style="margin:0;background:#f7f0f8;font-family:Helvetica,Arial,sans-serif;color:#1e1422">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f0f8;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e6dcea">
<tr><td style="padding:22px 28px 10px;text-align:center"><img src="${SITE}/img/logo-sm.jpg" alt="Jessiclean" width="160" style="display:inline-block;height:auto;border:0"></td></tr>
<tr><td style="padding:6px 28px 0"><h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;font-weight:600;color:#3b1a42">${esc(title)}</h1>
<div style="font-size:17px;line-height:1.6;color:#3f3445">${bodyHtml}</div></td></tr>
${button ? `<tr><td style="padding:22px 28px 6px"><a href="${esc(button.href)}" style="display:inline-block;background:#8a4a91;color:#ffffff;text-decoration:none;font-weight:600;font-size:17px;padding:14px 26px;border-radius:999px">${esc(button.label)}</a></td></tr>` : ''}
<tr><td style="padding:22px 28px 26px;font-size:15px;line-height:1.5;color:#6c5f72;border-top:1px solid #efe6f1">
Une question ? Répondez simplement à ce courriel ou appelez-nous au <a href="tel:+18195980121" style="color:#8a4a91">${PHONE}</a> (24 h sur 24, 7 jours sur 7).<br>
Jessiclean · Entretien ménager en Outaouais · <a href="${SITE}" style="color:#8a4a91">jessiclean.ca</a></td></tr>
</table></td></tr></table></body></html>`;
}

export function confirmEmail(m) {
  const link = m.code ? `${SITE}/?code=${encodeURIComponent(m.code)}#client` : '';
  const body = `<p style="margin:0 0 12px">Bonjour ${esc(m.name)},</p>
<p style="margin:0 0 12px">Bonne nouvelle : votre demande${m.service ? ` pour <b>${esc(m.service.toLowerCase())}</b>` : ''} est <b>confirmée</b>.</p>
${m.message ? `<p style="margin:0 0 12px;white-space:pre-wrap">${esc(m.message)}</p>` : ''}
${link ? `<p style="margin:0">Dans votre espace client, vous pouvez voir vos prochaines visites, les confirmer et nous écrire.${m.code ? ` Votre code personnel : <b>${esc(m.code)}</b>.` : ''}</p>` : ''}`;
  return { subject: 'Votre demande est confirmée – Jessiclean', html: layout('Votre demande est confirmée', body, link ? { href: link, label: 'Ouvrir mon espace client' } : null) };
}

export function reminderEmail(m) {
  const link = m.code ? `${SITE}/?code=${encodeURIComponent(m.code)}#client` : '';
  const body = `<p style="margin:0 0 12px">Bonjour ${esc(m.name)},</p>
<p style="margin:0 0 16px">Petit rappel : votre ménage est prévu</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;background:#f7f0f8;border-radius:14px;width:100%"><tr><td style="padding:16px 18px">
<div style="font-size:21px;font-weight:600;color:#3b1a42">${esc(cap(longDate(m.date)))}</div>
<div style="font-size:18px;color:#3f3445;margin-top:4px">de ${esc(fmtH(m.start))} à ${esc(fmtH(m.end))}${m.emp ? ` · avec ${esc(m.emp)}` : ''}</div>
${m.addr ? `<div style="font-size:15px;color:#6c5f72;margin-top:6px">${esc(m.addr)}</div>` : ''}
</td></tr></table>
<p style="margin:0">Besoin de déplacer la visite ? Faites-le depuis votre espace client ou appelez-nous.</p>`;
  return { subject: `Rappel : votre ménage ${longDate(m.date)} à ${fmtH(m.start)} – Jessiclean`, html: layout('Rappel de votre visite', body, link ? { href: link, label: 'Confirmer ou déplacer ma visite' } : null) };
}

export async function brevoSend({ apiKey, sender, to, name, subject, html, fetchImpl = fetch }) {
  const res = await fetchImpl('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ sender: { email: sender, name: 'Jessiclean' }, replyTo: { email: sender, name: 'Jessiclean' }, to: [{ email: to, name: name || to }], subject, htmlContent: html })
  });
  if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error(`Brevo ${res.status} ${t.slice(0, 200)}`); }
}

export async function brevoPing({ apiKey, fetchImpl = fetch }) {
  const res = await fetchImpl('https://api.brevo.com/v3/smtp/statistics/aggregatedReport?days=1', { headers: { 'api-key': apiKey, accept: 'application/json' } });
  if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error(`Brevo ${res.status} ${t.slice(0, 200)}`); }
}

const docs = snap => snap.docs.map(d => Object.assign({ id: d.id }, d.data()));

// Logique principale, testable avec une fausse base de données.
export async function run({ db, send, ping, now = new Date(), log = console.log }) {
  const [clients, shifts, emps, mails, system] = await Promise.all(['clients', 'shifts', 'employees', 'mail', 'system'].map(c => db.collection(c).get().then(docs)));
  const prevState = system.find(x => x.id === 'mailer') || {};
  let sent = 0, errors = 0, lastError = '';

  // 1) Courriels en attente (confirmations de soumission)
  for (const m of mails.filter(x => x.status === 'pending' && x.type === 'confirm')) {
    try {
      if (!m.to) throw new Error('Aucune adresse courriel');
      const { subject, html } = confirmEmail(m);
      await send({ to: m.to, name: m.name, subject, html });
      await db.collection('mail').doc(m.id).update({ status: 'sent', sentAt: now.getTime(), error: '' });
      sent++; log(`Confirmation envoyée à ${m.to}`);
    } catch (e) {
      const tries = (m.tries || 0) + 1; errors++; lastError = String(e.message || e);
      await db.collection('mail').doc(m.id).update({ tries, status: tries >= MAX_TRIES ? 'error' : 'pending', error: lastError });
      log(`Échec confirmation ${m.to} : ${lastError}`);
    }
  }

  // 2) Rappels 24 h avant chaque visite
  const already = new Set(mails.filter(m => m.type === 'reminder' && (m.status === 'sent' || (m.tries || 0) >= MAX_TRIES)).map(m => m.id));
  for (const s of shifts) {
    if (!s.client || !s.date || !s.start) continue;
    const c = clients.find(x => nk(x.name) === nk(s.client));
    if (!c || !c.email || c.remind === false) continue;
    const hours = (visitStart(s.date, s.start) - now) / 36e5;
    if (hours > REMIND_HOURS || hours < REMIND_MIN_HOURS) continue;
    const id = ('rem_' + s.id + '_' + s.date + '_' + s.start).replace(/[^A-Za-z0-9_-]/g, '');
    if (already.has(id)) continue;
    const emp = (emps.find(e => e.id === s.emp) || {}).name || '';
    const data = { type: 'reminder', to: c.email, name: c.name, date: s.date, start: s.start, end: s.end, emp: emp.split(' ')[0], addr: s.addr || c.addr || '', code: c.code || '', ts: now.getTime() };
    const prev = mails.find(m => m.id === id);
    try {
      const { subject, html } = reminderEmail(data);
      await send({ to: c.email, name: c.name, subject, html });
      await db.collection('mail').doc(id).set(Object.assign(data, { status: 'sent', sentAt: now.getTime(), tries: (prev && prev.tries || 0) + 1, error: '' }));
      sent++; log(`Rappel envoyé à ${c.email} pour le ${s.date} ${s.start}`);
    } catch (e) {
      errors++; lastError = String(e.message || e);
      const tries = (prev && prev.tries || 0) + 1;
      await db.collection('mail').doc(id).set(Object.assign(data, { status: tries >= MAX_TRIES ? 'error' : 'pending', tries, error: lastError }));
      log(`Échec rappel ${c.email} : ${lastError}`);
    }
  }

  // 3) Garder la clé Brevo active (elle expire après 90 jours sans utilisation) : un appel par jour
  let lastPing = prevState.lastPing || 0;
  if (ping && sent === 0 && now.getTime() - lastPing > 24 * 36e5) {
    try { await ping(); lastPing = now.getTime(); log('Vérification quotidienne Brevo : OK'); }
    catch (e) { errors++; lastError = 'Clé Brevo : ' + String(e.message || e); log(lastError); }
  }
  if (sent > 0) lastPing = now.getTime();
  await db.collection('system').doc('mailer').set({ lastRun: now.getTime(), lastSent: sent, lastErrors: errors, lastError, lastPing });
  log(`Terminé : ${sent} courriel(s) envoyé(s), ${errors} erreur(s).`);
  return { sent, errors };
}

// Exécution réelle (GitHub Actions)
async function main() {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT, key = process.env.BREVO_API_KEY;
  if (!sa || !key) { console.log('Courriels non configurés : ajoutez les secrets FIREBASE_SERVICE_ACCOUNT et BREVO_API_KEY dans GitHub.'); return; }
  const { default: admin } = await import('firebase-admin');
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(sa)) });
  const db = admin.firestore();
  const sender = process.env.SENDER_EMAIL || 'admin@jessiclean.ca';
  await run({ db, send: m => brevoSend(Object.assign({ apiKey: key, sender }, m)), ping: () => brevoPing({ apiKey: key }) });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(e => { console.error(e); process.exit(1); });
}
