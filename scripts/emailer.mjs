// ─────────────────────────────────────────────────────────────
//  Jessiclean – envoi automatique des courriels aux clients
//  • Confirmations de soumission (mises en file par l'Admin dans « mail »)
//  • Rappels 24 h avant chaque visite (clients avec courriel et rappels activés)
//  Exécuté toutes les 15 minutes par GitHub Actions (.github/workflows/courriels.yml).
//  Secrets requis : FIREBASE_SERVICE_ACCOUNT (JSON) et BREVO_API_KEY.
// ─────────────────────────────────────────────────────────────

export const SITE = 'https://jessiclean.ca';
const PHONE = '819 598-0121';
const REVIEW_URL = 'https://g.page/r/CU_e0nV6l4pZEAI/review';
const REMIND_HOURS = 24;       // envoyer le rappel quand la visite commence dans 24 h ou moins…
const REMIND_MIN_HOURS = 2;    // …mais pas si elle commence dans moins de 2 h
const MAX_TRIES = 3;
const THANKS_AFTER_H = 3;      // remerciement : au moins 3 h après la fin de la visite…
const THANKS_MAX_H = 48;       // …et au plus 48 h après
const THANKS_EVERY_DAYS = 90;  // au plus un remerciement par client tous les 90 jours
const SEND_FROM_H = 9, SEND_TO_H = 20; // seulement en journée

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
Satisfait de nos services ? <a href="${REVIEW_URL}" style="color:#8a4a91;font-weight:600">Laissez-nous un avis Google</a>, ça nous aide énormément.<br>
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

export function customEmail(m) {
  const paras = String(m.message || '').trim().split(/\n\s*\n/).map(p => `<p style="margin:0 0 14px">${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
  const sign = `<p style="margin:18px 0 0">${esc(m.signature || 'Jessica Matte Hamelin')}<br><span style="color:#6c5f72">Jessiclean · Entretien ménager</span></p>`;
  const html = layout(m.subject || 'Un message de Jessiclean', paras + sign, null)
    .replace(/Satisfait de nos services \? <a [^>]*>Laissez-nous un avis Google<\/a>, ça nous aide énormément\.<br>\n/, '');
  return { subject: m.subject || 'Un message de Jessiclean', html };
}

export function thanksEmail(m) {
  const link = m.code ? `${SITE}/?code=${encodeURIComponent(m.code)}#client` : '';
  const body = `<p style="margin:0 0 12px">Bonjour ${esc(m.name)},</p>
<p style="margin:0 0 12px">Merci de nous avoir fait confiance pour le ménage du ${esc(longDate(m.date))}${m.emp ? `, avec ${esc(m.emp)}` : ''}. Nous espérons que vous êtes ravi du résultat&nbsp;!</p>
<p style="margin:0 0 12px">Votre avis compte énormément pour une petite entreprise comme la nôtre. <b>Pourriez-vous prendre une minute pour nous laisser un avis sur Google&nbsp;?</b> Cela aide d’autres familles de l’Outaouais à nous trouver.</p>
<p style="margin:0">Quelque chose n’était pas à votre goût&nbsp;? Répondez simplement à ce courriel${link ? ` ou écrivez-nous depuis <a href="${esc(link)}" style="color:#8a4a91">votre espace client</a>` : ''} : on s’en occupe.</p>`;
  const html = layout('Merci pour votre confiance', body, { href: REVIEW_URL, label: '★ Laisser un avis Google' })
    .replace(/Satisfait de nos services \? <a [^>]*>Laissez-nous un avis Google<\/a>, ça nous aide énormément\.<br>\n/, '');
  return { subject: 'Merci pour votre confiance – Jessiclean', html };
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

export async function brevoSend({ apiKey, sender, to, name, subject, html, attachment, senderName = 'Jessiclean', fetchImpl = fetch }) {
  const res = await fetchImpl('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(Object.assign({ sender: { email: sender, name: senderName }, replyTo: { email: sender, name: 'Jessiclean' }, to: [{ email: to, name: name || to }], subject, htmlContent: html }, attachment ? { attachment } : {}))
  });
  if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error(`Brevo ${res.status} ${t.slice(0, 200)}`); }
}

