// NYSA prototype — shared record data + demo-state layer (Round 4, D19).
// Frontend-only "thin real shell" model: every clickable record resolves to its
// own honest title/workspace/project/status via ?id= — never another record's
// content under a different name. Flagship records (the ones the wedge demo
// walks through) keep their fully authored detail; everything else gets the
// thin shell defined in applyThinShell().

(function () {

  // ---------- Canonical records (see deliverables/2026-07-08-figma-fake-data-bible.md) ----------

  var TASKS = {
    t1:  { title: 'Send Bancora integration proposal', workspace: 'Kredi', project: 'Bancora', projectHref: 'project-bancora.html', group: 'needs-you', approvalId: 't1', flagship: true, sendsExternally: true, destination: 'Emails Marco Del Toro directly on approval.',
      // D21B enrichment (Jul 13) — full email draft rendered in the review
      // stepper. Facts match meeting-bancora.html (phased rollout,
      // Jul 6 sync) and email-receipt.html (go-live moved to August).
      review: {
        type: 'email',
        to: { name: 'Marco Del Toro', company: 'Bancora', initials: 'MD' },
        cc: { name: 'Ana Reyes', company: 'Bancora' },
        subject: 'Bancora Integration Proposal — Revised Timeline',
        body: [
          'Hi Marco,',
          'Following up on our sync last Monday — thanks to you and Ana for walking through the onboarding flow in detail. Attached is the integration proposal we discussed, updated to reflect a phased rollout starting with onboarding.',
          'The revised plan targets an August go-live, which gives both our teams time to close out the data-sharing redlines currently with legal. We’ve scoped the pilot narrow — co-branded, onboarding first — with room to expand once it’s stable.',
          'Next on our side: finalize the data-sharing terms with legal, then get a joint sign-off call on the calendar for early August. Let me know if anything in the attached raises questions before then.',
          'Javier'
        ],
        attachment: { name: 'Bancora-integration-proposal.pdf', pages: 12 },
        provenance: 'Drafted from the Bancora sync, Jul 6.'
      }
    },
    t2:  { title: 'Draft board update', workspace: 'Kredi', project: 'Board Ops', group: 'yours-to-do' },
    t3:  { title: 'Reschedule demo with Altiva', workspace: 'Kredi', project: 'Altiva', group: 'assistant-working', note: 'Checking calendar availability with Altiva\u2019s team' },
    t4:  { title: 'Renew passport', workspace: 'Personal', project: null, group: 'yours-to-do' },
    t5:  { title: 'Loop in legal team on redlines', workspace: 'Kredi', project: 'Bancora', group: 'waiting-on-others', context: 'With legal since Jul 6', stale: false },
    t6:  { title: 'Follow up on redlines review', workspace: 'Kredi', project: 'Bancora', group: 'yours-to-do', context: 'From Bancora sync, Jul 6' },
    t7:  { title: 'Set up HandyPass Stripe account', workspace: 'HandyPass', project: 'HandyPass Launch', group: 'assistant-working', note: 'Filling out the Stripe onboarding form' },
    t8:  { title: 'Buy a gift for the Kredi offsite', workspace: 'Kredi', project: null, group: 'yours-to-do' },
    t9:  { title: 'Review July board agenda draft', workspace: 'Kredi', project: 'Board Ops', group: 'needs-you', approvalId: 't9', note: 'Agenda drafted from open items across Board Ops', destination: 'Edits the internal board agenda doc. No external notification.',
      // D21B enrichment (Jul 13) — inline agenda preview with the 2 items the
      // assistant added/updated flagged.
      review: {
        type: 'document',
        title: 'July Board Agenda',
        items: [
          { n: 1, text: 'Welcome & Q2 recap', owner: 'Javier', timing: '5 min' },
          { n: 2, text: 'Bancora integration update', owner: 'Javier', timing: '10 min', tag: 'updated' },
          { n: 3, text: 'Altiva renewal status', owner: 'Carlos', timing: '10 min' },
          { n: 4, text: 'HandyPass launch readiness', owner: 'Peter', timing: '10 min' },
          { n: 5, text: 'Kredi offsite planning', owner: 'Javier', timing: '5 min', tag: 'added' },
          { n: 6, text: 'Q3 priorities discussion', owner: 'All', timing: '15 min' }
        ],
        provenance: 'Drafted from open items across Board Ops.',
        openHref: '#'
      }
    },
    t10: { title: 'Confirm venue for Kredi offsite', workspace: 'Kredi', project: 'Kredi Offsite', group: 'waiting-on-others', context: 'Venue coordinator, since Jul 5', stale: true },
    t11: { title: 'Send thank-you note to Ana Reyes', workspace: 'Kredi', project: 'Bancora', group: 'done' },
    t12: { title: 'Update HandyPass landing page copy', workspace: 'HandyPass', project: 'HandyPass Launch', group: 'yours-to-do' },
    t13: { title: 'File Q2 expense report', workspace: 'Personal', project: null, group: 'done' },
    t14: { title: 'Prep talking points for Altiva demo', workspace: 'Kredi', project: 'Altiva', group: 'assistant-working', note: 'Pulling deal history and past objections' },
    'k-bancora-overview': { title: 'Knowledge edit \u2014 Bancora Account Overview', workspace: 'Kredi', project: 'Bancora', group: 'needs-you', approvalId: 'k-bancora-overview', knowledgeHref: 'knowledge-review.html?id=k-bancora-overview', note: 'Update with the new \u2018Proposal in progress\u2019 status and a summary of the Jul 6 meeting', destination: 'Updates the Company Overview record. No external notification.',
      // D21B enrichment (Jul 13) \u2014 field-level diff, facts matched to
      // knowledge-review.html's renderBancoraOverview() (Status: In
      // discovery \u2192 Proposal in progress; same summary sentence).
      review: {
        type: 'knowledge-diff',
        changes: [
          { field: 'Status', before: 'In discovery', after: 'Proposal in progress' },
          { field: 'Last interaction', before: 'Jun 20, 2026 \u2014 quarterly check-in call', after: 'Jul 6, 2026 \u2014 integration sync' },
          { field: 'Summary', after: 'Marco and Ana confirmed intent to move the integration forward this quarter. Proposal targeted for Friday, Jul 10; data-sharing redlines under legal review.', tag: 'new' }
        ],
        source: { text: 'From the Bancora sync, Jul 6', href: 'meeting-bancora.html' }
      }
    },
    'workaround-notes': { title: 'Publish workaround notes to Knowledge', workspace: 'Kredi', project: 'Bancora', group: 'needs-you', approvalId: 'workaround-notes', note: 'These three notes describe the same expediente-incompleto workaround', destination: 'Publishes to Knowledge. No external notification.',
      // D21B enrichment (Jul 13) \u2014 source notes match notes.html verbatim
      // (titles + dates); article preview describes the same workaround.
      review: {
        type: 'knowledge-merge',
        notes: [
          { title: 'Time to standardize the workaround', date: 'Jul 8' },
          { title: 'Expediente incompleto \u2014 INE copy', date: 'Jul 5' },
          { title: 'Missing proof-of-income workaround', date: 'Jul 1' }
        ],
        articleTitle: 'Expediente incompleto \u2014 broker escalation workaround',
        articlePreview: 'When a loan file comes in with a missing or incomplete document \u2014 most often a missing INE copy or proof-of-income form \u2014 email the broker directly instead of routing through the standard intake queue. Flag the file in the #loan-ops Slack channel so the team knows it\u2019s pending completion. Once the broker returns the missing document, re-submit the file for the standard expediente completo check before it moves to underwriting.',
        provenance: 'Merges 3 notes into one Knowledge article.'
      }
    },
    // Email intake (spec v0.8) — filed from the "Re: Bancora integration
    // timeline" thread, see email-receipt.html.
    'confirm-golive-date': { title: 'Confirm revised go-live date', workspace: 'Kredi', project: 'Bancora', projectHref: 'project-bancora.html', group: 'assistant-working', note: 'Confirming the revised August go-live date with Marco Del Toro after the Bancora integration timeline email, Jul 8' }
  };

  var MEETINGS = {
    'bancora-sync': { title: 'Bancora sync', date: 'Jul 6, 2026', duration: '45 min', workspace: 'Kredi', attendees: 'Javier Aldape, Marco Del Toro, Ana Reyes', flagship: true, href: 'meeting-bancora.html' },
    'altiva-prep': { title: 'Altiva demo prep', date: 'Jul 7, 2026', duration: '30 min', workspace: 'Kredi', attendees: 'Javier Aldape, Carlos Nu\u00f1ez', note: 'Private \u2014 only you can see this meeting.' },
    'kredi-offsite': { title: 'Kredi offsite planning', date: 'Jul 8, 2026', duration: '40 min', workspace: 'Kredi', attendees: 'Javier Aldape', note: 'Awaiting summary \u2014 the assistant hasn\u2019t processed this recording yet.' },
    'weekly-partner-sync': { title: 'Weekly partner sync', date: 'Jul 3, 2026', duration: '30 min', workspace: 'Kredi', attendees: 'Javier Aldape, Marco Del Toro', note: '1 person filed \u00b7 1 Knowledge edit \u2014 see Knowledge for the update.' },
    'redlines-review': { title: 'Redlines review call', date: 'Jul 9, 2026', duration: '20 min', workspace: 'Kredi', attendees: 'Javier Aldape, Laura Jim\u00e9nez', note: 'Upcoming \u2014 this meeting hasn\u2019t happened yet, so nothing has been captured from it.' },
    'handypass-investor': { title: 'HandyPass investor call', date: 'Jul 10, 2026', duration: '30 min', workspace: 'HandyPass', attendees: 'Javier Aldape, Peter Kim', note: 'Upcoming \u2014 this meeting hasn\u2019t happened yet, so nothing has been captured from it.' }
  };

  // D50, option A \u2014 confidence tiers (High/Medium/Low + %), derived from each
  // piece's trust state: Verified pieces sit high, the Stale control sits
  // lower-mid, the unreviewed Candidate sits low. See
  // deliverables/2026-07-08-figma-fake-data-bible.md (trust story) \u2014 these
  // values should be folded back into that doc.
  var KNOWLEDGE = {
    // verifiedBy / decidedBy (spec v0.8) — trust metadata records who
    // reviewed a Verified piece or made a Decision, alongside the existing
    // provenance/confidence fields. Verified pieces get verifiedBy; the one
    // Decisions-category piece gets decidedBy instead (matches its own
    // source meeting) rather than both, per the approved preview
    // (deliverables/2026-07-11-preview-email-intake-approver.html).
    'mortgage-macro': { title: 'Mortgage underwriting macro process', category: 'Macro process', trust: 'Verified', confidence: 'High (92%)', flagship: true, verifiedBy: 'Javier Aldape \u00b7 Jun 20' },
    'databsharing-checklist': { title: 'Data-sharing redline review checklist', category: 'Controls', trust: 'Verified', confidence: 'High (89%)', note: 'Auto-filed from the Bancora sync, Jul 6.', verifiedBy: 'Javier Aldape \u00b7 Jul 8' },
    'weekly-partner-ritual': { title: 'Weekly partner sync ritual', category: 'Rituals', trust: 'Verified', confidence: 'High (91%)', note: 'Runs as a meeting series (Mon 9:00) plus a pre-meeting digest.', verifiedBy: 'Javier Aldape \u00b7 Jul 2' },
    'loan-file-manual': { title: 'Loan file completeness checklist ("expediente completo")', category: 'Manuals', trust: 'Verified', confidence: 'High (95%)', note: 'Filed by Javier as a manual entry.', verifiedBy: 'Javier Aldape \u00b7 Jun 28' },
    'jul6-decision': { title: 'Jul 6 \u2014 Proceed with Bancora co-branded pilot', category: 'Decisions', trust: 'Verified', confidence: 'High (85%)', note: 'Auto-filed from the Bancora sync, Jul 6.', decidedBy: 'Javier Aldape \u00b7 in Bancora sync \u2014 Jul 6' },
    'expediente-check': { title: 'Expediente completo check', category: 'Controls', trust: 'Stale', confidence: 'Medium (64%)', flagshipReview: true },
    'refund-workaround': { title: 'Refund workaround (from support calls)', category: 'Manuals', trust: 'Candidate', confidence: 'Low (41%)', note: 'Published from Ana\u2019s notes, Jul 8. Not yet reviewed for accuracy.' },
    'k-bancora-overview': { title: 'Bancora \u2014 Account Overview', category: 'Verified', trust: 'Needs review', reviewTarget: true },
    // Email intake (spec v0.8) — the one knowledge candidate captured from
    // the "Re: Bancora integration timeline" thread, see email-receipt.html.
    // source/sourceHref demonstrate the provenance path from Knowledge back
    // to the email receipt.
    'integration-cutover-checklist': { title: 'Integration cutover checklist', category: 'Controls', trust: 'Candidate', confidence: 'Low (45%)', note: 'Captured from an email thread on the Bancora integration timeline, Jul 8. Not yet reviewed for accuracy.', source: 'Email \u2014 Re: Bancora integration timeline', sourceHref: 'email-receipt.html' }
  };

  var PERSONS = {
    marco: { name: 'Marco Del Toro', type: 'Partner', title: 'Relationship lead', email: 'marco@bancora.com', company: 'Bancora', flagship: true },
    javier: { name: 'Javier Aldape', type: 'Employee', title: 'Fintech exec', email: 'javier@kredi.mx', company: 'Kredi' },
    ana: { name: 'Ana Reyes', type: 'Partner', title: 'Ops', email: 'ana@bancora.com', company: 'Bancora' },
    laura: { name: 'Laura Jim\u00e9nez', type: 'Employee', title: 'Legal counsel', email: 'laura@kredi.mx', company: 'Kredi' },
    carlos: { name: 'Carlos Nu\u00f1ez', type: 'Partner', title: 'Relationship manager', email: 'carlos@altiva.mx', company: 'Altiva' },
    peter: { name: 'Peter Kim', type: 'Employee', title: 'Co-founder', email: 'peter@handypass.com', company: 'HandyPass' },
    // Email intake (spec v0.8) — new contact filed from the "Re: Bancora
    // integration timeline" thread, see email-receipt.html.
    diego: { name: 'Diego Salcido', type: 'Partner', title: 'Integration lead', email: 'diego@bancora.com', company: 'Bancora' }
  };

  var COMPANIES = {
    bancora: { name: 'Bancora', type: 'Partner', desc: 'Integration in progress', flagship: true },
    kredi: { name: 'Kredi', type: 'Internal', desc: 'Mortgage lending \u00b7 Mexico' },
    altiva: { name: 'Altiva', type: 'Partner', desc: 'Contract renewal' },
    handypass: { name: 'HandyPass', type: 'Internal', desc: 'Consumer app' },
    stripe: { name: 'Stripe', type: 'Supplier', desc: 'HandyPass integration' }
  };

  // Decisions (D36, option A) — first-class thin record type. One line, one
  // date, one source; reachable from the project rail and the Knowledge card,
  // no top-level nav item. meetingId/taskId/knowledgeId link to real records
  // in the maps above; leave null rather than inventing a connection.
  var DECISIONS = {
    'jul6-phased-rollout': { text: 'Proposal will include a phased rollout', date: 'Jul 6, 2026', meetingId: 'bancora-sync', taskId: 't1', knowledgeId: null, flagship: true },
    'jul6-legal-review': { text: 'Legal review required before sending', date: 'Jul 6, 2026', meetingId: 'bancora-sync', taskId: 't5', knowledgeId: null },
    'jul6-decision': { text: 'Proceed with Bancora co-branded pilot', date: 'Jul 6, 2026', meetingId: 'bancora-sync', taskId: null, knowledgeId: 'jul6-decision' }
  };

  window.NYSA = { TASKS: TASKS, MEETINGS: MEETINGS, KNOWLEDGE: KNOWLEDGE, PERSONS: PERSONS, COMPANIES: COMPANIES, DECISIONS: DECISIONS };

  // ---------- Demo state (approvals, board mutations) ----------
  // Deterministic reset path: NysaState.reset() clears the key below; wired to a
  // "Reset demo data" item injected into every page's sidebar footer menu.

  var KEY = 'nysa-demo-state-v1';

  function loadState() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function saveState(s) { localStorage.setItem(KEY, JSON.stringify(s)); }
  function getState() {
    var s = loadState();
    s.approvals = s.approvals || {};
    s.tasks = s.tasks || {};
    s.revisions = s.revisions || {};
    s.dismissedBrief = s.dismissedBrief || false;
    s.chatTasks = s.chatTasks || [];
    s.chatAutomations = s.chatAutomations || [];
    return s;
  }

  window.NysaState = {
    getApproval: function (id) { return getState().approvals[id] || 'pending'; },
    setApproval: function (id, status) { var s = getState(); s.approvals[id] = status; saveState(s); },
    getTask: function (id) { return getState().tasks[id] || null; },
    setTask: function (id, status) { var s = getState(); s.tasks[id] = status; saveState(s); },
    // D38, option B — "Ask for changes" demotes the item in place (stays in
    // Needs-you and its count) with a "Revision requested" label until a
    // revised draft clears the flag. Scoped to this label only: does not move
    // the item between board groups (objective #8) and does not touch the
    // batch stepper's keyboard handling (objective #9).
    getRevision: function (id) { return !!getState().revisions[id]; },
    setRevision: function (id, on) { var s = getState(); if (on) s.revisions[id] = true; else delete s.revisions[id]; saveState(s); },
    isBriefDismissed: function () { return !!getState().dismissedBrief; },
    dismissBrief: function () { var s = getState(); s.dismissedBrief = true; saveState(s); },
    countNeedsYou: function () {
      var ids = ['t1', 't9', 'k-bancora-overview', 'workaround-notes'];
      var s = getState();
      var n = 0;
      ids.forEach(function (id) { if ((s.approvals[id] || 'pending') === 'pending') n++; });
      return n;
    },
    reset: function () { localStorage.removeItem(KEY); },
    // Chat task intake (Jul 13, Javier's direct call) — manual task creation
    // goes through chat (spec §4.1 "chat is a command line"; §4.5 chat as one
    // of the four task sources). Chat-created tasks persist here, start in
    // Assistant working (spec §4.2: every new task starts agent-held), file to
    // Kredi (the demo's majority workspace), and are merged into NYSA.TASKS
    // below so tasks-detail's thin shell resolves them. Cleared by reset().
    addChatTask: function (title) {
      var s = getState();
      var id = 'chat-' + Date.now();
      var rec = { id: id, title: title };
      s.chatTasks.push(rec);
      saveState(s);
      TASKS[id] = chatTaskRecord(rec);
      return rec;
    },
    getChatTasks: function () { return getState().chatTasks.slice(); },
    // Chat automation intake (spec §4.3, Jul 13, Javier's direct call) —
    // automations are created "through Chat, an opinionated template, or a
    // simple form — never a visual workflow canvas." Chat-created automations
    // persist here and start Paused (never live from one utterance). Cleared
    // by reset().
    addChatAutomation: function (title) {
      var s = getState();
      var id = 'chat-auto-' + Date.now();
      var rec = { id: id, title: title };
      s.chatAutomations.push(rec);
      saveState(s);
      return rec;
    },
    getChatAutomations: function () { return getState().chatAutomations.slice(); }
  };

  function chatTaskRecord(rec) {
    return {
      title: rec.title,
      workspace: 'Kredi',
      project: null,
      group: 'assistant-working',
      note: 'Reviewing what’s needed to get started',
      source: 'chat',
      context: 'Created from chat, Jul 13'
    };
  }

  // Merge persisted chat-created tasks into the canonical map so every page
  // (board rows, tasks-detail ?id= thin shell) resolves them like any record.
  getState().chatTasks.forEach(function (rec) { TASKS[rec.id] = chatTaskRecord(rec); });

  // Inject "Reset demo data" into every sidebar footer menu, once, on any page.
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.sidebar-footer .menu-popover .menu-separator').forEach(function (sep) {
      if (sep.dataset.resetInjected) return;
      sep.dataset.resetInjected = '1';
      var item = document.createElement('a');
      item.className = 'menu-item';
      item.href = '#';
      item.textContent = 'Reset demo data';
      item.addEventListener('click', function (e) {
        e.preventDefault();
        window.NysaState.reset();
        window.showToast && window.showToast('Demo data reset');
        setTimeout(function () { location.reload(); }, 400);
      });
      sep.parentNode.insertBefore(item, sep);
    });
  });

})();
