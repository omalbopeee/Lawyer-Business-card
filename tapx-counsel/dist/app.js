import { profile } from './profile-config.js';

const app = document.querySelector('#app');
const dialog = document.querySelector('#info-dialog');
const tabs = ['profile', 'practice', 'forum'];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const icon = (name, extra = '') => `<svg class="icon ${extra}" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
const button = (text, action, style = 'dark', glyph = '') => `<button type="button" class="button button-${style}" data-action="${action}">${glyph ? icon(glyph) : ''}${text}</button>`;
const initials = name => name.split(/\s+/).map(x => x[0]).slice(0, 2).join('').toUpperCase();
const storageKey = 'tapx-counsel-community-v1';
const seedThreads = [
  { id: 'first-meeting', category: 'Practice', title: 'Preparing for a first client meeting', excerpt: 'Comparing our intake checklists.', author: 'R. Silva', initials: 'RS', time: '2h', body: 'What do you include in your initial client intake checklist? I’m looking to make the first conversation clearer for both the client and the lawyer.', replies: [
    { author: 'M. Fernando', initials: 'MF', body: 'Key dates, the people involved and a short document list help me structure the meeting.', time: '1h' },
    { author: 'R. Silva', initials: 'RS', body: 'Helpful starting points. Thank you.', time: '1h' }
  ] },
  { id: 'case-files', category: 'Practice', title: 'Keeping case files organised', excerpt: 'A conversation about better workflows.', author: 'M. Fernando', initials: 'MF', time: '5h', body: 'How do you keep your case files consistent across paper and digital documents? I’d love to hear about simple systems that work well for a small practice.', replies: [
    { author: 'R. Silva', initials: 'RS', body: 'A consistent naming convention and one shared index for each matter have been useful in our practice.', time: '3h' }
  ] },
  { id: 'mentoring', category: 'Career', title: 'Mentoring new associates', excerpt: 'Making room for learning in everyday practice.', author: 'N. Jayasinghe', initials: 'NJ', time: '1d', body: 'What helped you most when you started practice? Share a practical way to support new associates in their first few months.', replies: [] },
  { id: 'hearing-prep', category: 'Procedure', title: 'A more considered hearing checklist', excerpt: 'Sharing general preparation habits.', author: 'R. Silva', initials: 'RS', time: '1d', body: 'Do you have a general checklist for organising your documents before a hearing? Please keep examples general and leave out confidential case details.', replies: [] }
];
let community;
try { community = JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch { community = null; }
if (!community || !Array.isArray(community.threads) || !community.replies || typeof community.replies !== 'object') community = { threads: [], replies: {} };
community.threads = community.threads.filter(t => t && typeof t.id === 'string' && typeof t.title === 'string' && typeof t.body === 'string' && ['Practice', 'Procedure', 'Career'].includes(t.category));
const state = { tab: 0, route: 'welcome', opened: false, opening: false, filter: 'All', search: '', meeting: 'Video call', selectedThread: null, request: null, consultationDraft: null, discussionDraft: null, replyDraft: null };
let toastTimer;
let drag = null;
let suppressClickUntil = 0;
let lastFocus = null;

function allThreads() {
  return [...community.threads, ...seedThreads].map(t => ({ ...t, replies: [...(t.replies || []), ...(Array.isArray(community.replies[t.id]) ? community.replies[t.id] : [])] }));
}
function saveCommunity() {
  try { localStorage.setItem(storageKey, JSON.stringify(community)); return true; }
  catch { toast('Saved for this visit. Browser storage is unavailable.'); return false; }
}
function toast(message) {
  const el = document.querySelector('#toast');
  clearTimeout(toastTimer); el.textContent = message; el.classList.add('visible');
  toastTimer = setTimeout(() => el.classList.remove('visible'), 3400);
}
function showDialog(title, message, actions = '') {
  lastFocus = document.activeElement;
  dialog.innerHTML = `<h2>${esc(title)}</h2><p>${esc(message)}</p>${actions}${button('Done', 'close-dialog', 'light')}`;
  dialog.showModal();
}
dialog.addEventListener('close', () => lastFocus?.focus?.({ preventScroll: true }));
dialog.addEventListener('click', event => {
  if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); }
});
function header(title, back = 'welcome', end = '') {
  return `<header class="topbar"><button class="round-button" type="button" data-action="back" data-target="${back}" aria-label="Go back">${icon('back')}</button><div class="topbar-title">${title}</div><div class="topbar-end">${end}</div></header>`;
}
function jacket() {
  return `<div class="jacket-wrap"><div class="jacket" id="jacket" aria-label="A black lawyer’s jacket card that opens to reveal A. Perera’s profile" role="img">
    <div class="jacket-tab"></div><div class="jacket-inside"><div class="mini-avatar">${esc(profile.initials)}</div><h2>${esc(profile.name)}</h2><p>${esc(profile.title)}</p><div class="mini-save">Save contact</div><div class="mini-line"></div><div class="mini-line short"></div></div>
    <div class="jacket-half left"><svg viewBox="0 0 150 405" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="jacket-left" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#2a2b2f"/><stop offset="1" stop-color="#18191c"/></linearGradient></defs><path d="M22 1H150V404H22Q1 404 1 382V23Q1 1 22 1Z" fill="url(#jacket-left)" stroke="#46474e"/><path d="M45 28 142 63 96 171 64 103 20 49Z" fill="#333439"/><path d="m45 28 97 35-46 108" fill="none" stroke="#51525b"/><path d="m126 61 16 3-12 72-14-3Z" fill="#f9f9fa"/><path d="M1 312H150" stroke="#ffffff03"/><path d="M150 1V404" stroke="#62636a"/></svg></div>
    <div class="jacket-half right"><svg viewBox="0 0 150 405" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="jacket-right" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#27282c"/><stop offset="1" stop-color="#17181b"/></linearGradient></defs><path d="M0 1H128Q149 1 149 23V382Q149 404 128 404H0Z" fill="url(#jacket-right)" stroke="#46474e"/><path d="m105 28-97 35 46 108 32-68 44-54Z" fill="#333439"/><path d="M105 28 8 63l46 108" fill="none" stroke="#51525b"/><path d="m24 61-16 3 12 72 14-3Z" fill="#f9f9fa"/><path d="M0 312H149" stroke="#ffffff03"/></svg></div>
    <div class="jacket-name"><strong>${esc(profile.name)}</strong><span>${esc(profile.title)}</span></div>
  </div></div>`;
}
function renderWelcome() {
  app.classList.add('is-landing');
  app.innerHTML = `<main class="landing"><a class="brand" href="#welcome" aria-label="Counsel home">${icon('scales')}<span>COUNSEL</span></a><div class="landing-grid"><div class="landing-copy"><h1 id="welcome-heading"><span>Your counsel.</span><span>One tap away.</span></h1><p class="landing-subtitle" id="welcome-subtitle">A personal introduction, thoughtfully presented.</p></div>${jacket()}<div class="landing-actions"><div class="opening-progress" id="opening-progress" hidden><span></span></div><button class="button button-dark" data-action="open-profile" id="open-profile">${icon('arrow')}<span>Open profile</span></button><p class="landing-credit">Digital profile by <a href="#" data-action="about">TAPX</a></p></div></div><p class="landing-hint">An introduction, at your own pace.</p></main>`;
  if (state.opened) {
    document.querySelector('#jacket').classList.add('is-open');
    document.querySelector('#welcome-heading').innerHTML = '<span>An introduction</span><span>worth opening.</span>';
    document.querySelector('#welcome-subtitle').textContent = 'Your digital counsel profile.';
    document.querySelector('#open-profile span').textContent = `Meet ${profile.name}`;
  }
}
function openProfile() {
  if (state.opening) return;
  if (state.opened) { navigate('profile'); return; }
  state.opening = true;
  const heading = document.querySelector('#welcome-heading');
  heading.innerHTML = '<span>An introduction</span><span>worth opening.</span>';
  if (!reducedMotion.matches) heading.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 550, easing: 'cubic-bezier(.22,1,.36,1)' });
  document.querySelector('#welcome-subtitle').textContent = 'Your digital counsel profile.';
  document.querySelector('#jacket').classList.add('is-open');
  const progress = document.querySelector('#opening-progress'); progress.hidden = false;
  requestAnimationFrame(() => progress.classList.add('is-open'));
  const trigger = document.querySelector('#open-profile'); trigger.disabled = true; trigger.querySelector('span').textContent = 'Opening your profile…';
  setTimeout(() => {
    state.opened = true; state.opening = false;
    if (state.route !== 'welcome') return;
    trigger.disabled = false; trigger.querySelector('span').textContent = `Meet ${profile.name}`;
  }, reducedMotion.matches ? 0 : 1050);
}
function profileView() {
  return `${header('Profile', 'welcome', `<button class="round-button" data-action="profile-options" aria-label="Profile options">${icon('more')}</button>`)}
    <section class="card profile-hero" aria-labelledby="profile-name"><div class="avatar">${esc(profile.initials)}</div><h1 id="profile-name" tabindex="-1">${esc(profile.name)}</h1><p class="profile-title">${esc(profile.title)}</p><p class="location">${icon('pin')}${esc(profile.location)}</p><p class="availability">${esc(profile.availability)}</p></section>
    <div class="profile-save">${button('Save contact', 'save-contact', 'dark', 'save')}</div>
    <div class="contact-grid" aria-label="Contact options">${[['phone','Call','call'],['whatsapp','WhatsApp','whatsapp'],['mail','Email','email'],['globe','Website','website']].map(([glyph,label,action]) => `<button class="contact-action ${action}" data-action="contact" data-channel="${action}">${icon(glyph)}<span>${label}</span></button>`).join('')}</div>
    <button class="card consult-card" data-action="consultation"><span class="icon-tile blue">${icon('calendar')}</span><span><span class="row-heading">Request a consultation</span><span class="row-subtitle" style="display:block">Choose how and when to meet</span></span>${icon('back','row-chevron')}</button>
    <section class="card practice-preview" aria-labelledby="practice-preview-heading"><h2 class="eyebrow" id="practice-preview-heading">Practice areas</h2><div class="tags">${profile.practiceAreas.map(a=>`<button class="tag" data-action="practice">${esc(a.short)}</button>`).join('')}</div></section>`;
}
function practiceView() {
  return `${header('Practice', 'profile')}<h1 class="page-heading" tabindex="-1">Practice &amp; chambers</h1><section class="card group-card" aria-label="Practice areas">${profile.practiceAreas.map(a=>`<div class="list-row"><span class="icon-tile">${icon(a.icon)}</span><div><h2 class="row-heading">${esc(a.name)}</h2><p class="row-subtitle">${esc(a.description)}</p></div></div>`).join('')}</section>
    <h2 class="eyebrow section-label">Chambers &amp; contact</h2><div class="card group-card contact-list"><div class="list-row">${icon('pin')}<div><h3 class="row-heading">Chambers address</h3><p class="row-subtitle">${esc(profile.address)}</p></div></div><a class="list-row" href="#" data-action="contact" data-channel="email">${icon('mail')}<div><h3 class="row-heading">Email</h3><p class="row-subtitle">${esc(profile.email)}</p></div></a><div class="list-row">${icon('clock')}<div><h3 class="row-heading">Consultations</h3><p class="row-subtitle">In person or by video call</p></div></div></div>
    <div class="languages"><h2>Languages</h2><p>${profile.languages.map(esc).join(' / ')}</p></div><div class="practice-cta">${button('Request a consultation','consultation','dark','calendar')}</div>`;
}
function forumCards() {
  const query = state.search.trim().toLocaleLowerCase();
  const threads = allThreads().filter(t => (state.filter === 'All' || t.category === state.filter) && `${t.title} ${t.excerpt || ''} ${t.body} ${t.author}`.toLocaleLowerCase().includes(query));
  if (!threads.length) return `<div class="card empty-state"><h2>No discussions found</h2><p>Try another search or start a conversation.</p></div>`;
  return threads.map(t=>`<button class="card discussion-card" data-action="thread" data-id="${esc(t.id)}"><span class="discussion-meta"><span class="category-pill ${t.category.toLowerCase()}">${esc(t.category)}</span><span>${esc(t.time || 'Now')}</span></span><h2>${esc(t.title)}</h2><p>${esc(t.excerpt || t.body.slice(0, 90))}</p><span class="discussion-footer"><span class="small-avatar">${esc(t.initials || initials(t.author))}</span><span>${esc(t.author)}</span><span class="reply-count">${icon('forum')}${t.replies.length} ${t.replies.length === 1 ? 'reply' : 'replies'}</span></span></button>`).join('');
}
function forumView() {
  return `${header('Community','profile',`<button class="member-badge" data-action="members">${icon('lock')}Members</button>`)}<h1 class="page-heading forum-heading" tabindex="-1">Legal Forum</h1><label class="search-field">${icon('search')}<input type="search" id="forum-search" placeholder="Search discussions" aria-label="Search discussions" value="${esc(state.search)}" autocomplete="off"></label><div class="segments forum-filters" aria-label="Discussion categories">${['All','Practice','Procedure','Career'].map(c=>`<button class="${state.filter === c ? 'active' : ''}" data-action="filter" data-filter="${c}" aria-pressed="${state.filter === c}">${c}</button>`).join('')}</div><div class="discussion-list" id="discussion-list" aria-live="polite">${forumCards()}</div><div class="forum-new">${button('New discussion','new-discussion','blue','plus')}</div><p class="local-note">Community preview · Your posts stay on this device.</p>`;
}
function renderMain() {
  app.classList.remove('is-landing');
  app.innerHTML = `<div class="main-shell"><div class="tab-viewport"><div class="tab-track" style="--tab:${state.tab}">${[profileView(),practiceView(),forumView()].map((html,i)=>`<main class="tab-panel" data-panel="${i}" ${i !== state.tab ? 'inert' : ''}>${html}</main>`).join('')}</div></div><nav class="tabbar" aria-label="Main navigation" style="--tab:${state.tab}">${[['user','Profile'],['book','Practice'],['forum','Forum']].map(([glyph,label],i)=>`<button class="tab-button" data-action="tab" data-tab="${i}" ${state.tab === i ? 'aria-current="page"' : ''}>${icon(glyph)}<span>${label}</span></button>`).join('')}</nav></div>`;
}
function setTab(index, focus = true) {
  state.tab = index; state.route = tabs[index];
  const track = document.querySelector('.tab-track');
  if (!track) renderMain();
  else {
    track.style.setProperty('--tab',index);
    track.style.removeProperty('transform');
    track.classList.remove('is-dragging');
    document.querySelector('.tabbar').style.setProperty('--tab',index);
    document.querySelectorAll('.tab-panel').forEach((el,i)=>{ el.inert = i !== index; });
    document.querySelectorAll('.tab-button').forEach((el,i)=>{ if (i === index) el.setAttribute('aria-current','page'); else el.removeAttribute('aria-current'); });
  }
  document.title = `${['Profile','Practice','Legal Forum'][index]} · ${profile.name}`;
  if (focus) document.querySelector(`[data-panel="${index}"] h1`)?.focus({ preventScroll: true });
}
function rememberDraft() {
  const consultation = document.querySelector('#consultation-form');
  if (consultation) state.consultationDraft = Object.fromEntries(new FormData(consultation));
  const discussion = document.querySelector('#discussion-form');
  if (discussion) state.discussionDraft = Object.fromEntries(new FormData(discussion));
  const reply = document.querySelector('#reply-form');
  if (reply) state.replyDraft = { id: state.selectedThread, body: new FormData(reply).get('body') };
}
function restoreDraft(formId, draft) {
  if (!draft) return;
  const form = document.querySelector(formId);
  for (const [name, value] of Object.entries(draft)) { const field = form?.elements.namedItem(name); if (field && field.type !== 'file') field.value = value; }
}
function detail(content) {
  document.querySelector('.detail-screen')?.remove();
  document.querySelector('.main-shell').inert = true;
  const screen = document.createElement('main'); screen.className = 'detail-screen'; screen.innerHTML = content; app.append(screen);
  screen.querySelector('h1')?.setAttribute('tabindex','-1');
  screen.querySelector('h1')?.focus({ preventScroll: true });
}
function closeDetail() {
  const screen = document.querySelector('.detail-screen');
  if (screen) {
    const base = document.querySelector('.main-shell');
    screen.inert = true;
    if (!reducedMotion.matches) {
      const animation = screen.animate([{ opacity: 1, transform:'translateX(0)' },{ opacity:0,transform:'translateX(35px)' }],{duration:250,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'});
      animation.finished.then(()=>screen.remove()).catch(()=>screen.remove());
    } else screen.remove();
    base.inert = false;
  }
}
function navigate(route, replace = false) {
  const hash = '#' + route;
  if (location.hash === hash) renderRoute();
  else if (replace) { history.replaceState(null,'',hash); renderRoute(); }
  else location.hash = hash;
}
function renderRoute() {
  rememberDraft();
  let route;
  try { route = decodeURIComponent(location.hash.slice(1) || 'welcome'); }
  catch { navigate('profile',true); return; }
  state.route = route;
  if (route === 'welcome') { renderWelcome(); document.title = `${profile.name} · TAPX Counsel`; return; }
  if (tabs.includes(route)) {
    if (!document.querySelector('.main-shell')) { state.tab = tabs.indexOf(route); renderMain(); }
    closeDetail(); setTab(tabs.indexOf(route)); return;
  }
  if (!document.querySelector('.main-shell')) renderMain();
  if (route === 'consultation') renderConsultation();
  else if (route === 'request-ready' && state.request) renderConfirmation();
  else if (route === 'new-discussion') renderDiscussionForm();
  else if (route.startsWith('discussion/')) renderThread(route.slice(11));
  else if (route.startsWith('reply/')) renderReplyForm(route.slice(6));
  else navigate('profile',true);
}
function renderConsultation() {
  const today = new Date(); const localDate = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  detail(`${header('Consultation',tabs[state.tab])}<h1 class="detail-heading">Request a<br>consultation</h1><p class="detail-subtitle">Tell us how to reach you.</p><form id="consultation-form"><div class="card form-group"><label class="field"><span>Full name</span><input name="name" placeholder="Your full name" autocomplete="name" required maxlength="100"></label><label class="field"><span>Email</span><input name="email" type="email" placeholder="you@example.com" autocomplete="email" required maxlength="200"></label><label class="field"><span>Phone</span><input name="phone" type="tel" placeholder="Your phone number" autocomplete="tel" required maxlength="40"></label><label class="field"><span>Practice area</span><select name="area" required><option value="" disabled selected>Choose a topic</option><option>General consultation</option>${profile.practiceAreas.map(a=>`<option>${esc(a.name)}</option>`).join('')}</select></label><label class="field"><span>Preferred date</span><input name="date" type="date" aria-label="Preferred date" min="${localDate}" required></label></div><h2 class="eyebrow meeting-label">Meeting preference</h2><div class="segments meeting-options" aria-label="Meeting preference">${['In person','Video call'].map(m=>`<button type="button" data-action="meeting" data-meeting="${m}" class="${state.meeting === m ? 'active' : ''}" aria-pressed="${state.meeting === m}">${m}</button>`).join('')}</div><label class="card summary-field"><span>Brief summary <em>(optional)</em></span><textarea name="summary" placeholder="A few words about your enquiry" maxlength="3000"></textarea></label><label class="attachment">${icon('clip')}<span>Add a document (optional)</span><input type="file" name="document" aria-label="Add a document" accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"></label><button class="button button-blue" type="submit">Prepare consultation request</button><p class="form-footnote">Review your request before sending. Your lawyer will confirm the meeting time.</p></form>`);
  restoreDraft('#consultation-form',state.consultationDraft); document.title = `Consultation · ${profile.name}`;
}
function requestText() {
  const r = state.request;
  return `Consultation request for ${profile.name}\n\nName: ${r.name}\nEmail: ${r.email}\nPhone: ${r.phone}\nPractice area: ${r.area}\nPreferred date: ${r.date}\nMeeting: ${r.meeting}\n\nSummary:\n${r.summary || 'No summary provided.'}\n${r.filename ? '\nDocument to attach separately: '+r.filename+'\n' : ''}\nThe meeting time is subject to confirmation.`;
}
function renderConfirmation() {
  const r = state.request;
  const formatted = new Date(`${r.date}T12:00:00`).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});
  detail(`${header('Consultation','consultation')}<section class="success-content"><div class="success-symbol">${icon('check')}</div><h1>Request ready</h1><p class="success-intro">Your details are ready to share.<br>Nothing has been sent yet.</p><div class="card summary-list"><div class="summary-row"><span>Enquiry</span><strong>${esc(r.area)}</strong></div><div class="summary-row"><span>Meeting</span><strong>${esc(r.meeting)}</strong></div><div class="summary-row"><span>Preferred date</span><strong>${esc(formatted)}</strong></div><div class="summary-row"><span>Time</span><strong>To be confirmed</strong></div></div><div class="success-actions">${!profile.isDemo && validEmail(profile.email) ? button('Open email to send','email-request','blue','mail') : ''}${button('Download request','download-request','dark','download')}${button('Back to profile','profile','light')}</div><p class="form-footnote">${profile.isDemo ? 'Profile preview. Add your real contact details to enable email requests.' : 'Your lawyer will contact you after receiving your request.'}${r.filename ? ' Attach your document separately when sending.' : ''}</p></section>`);
  document.title = `Request ready · ${profile.name}`;
}
function renderThread(id) {
  const t = allThreads().find(x=>x.id===id);
  if (!t) { navigate('forum',true); return; }
  state.selectedThread = id;
  detail(`${header('Discussion','forum',`<button class="round-button" data-action="share-thread" aria-label="Share discussion">${icon('more')}</button>`)}<article class="card thread-post"><span class="category-pill ${t.category.toLowerCase()}">${esc(t.category)}</span><h1>${esc(t.title)}</h1><div class="author-row"><span class="small-avatar">${esc(t.initials || initials(t.author))}</span><div><p class="author-name">${esc(t.author)}</p><p class="author-date">${esc(t.time || 'Now')}${t.local ? ' · On this device' : ' · Example discussion'}</p></div></div><p class="thread-body">${esc(t.body)}</p>${t.filename ? `<p class="local-note">Reference noted: ${esc(t.filename)} (file stays on your device)</p>` : ''}</article><h2 class="replies-heading">${t.replies.length} ${t.replies.length === 1 ? 'reply' : 'replies'}</h2>${t.replies.map(r=>`<article class="card reply-card"><div class="author-row"><span class="small-avatar">${esc(r.initials || 'Y')}</span><span class="author-name">${esc(r.author)}</span><span class="author-date">${esc(r.time || 'Now')}</span></div><p>${esc(r.body)}</p>${r.filename ? `<p class="local-note">Reference noted: ${esc(r.filename)}</p>` : ''}</article>`).join('')}<button class="card thread-compose" data-action="reply" data-id="${esc(id)}"><span>Write a reply…</span><span class="send-icon">${icon('arrow')}</span></button><p class="local-note">Community preview · Replies stay on this device.</p>`);
  document.title = `${t.title} · Legal Forum`;
}
function renderDiscussionForm() {
  detail(`${header('New discussion','forum')}<form class="compose-form" id="discussion-form"><h1 class="detail-heading">Start a conversation</h1><p class="detail-subtitle">For the legal community.</p><label class="card compose-category"><span>Category</span><select name="category" aria-label="Category"><option>Practice</option><option>Procedure</option><option>Career</option></select></label><input name="title" class="compose-title" placeholder="Discussion title" aria-label="Discussion title" required maxlength="140"><textarea name="body" class="compose-body" placeholder="Share a question, a useful resource or a professional insight with fellow lawyers." aria-label="Discussion content" required maxlength="6000"></textarea><label class="attachment">${icon('clip')}<span>Add a reference or document</span><input type="file" name="reference" aria-label="Add a reference or document" accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"></label><p class="compose-guidance">Keep discussions general. Leave out client names and confidential case details.<br>Posts in this preview stay on your device.</p><button class="button button-blue compose-submit" type="submit">Post discussion</button></form>`);
  restoreDraft('#discussion-form',state.discussionDraft); document.title = 'New discussion · Legal Forum';
}
function renderReplyForm(id) {
  const t = allThreads().find(x=>x.id===id);
  if (!t) { navigate('forum',true); return; }
  state.selectedThread = id;
  detail(`${header('Write a reply',`discussion/${esc(id)}`)}<form class="compose-form" id="reply-form"><h1 class="detail-heading">Join the discussion</h1><div class="card reply-context"><p class="eyebrow">Replying to</p><h2>${esc(t.title)}</h2></div><textarea name="body" class="compose-body" placeholder="Write your reply…" aria-label="Your reply" required maxlength="6000"></textarea><label class="attachment">${icon('clip')}<span>Add a useful reference</span><input type="file" name="reference" aria-label="Add a useful reference" accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"></label><p class="compose-guidance">Keep client names and confidential case details out of community discussions.<br>Replies in this preview stay on your device.</p><button type="submit" class="button button-blue compose-submit">Post reply</button></form>`);
  if (state.replyDraft?.id === id) restoreDraft('#reply-form', { body: state.replyDraft.body });
  document.title = 'Write a reply · Legal Forum';
}
function validEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function safeWebsite(value) { try { const url = new URL(value); return ['http:','https:'].includes(url.protocol) ? url.href : null; } catch { return null; } }
function contact(channel) {
  const phone = (channel === 'whatsapp' ? profile.whatsapp : profile.phone).replace(/[^\d+]/g,'');
  if (channel === 'call' && phone) location.href = `tel:${phone}`;
  else if (channel === 'whatsapp' && phone) window.open(`https://wa.me/${phone.replace(/\D/g,'')}`,'_blank','noopener,noreferrer');
  else if (channel === 'email' && !profile.isDemo && validEmail(profile.email)) location.href = `mailto:${profile.email}`;
  else if (channel === 'website' && safeWebsite(profile.website)) window.open(safeWebsite(profile.website),'_blank','noopener,noreferrer');
  else showDialog(`${{call:'Call',whatsapp:'WhatsApp',email:'Email',website:'Website'}[channel]} details`, 'This contact option is not available in the sample profile. The lawyer’s contact details will appear here once the profile is personalised.');
}
function download(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content],{type}));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function saveContact() {
  const vesc = value => String(value).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
  const lines = ['BEGIN:VCARD','VERSION:3.0',`FN:${vesc(profile.name)}`,`N:${vesc(profile.name)};;;;`,`TITLE:${vesc(profile.title)}`,`ADR;TYPE=WORK:;;${vesc(profile.address)};;;;`];
  if (profile.phone) lines.push(`TEL;TYPE=WORK,VOICE:${vesc(profile.phone)}`);
  if (profile.email && !profile.isDemo) lines.push(`EMAIL;TYPE=WORK:${vesc(profile.email)}`);
  if (safeWebsite(profile.website)) lines.push(`URL:${safeWebsite(profile.website)}`);
  if (profile.isDemo) lines.push('NOTE:Sample profile from the TAPX Counsel design. Replace details before use.');
  lines.push('END:VCARD');
  download(lines.join('\r\n')+'\r\n',`${profile.name.replace(/[^a-z0-9]+/gi,'-')}.vcf`,'text/vcard;charset=utf-8');
  toast('Contact card downloaded. Open it to add to contacts.');
}
async function shareProfile(thread = false) {
  if (dialog.open) dialog.close();
  const url = new URL(location.href); if (!thread) url.hash = 'profile';
  try {
    if (navigator.share) await navigator.share({ title: thread ? document.title : `${profile.name} · Counsel`, url: url.href });
    else if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(url.href); toast('Link copied.'); }
    else showDialog('Share this profile',url.href);
  } catch (error) { if (error.name !== 'AbortError') showDialog('Share this profile',url.href); }
}
document.addEventListener('click', event => {
  const target = event.target.closest('[data-action]'); if (!target) return;
  event.preventDefault();
  if (performance.now() < suppressClickUntil) return;
  const action = target.dataset.action;
  if (action === 'open-profile') openProfile();
  else if (action === 'back') navigate(target.dataset.target);
  else if (action === 'tab') navigate(tabs[Number(target.dataset.tab)]);
  else if (['profile','practice','forum','consultation','new-discussion'].includes(action)) navigate(action);
  else if (action === 'thread' || action === 'reply') navigate(`${action === 'thread' ? 'discussion' : 'reply'}/${target.dataset.id}`);
  else if (action === 'save-contact') saveContact();
  else if (action === 'contact') contact(target.dataset.channel);
  else if (action === 'about') showDialog('Thoughtfully connected.','TAPX Counsel is a personal digital introduction. Save a contact, explore the practice, or prepare a consultation request. This profile follows the supplied A. Perera design.');
  else if (action === 'members') showDialog('A space for the legal community','Explore the example discussions and join the conversation. In this preview, your new posts and replies are saved only in this browser and are visible on this device.');
  else if (action === 'profile-options') showDialog(profile.name,'Save this introduction or share a link to the profile.',`${button('Share profile','share','dark','share')}${button('Save contact','save-contact','light','save')}`);
  else if (action === 'close-dialog') dialog.close();
  else if (action === 'share') shareProfile();
  else if (action === 'share-thread') shareProfile(true);
  else if (action === 'filter') {
    state.filter = target.dataset.filter;
    document.querySelectorAll('.forum-filters button').forEach(el=>{ const active=el.dataset.filter===state.filter; el.classList.toggle('active',active); el.setAttribute('aria-pressed',active); });
    document.querySelector('#discussion-list').innerHTML = forumCards();
  } else if (action === 'meeting') {
    state.meeting = target.dataset.meeting;
    document.querySelectorAll('.meeting-options button').forEach(el=>{ const active=el.dataset.meeting===state.meeting; el.classList.toggle('active',active); el.setAttribute('aria-pressed',active); });
  } else if (action === 'download-request') { download(requestText(),'consultation-request.txt','text/plain;charset=utf-8'); toast('Request downloaded. Send it to your lawyer to confirm a time.'); }
  else if (action === 'email-request' && !profile.isDemo && validEmail(profile.email)) location.href = `mailto:${profile.email}?subject=${encodeURIComponent('Consultation request — '+state.request.area)}&body=${encodeURIComponent(requestText())}`;
});
document.addEventListener('input', event => {
  if (event.target.id === 'forum-search') { state.search=event.target.value; document.querySelector('#discussion-list').innerHTML=forumCards(); }
  if (event.target.matches('textarea[required], input[required]')) event.target.setCustomValidity('');
});
document.addEventListener('change', event => {
  if (event.target.type !== 'file') return;
  const input = event.target; const file = input.files[0];
  if (file && file.size > 10*1024*1024) { input.value=''; toast('Choose a document smaller than 10 MB.'); return; }
  const label = input.closest('.attachment').querySelector('span');
  label.textContent = file ? file.name : 'Add a document (optional)';
  if (file) toast('Document selected. Files stay on your device.');
});
document.addEventListener('submit', event => {
  const form = event.target; event.preventDefault();
  if (!['consultation-form','discussion-form','reply-form'].includes(form.id)) return;
  for (const field of form.querySelectorAll('input[required]:not([type="date"]):not([type="email"]), textarea[required]')) { field.setCustomValidity(field.value.trim() ? '' : 'Please add a few words.'); }
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  if (form.id === 'consultation-form') {
    const file=data.get('document');
    state.request={name:data.get('name').trim(),email:data.get('email').trim(),phone:data.get('phone').trim(),area:data.get('area'),date:data.get('date'),meeting:state.meeting,summary:data.get('summary').trim(),filename:file?.name || ''};
    navigate('request-ready');
  } else if (form.id === 'discussion-form') {
    const id=crypto.randomUUID();
    community.threads.unshift({id,category:data.get('category'),title:data.get('title').trim(),body:data.get('body').trim(),author:'You',initials:'Y',time:'Now',local:true,filename:data.get('reference')?.name || '',replies:[]});
    saveCommunity(); state.discussionDraft=null; form.reset(); refreshForum(); navigate(`discussion/${id}`); toast('Discussion posted on this device.');
  } else {
    const id=state.selectedThread;
    if (!Array.isArray(community.replies[id])) community.replies[id]=[];
    community.replies[id].push({author:'You',initials:'Y',body:data.get('body').trim(),time:'Now',filename:data.get('reference')?.name || ''});
    saveCommunity(); state.replyDraft=null; form.reset(); refreshForum(); navigate(`discussion/${id}`); toast('Reply posted on this device.');
  }
});
function refreshForum() {
  const panel=document.querySelector('[data-panel="2"]');
  if (panel) panel.innerHTML=forumView();
}