export async function brevoPing({ apiKey, fetchImpl = fetch }) {
  const res = await fetchImpl('https://api.brevo.com/v3/smtp/statistics/aggregatedReport?days=1', { headers: { 'api-key': apiKey, accept: 'application/json' } });
  if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error(`Brevo ${res.status} ${t.slice(0, 200)}`); }
}

// ---------- Synchronisation de l'horaire vers Outlook (invitations de calendrier) ----------
const CAL_WINDOW_DAYS = 60;   // on envoie les ménages des 60 prochains jours (puis au fur et à mesure)
const CAL_MAX_PER_RUN = 25;   // au plus 25 invitations par passage (le programme tourne toutes les 15 min)
const icsTxt = s => String(s ?? '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/([,;])/g, '\\$1');
const icsUtc = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const icsFold = l => { const out = []; while (l.length > 73) { out.push(l.slice(0, 73)); l = ' ' + l.slice(73); } out.push(l); return out.join('\r\n'); };
export function shiftKey(s, clients, emps) {
  const emp = (emps.find(e => e.id === s.emp) || {}).name || '';
  const c = clients.find(x => nk(x.name) === nk(s.client)) || {};
  return [s.date, s.start, s.end, s.client, s.addr || c.addr || '', emp, s.notes || ''].join('|');
}
export function shiftIcs({ s, clients, emps, method, seq, to, now = new Date() }) {
  const emp = (emps.find(e => e.id === s.emp) || {}).name || '';
  const c = clients.find(x => nk(x.name) === nk(s.client)) || {};
  const addr = s.addr || c.addr || '';
  const desc = ['Ménage Jessiclean' + (emp ? ' avec ' + emp : ''), c.phone ? 'Client : ' + c.phone : '', s.notes ? 'Notes : ' + s.notes : '', 'Géré depuis jessiclean.ca (Admin) : les changements faits ici seront remplacés.'].filter(Boolean).join('\n');
  const L = ['BEGIN:VCALENDAR', 'PRODID:-//Jessiclean//Horaire//FR', 'VERSION:2.0', 'CALSCALE:GREGORIAN', 'METHOD:' + method, 'BEGIN:VEVENT',
    'UID:menage-' + s.id + '@jessiclean.ca', 'SEQUENCE:' + seq, 'DTSTAMP:' + icsUtc(now),
    'DTSTART:' + icsUtc(visitStart(s.date, s.start)), 'DTEND:' + icsUtc(visitStart(s.date, s.end || s.start)),
    'SUMMARY:' + icsTxt((method === 'CANCEL' ? 'Annulé : ' : '') + 'Ménage – ' + (s.client || 'client')),
    addr ? 'LOCATION:' + icsTxt(addr) : '', 'DESCRIPTION:' + icsTxt(desc),
    'ORGANIZER;CN=Horaire Jessiclean:mailto:horaire@jessiclean.ca',
    'ATTENDEE;CN=' + icsTxt(to) + ';ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=FALSE:mailto:' + to,
    'STATUS:' + (method === 'CANCEL' ? 'CANCELLED' : 'CONFIRMED'), 'TRANSP:OPAQUE',
    method === 'CANCEL' ? '' : 'BEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:Ménage\r\nTRIGGER:-PT60M\r\nEND:VALARM',
    'END:VEVENT', 'END:VCALENDAR'].filter(Boolean);
  return L.map(l => l.includes('\r\n') ? l : icsFold(l)).join('\r\n') + '\r\n';
}
function calHtml(s, method) {
  const body = `<p style="margin:0 0 12px">${method === 'CANCEL' ? 'Ce ménage a été <b>retiré</b> de l’horaire du site.' : 'Ménage ajouté ou modifié dans l’horaire du site.'}</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px;background:#f7f0f8;border-radius:14px;width:100%"><tr><td style="padding:14px 18px">
<div style="font-size:19px;font-weight:600;color:#3b1a42">${esc(s.client || 'Client')}</div>
<div style="font-size:16px;color:#3f3445;margin-top:4px">${esc(cap(longDate(s.date)))}, de ${esc(fmtH(s.start))} à ${esc(fmtH(s.end))}</div></td></tr></table>`;
  return layout(method === 'CANCEL' ? 'Ménage annulé' : 'Horaire mis à jour', body, null);
}
const calDocId = (shiftId, to) => (shiftId + '__' + to).replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 300);
// to : liste d'adresses. skipSrc : { 'adresse': 'outlook' } → ne pas renvoyer à cette adresse les ménages importés de son propre Outlook
export async function calSync({ db, shifts, clients, emps, now, sendCal, recipients, skipSrc = {}, log = console.log }) {
  if (!sendCal || !recipients.length) return { sent: 0, errors: 0 };
  const state = await db.collection('calsync').get().then(docs);
  const today = visitStart(new Date(now).toLocaleDateString('en-CA', { timeZone: 'America/Toronto' }), '00:00');
  const limit = new Date(today.getTime() + CAL_WINDOW_DAYS * 864e5);
  let sent = 0, errors = 0, lastError = '';
  const byId = new Map(shifts.map(s => [s.id, s]));
  const jobs = [];
  for (const to of recipients) {
    for (const s of shifts) {
      if (!s.date || !s.start) continue;
      if (skipSrc[nk(to)] && s.src === skipSrc[nk(to)]) continue;
      const st = visitStart(s.date, s.start), id = calDocId(s.id, to), prev = state.find(x => x.id === id);
      if (st < today) continue;
      if (st > limit && !prev) continue;
      const key = shiftKey(s, clients, emps);
      if (prev && prev.key === key) continue;
      jobs.push({ kind: 'REQUEST', s, to, id, seq: prev ? (prev.seq || 0) + 1 : 0, key, date: s.date });
    }
  }
  for (const p of state) {
    const s = byId.get(p.shiftId);
    const skipped = s && skipSrc[nk(p.to)] && s.src === skipSrc[nk(p.to)];
    if (s && !skipped && recipients.includes(p.to)) continue;
    if (visitStart(p.date, p.start || '00:00') < today || !recipients.includes(p.to)) { await db.collection('calsync').doc(p.id).delete(); continue; }
    jobs.push({ kind: 'CANCEL', s: { id: p.shiftId, date: p.date, start: p.start, end: p.end, client: p.client, addr: p.addr }, to: p.to, id: p.id, seq: (p.seq || 0) + 1 });
  }
  jobs.sort((a, b) => (a.kind === 'CANCEL' ? 0 : 1) - (b.kind === 'CANCEL' ? 0 : 1) || String(a.s.date).localeCompare(String(b.s.date)));
  for (const j of jobs.slice(0, CAL_MAX_PER_RUN)) {
    try {
      const ics = shiftIcs({ s: j.s, clients, emps, method: j.kind, seq: j.seq, to: j.to, now });
      const subject = (j.kind === 'CANCEL' ? 'Annulé : ' : '') + 'Ménage – ' + (j.s.client || 'client') + ' – ' + longDate(j.s.date) + ' ' + fmtH(j.s.start);
      await sendCal({ to: j.to, subject, html: calHtml(j.s, j.kind), ics, method: j.kind });
      if (j.kind === 'CANCEL') await db.collection('calsync').doc(j.id).delete();
      else await db.collection('calsync').doc(j.id).set({ shiftId: j.s.id, to: j.to, key: j.key, seq: j.seq, date: j.s.date, start: j.s.start, end: j.s.end || '', client: j.s.client || '', addr: j.s.addr || '', sentAt: now.getTime() });
      sent++; log(`Calendrier (${j.kind === 'CANCEL' ? 'annulation' : 'invitation'}) ${j.s.client} ${j.s.date} → ${j.to}`);
    } catch (e) { errors++; lastError = String(e.message || e); log(`Échec calendrier ${j.to} : ${lastError}`); }
  }
  if (jobs.length > CAL_MAX_PER_RUN) log(`Calendrier : ${jobs.length - CAL_MAX_PER_RUN} invitation(s) au prochain passage.`);
  return { sent, errors, lastError, pending: Math.max(0, jobs.length - CAL_MAX_PER_RUN) };
}

// ---------- Calendrier « abonnement » privé (pour Jessiclean seulement, jamais pour les clients) ----------
// Publié dans un Gist secret ; Outlook s'y abonne avec « Ajouter un calendrier → S'abonner à partir du web ».
export function feedIcs({ shifts, clients, emps, now = new Date(), excludeSrc = null, name = 'Horaire Jessiclean (site)' }) {
  const from = new Date(now.getTime() - 31 * 864e5);
  const L = ['BEGIN:VCALENDAR', 'PRODID:-//Jessiclean//Horaire//FR', 'VERSION:2.0', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:' + icsTxt(name), 'X-WR-TIMEZONE:America/Toronto', 'REFRESH-INTERVAL;VALUE=DURATION:PT1H', 'X-PUBLISHED-TTL:PT1H'];
  for (const s of [...shifts].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))) {
    if (!s.date || !s.start) continue;
    if (excludeSrc && s.src === excludeSrc) continue;
    if (visitStart(s.date, s.start) < from) continue;
    const emp = (emps.find(e => e.id === s.emp) || {}).name || '';
    const c = clients.find(x => nk(x.name) === nk(s.client)) || {};
    const addr = s.addr || c.addr || '';
    const desc = [emp ? 'Employée : ' + emp : 'Employée : non assignée', c.phone ? 'Client : ' + c.phone : '', s.notes ? 'Notes : ' + s.notes : '', 'Modifier dans jessiclean.ca → Admin'].filter(Boolean).join('\n');
    L.push('BEGIN:VEVENT', 'UID:menage-' + s.id + '@jessiclean.ca', 'DTSTAMP:' + icsUtc(now),
      'DTSTART:' + icsUtc(visitStart(s.date, s.start)), 'DTEND:' + icsUtc(visitStart(s.date, s.end || s.start)),
      'SUMMARY:' + icsTxt('Ménage – ' + (s.client || 'client') + (emp ? ' (' + emp.split(' ')[0] + ')' : '')));
    if (addr) L.push('LOCATION:' + icsTxt(addr));
    L.push('DESCRIPTION:' + icsTxt(desc), 'STATUS:CONFIRMED', 'TRANSP:OPAQUE', 'END:VEVENT');
  }
  L.push('END:VCALENDAR');
  return L.map(icsFold).join('\r\n') + '\r\n';
}
const FEED_FILES = { full: 'horaire-jessiclean.ics', noOutlook: 'horaire-jessiclean-sans-outlook.ics' };
export async function publishFeed({ db, shifts, clients, emps, now, token, fetchImpl = fetch, log = console.log }) {
  if (!token) return null;
  const sys = await db.collection('system').doc('calfeed').get();
  const prev = (sys.exists ? sys.data() : null) || {};
  const files = {
    [FEED_FILES.full]: feedIcs({ shifts, clients, emps, now }),
    [FEED_FILES.noOutlook]: feedIcs({ shifts, clients, emps, now, excludeSrc: 'outlook', name: 'Horaire Jessiclean (site, sans Outlook)' })
  };
  const sig = Object.values(files).map(t => t.replace(/DTSTAMP:\d+T\d+Z/g, '')).join('').length + ':' + [...Object.values(files).join('').replace(/DTSTAMP:\d+T\d+Z/g, '')].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  if (prev.gistId && prev.sig === sig) return prev;
  const H = { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json', 'User-Agent': 'jessiclean-horaire' };
  const body = { description: 'Horaire Jessiclean (privé)', files: Object.fromEntries(Object.entries(files).map(([k, v]) => [k, { content: v }])) };
  let res = prev.gistId ? await fetchImpl('https://api.github.com/gists/' + prev.gistId, { method: 'PATCH', headers: H, body: JSON.stringify(body) }) : null;
  if (!res || res.status === 404) res = await fetchImpl('https://api.github.com/gists', { method: 'POST', headers: H, body: JSON.stringify(Object.assign({ public: false }, body)) });
  if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error(`GitHub ${res.status} ${t.slice(0, 160)}`); }
  const g = await res.json(), login = (g.owner && g.owner.login) || prev.login || '';
  const base = `https://gist.githubusercontent.com/${login}/${g.id}/raw/`;
  const out = { gistId: g.id, login, sig, updatedAt: now.getTime(), urlFull: base + FEED_FILES.full, urlNoOutlook: base + FEED_FILES.noOutlook, count: shifts.length };
  await db.collection('system').doc('calfeed').set(out);
  log('Calendrier abonnement mis à jour (' + shifts.length + ' ménages).');
  return out;
}