// Native vertical scrolling remains with the browser. Only deliberate horizontal
// gestures on non-interactive surfaces drive the tab track, one frame at a time.
app.addEventListener('pointerdown', event => {
  if (event.button !== 0 || !tabs.includes(state.route) || event.target.closest('button,a,input,textarea,select,label')) return;
  drag={id:event.pointerId,x:event.clientX,y:event.clientY,dx:0,start:performance.now(),locked:false,width:app.clientWidth};
}, { passive:true });
app.addEventListener('pointermove', event => {
  if (!drag || drag.id!==event.pointerId) return;
  const dx=event.clientX-drag.x; const dy=event.clientY-drag.y;
  if (!drag.locked) {
    if (Math.abs(dy)>12 && Math.abs(dy)>Math.abs(dx)) { drag=null; return; }
    if (Math.abs(dx)<12 || Math.abs(dx)<Math.abs(dy)*1.2) return;
    drag.locked=true; app.setPointerCapture(event.pointerId);
    document.querySelector('.tab-track').classList.add('is-dragging');
    document.querySelectorAll('.tab-panel').forEach(el=>el.inert=false);
  }
  event.preventDefault();
  const edge=(state.tab===0 && dx>0)||(state.tab===2 && dx<0);
  drag.dx=edge ? dx*.2 : Math.max(-drag.width,Math.min(drag.width,dx));
  document.querySelector('.tab-track').style.transform=`translate3d(${-state.tab*drag.width+drag.dx}px,0,0)`;
}, { passive:false });
function finishSwipe(cancelled=false) {
  if (!drag) return;
  const gesture=drag; drag=null;
  if (!gesture.locked) return;
  suppressClickUntil=performance.now()+300;
  const velocity=Math.abs(gesture.dx)/Math.max(1,performance.now()-gesture.start);
  let next=state.tab;
  if (!cancelled && (Math.abs(gesture.dx)>gesture.width*.19 || (Math.abs(gesture.dx)>35 && velocity>.4))) next=Math.max(0,Math.min(2,state.tab+(gesture.dx<0?1:-1)));
  // Force the dragged transform to be committed before restoring the spring.
  document.querySelector('.tab-track').getBoundingClientRect();
  setTab(next,false);
  if (location.hash !== '#'+tabs[next]) history.pushState(null,'','#'+tabs[next]);
}
app.addEventListener('pointerup',()=>finishSwipe());
app.addEventListener('pointercancel',()=>finishSwipe(true));
app.addEventListener('lostpointercapture',()=>finishSwipe(true));
document.addEventListener('keydown',event=>{
  if (event.key === 'Escape' && !dialog.open && document.querySelector('.detail-screen')) { const back=document.querySelector('.detail-screen [data-action="back"]'); if (back) navigate(back.dataset.target); }
  if (!event.target.closest('.tabbar') || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
  event.preventDefault();
  const next=event.key==='Home'?0:event.key==='End'?2:Math.max(0,Math.min(2,state.tab+(event.key==='ArrowRight'?1:-1)));
  navigate(tabs[next]);
  requestAnimationFrame(()=>document.querySelector(`[data-tab="${next}"]`)?.focus());
});
window.addEventListener('hashchange',renderRoute);
window.addEventListener('resize',()=>{ if(drag) finishSwipe(true); });
renderRoute();