const docs = snap => snap.docs.map(d => Object.assign({ id: d.id }, d.data()));

// Logique principale, testable avec une fausse base de données.
export async function run({ db, send, ping, sendCal, calTo = [], calSkip = {}, feedToken = '', now = new Date(), log = console.log }) {
  const [clients, shifts, emps, mails, system] = await Promise.all(['clients', 'shifts', 'employees', 'mail', 'system'].map(c => db.collection(c).get().then(docs)));
  const prevState = system.find(x => x.id === 'mailer') || {};
  let sent = 0, errors = 0, lastError = '';

  // 1) Courriels en attente (confirmations de soumission)
  const TPL = { confirm: confirmEmail, thanks: thanksEmail, reminder: reminderEmail, custom: customEmail };
  for (const m of mails.filter(x => x.status === 'pending' && (x.type === 'confirm' || x.type === 'custom' || x.test))) {
    try {
      if (!m.to) throw new Error('Aucune adresse courriel');
      const tpl = TPL[m.type]; if (!tpl) throw new Error('Type inconnu : ' + m.type);
      let { subject, html } = tpl(m);
      if (m.test) subject = '[TEST] ' + subject;
      await send({ to: m.to, name: m.name, subject, html });
      await db.collection('mail').doc(m.id).update({ status: 'sent', sentAt: now.getTime(), error: '' });
      sent++; log(`${m.test ? 'Test' : 'Confirmation'} (${m.type}) envoyé à ${m.to}`);
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

  // 2b) Remerciement après la visite (avec demande d'avis Google)
  const hourNow = now.getHours();
  if (hourNow >= SEND_FROM_H && hourNow < SEND_TO_H) {
    const recentThanks = email => mails.some(m => m.type === 'thanks' && nk(m.to) === nk(email) && (m.status === 'sent') && now.getTime() - (m.sentAt || m.ts || 0) < THANKS_EVERY_DAYS * 864e5);
    const thanked = new Set();
    for (const s of [...shifts].sort((a, b) => (b.date + b.end).localeCompare(a.date + a.end))) {
      if (!s.client || !s.date || !s.end) continue;
      const c = clients.find(x => nk(x.name) === nk(s.client));
      if (!c || !c.email || c.remind === false || thanked.has(nk(c.email))) continue;
      const after = (now - visitStart(s.date, s.end)) / 36e5;
      if (after < THANKS_AFTER_H || after > THANKS_MAX_H) continue;
      const id = ('thx_' + s.id + '_' + s.date).replace(/[^A-Za-z0-9_-]/g, '');
      const prev = mails.find(m => m.id === id);
      if (prev && (prev.status === 'sent' || (prev.tries || 0) >= MAX_TRIES)) continue;
      if (recentThanks(c.email)) continue;
      thanked.add(nk(c.email));
      const emp = (emps.find(e => e.id === s.emp) || {}).name || '';
      const data = { type: 'thanks', to: c.email, name: c.name, date: s.date, start: s.start, end: s.end, emp: emp.split(' ')[0], code: c.code || '', ts: now.getTime() };
      try {
        const { subject, html } = thanksEmail(data);
        await send({ to: c.email, name: c.name, subject, html });
        await db.collection('mail').doc(id).set(Object.assign(data, { status: 'sent', sentAt: now.getTime(), tries: (prev && prev.tries || 0) + 1, error: '' }));
        mails.push(Object.assign({ id }, data, { status: 'sent', sentAt: now.getTime() }));
        sent++; log(`Remerciement envoyé à ${c.email} pour le ${s.date}`);
      } catch (e) {
        errors++; lastError = String(e.message || e);
        const tries = (prev && prev.tries || 0) + 1;
        await db.collection('mail').doc(id).set(Object.assign(data, { status: tries >= MAX_TRIES ? 'error' : 'pending', tries, error: lastError }));
        log(`Échec remerciement ${c.email} : ${lastError}`);
      }
    }
  }

  // 2c) Horaire envoyé dans Outlook (invitations de calendrier)
  let calRes = { sent: 0, errors: 0, pending: 0 };
  try { calRes = await calSync({ db, shifts, clients, emps, now, sendCal, recipients: calTo, skipSrc: calSkip, log }); }
  catch (e) { calRes.errors = 1; calRes.lastError = String(e.message || e); log('Synchronisation calendrier : ' + calRes.lastError); }
  if (calRes.errors) { errors += calRes.errors; lastError = 'Calendrier : ' + calRes.lastError; }
  if (calRes.sent) sent += calRes.sent;

  // 2d) Calendrier « abonnement » privé (Gist secret)
  if (feedToken) {
    try { await publishFeed({ db, shifts, clients, emps, now, token: feedToken, log }); }
    catch (e) { errors++; lastError = 'Calendrier abonnement : ' + String(e.message || e); log(lastError); }
  }

  // 3) Garder la clé Brevo active (elle expire après 90 jours sans utilisation) : un appel par jour
  let lastPing = prevState.lastPing || 0;
  if (ping && sent === 0 && now.getTime() - lastPing > 24 * 36e5) {
    try { await ping(); lastPing = now.getTime(); log('Vérification quotidienne Brevo : OK'); }
    catch (e) { errors++; lastError = 'Clé Brevo : ' + String(e.message || e); log(lastError); }
  }
  if (sent > 0) lastPing = now.getTime();
  await db.collection('system').doc('mailer').set({ lastRun: now.getTime(), lastSent: sent, lastErrors: errors, lastError, lastPing, calTo, calSent: (prevState.calSent || 0) + calRes.sent, calPending: calRes.pending || 0, calSmtp: !!(sendCal && sendCal.smtp) });
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
  const calTo = (process.env.CAL_TO || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
  const calSkip = {}; (process.env.CAL_SKIP_OUTLOOK || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean).forEach(a => { calSkip[a] = 'outlook'; });
  let sendCal = null;
  if (calTo.length && process.env.BREVO_SMTP_LOGIN && process.env.BREVO_SMTP_KEY) {
    // Vraie invitation (ajoutée automatiquement au calendrier Outlook)
    const { default: nodemailer } = await import('nodemailer');
    const tr = nodemailer.createTransport({ host: 'smtp-relay.brevo.com', port: 587, secure: false, auth: { user: process.env.BREVO_SMTP_LOGIN, pass: process.env.BREVO_SMTP_KEY } });
    sendCal = ({ to, subject, html, ics, method }) => tr.sendMail({ from: { name: 'Horaire Jessiclean', address: sender }, to, subject, html, icalEvent: { method, filename: 'menage.ics', content: ics } });
    sendCal.smtp = true;
  } else if (calTo.length) {
    // Repli : invitation jointe (.ics) — Outlook propose « Ajouter au calendrier »
    sendCal = ({ to, subject, html, ics }) => brevoSend({ apiKey: key, sender, senderName: 'Horaire Jessiclean', to, subject, html, attachment: [{ name: 'menage.ics', content: Buffer.from(ics).toString('base64') }] });
  }
  await run({ db, send: m => brevoSend(Object.assign({ apiKey: key, sender }, m)), ping: () => brevoPing({ apiKey: key }), sendCal, calTo, calSkip, feedToken: process.env.GIST_TOKEN || '' });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(e => { console.error(e); process.exit(1); });
}
