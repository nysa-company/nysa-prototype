// NYSA prototype — calendar data + renderer (Jul 10 calendar improvement session).
// D44A: three prebuilt weeks, working prev/next/Today (Day/Month stay honest stubs).
// D45A: per-calendar toggles — each event carries a `cal` id matching a sidebar
//       .cal-row[data-cal]; the D18A due chip is a task overlay, never hidden.
// D43B: Kredi calendar events render blue (event-blue); iris stays needs-you only.
// D46B: calendar-event.html hosts two drawer states via ?id= (kredi-offsite default,
//       bancora-sync processed) — same routing grammar as records.js (D19).
// Convention (ruled Jul 10): Calendar is a user-level Mission Control surface
// (spec §4.4) — it aggregates every connected account and deliberately does NOT
// filter with the workspace switcher. Don't "fix" that.

(function () {
  var grid = document.querySelector('.week-grid');
  if (!grid) return;

  var STUB = 'Not in this prototype yet';

  // Canonical week = index 1. Hours render 06:00–22:00 at 64px/hour (top = (h-6)*64).
  var WEEKS = [
    {
      range: 'Jun 28 \u2013 Jul 4, 2026', miniRow: 0,
      days: ['Sun Jun 28', 'Mon Jun 29', 'Tue Jun 30', 'Wed Jul 1', 'Thu Jul 2', 'Fri Jul 3', 'Sat Jul 4'],
      allday: [],
      events: [
        { day: 2, top: 640, h: 64, title: 'HandyPass product review', sub: '16:00 \u00b7 HandyPass', cls: 'event-amber', cal: 'product' },
        { day: 4, top: 832, h: 64, title: 'Family dinner', sub: '19:00 \u00b7 Personal', cls: 'event-gray', cal: 'family' },
        { day: 5, top: 192, h: 44, title: 'Weekly partner sync', sub: '09:00 \u00b7 Kredi', cls: 'event-blue', cal: 'kredi-cal', href: 'meeting-detail.html?id=weekly-partner-sync' }
      ]
    },
    {
      range: 'Jul 5 \u2013 11, 2026', miniRow: 1, todayIdx: 3, nowLine: { day: 3, top: 485 },
      days: ['Sun Jul 5', 'Mon Jul 6', 'Tue Jul 7', 'Wed Jul 8', 'Thu Jul 9', 'Fri Jul 10', 'Sat Jul 11'],
      allday: [
        { day: 1, cls: 'allday-purple', label: 'Company Holiday', cal: 'company-holidays' },
        { day: 5, cls: 'allday-slate', label: 'Erika\u2019s Birthday', cal: 'team-birthdays' },
        { day: 5, due: true, label: 'Proposal due \u2014 Bancora integration', href: 'tasks-detail.html?id=t1' }
      ],
      events: [
        { id: 'bancora-sync', day: 1, top: 256, h: 48, title: 'Bancora sync', sub: '10:00 \u00b7 Kredi', cls: 'event-blue', cal: 'kredi-cal', href: 'calendar-event.html?id=bancora-sync' },
        { day: 2, top: 192, h: 44, title: 'Altiva demo prep', sub: '09:00 \u00b7 Kredi', cls: 'event-blue', cal: 'kredi-cal', href: 'meeting-detail.html?id=altiva-prep', lock: true },
        { day: 2, top: 448, h: 64, title: 'Dentist', sub: '13:00 \u00b7 Personal', cls: 'event-gray', cal: 'personal' },
        { day: 2, top: 640, h: 64, title: 'HandyPass pitch review', sub: '16:00 \u00b7 HandyPass', cls: 'event-amber', cal: 'handypass' },
        { id: 'kredi-offsite', day: 3, top: 512, h: 64, title: 'Kredi offsite planning', sub: '14:00 \u00b7 Kredi', cls: 'event-blue', cal: 'kredi-cal', href: 'calendar-event.html?id=kredi-offsite' },
        { day: 4, top: 320, h: 59, title: 'Passport appointment', sub: '11:00 \u00b7 Personal', cls: 'event-gray', cal: 'personal' },
        { day: 4, top: 576, h: 44, title: 'Redlines review call', sub: '15:00 \u00b7 Kredi', cls: 'event-blue', cal: 'kredi-cal', href: 'meeting-detail.html?id=redlines-review' },
        { day: 5, top: 640, h: 44, title: 'HandyPass investor call', sub: '16:00 \u00b7 HandyPass', cls: 'event-amber', cal: 'investors', href: 'meeting-detail.html?id=handypass-investor' }
      ]
    },
    {
      range: 'Jul 12 \u2013 18, 2026', miniRow: 2,
      days: ['Sun Jul 12', 'Mon Jul 13', 'Tue Jul 14', 'Wed Jul 15', 'Thu Jul 16', 'Fri Jul 17', 'Sat Jul 18'],
      allday: [],
      events: [
        { day: 1, top: 192, h: 44, title: 'Weekly partner sync', sub: '09:00 \u00b7 Kredi', cls: 'event-blue', cal: 'kredi-cal' },
        { day: 4, top: 320, h: 59, title: 'Passport pickup', sub: '11:00 \u00b7 Personal', cls: 'event-gray', cal: 'personal' }
      ]
    }
  ];

  var LOCK_SVG = '<svg class="event-lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
  var FLAG_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22V3"/></svg>';

  var headersEl = grid.querySelector('.week-day-headers');
  var alldayEl = grid.querySelector('.allday-row');
  var bodyEl = grid.querySelector('.week-body');
  var rangeEl = document.getElementById('week-range');

  var weekIdx = 1; // canonical week
  var hiddenCals = {};
  var selectedId = null;
  if (document.querySelector('.drawer')) {
    selectedId = new URLSearchParams(location.search).get('id') || 'kredi-offsite';
  }

  function render() {
    var w = WEEKS[weekIdx];

    headersEl.innerHTML = w.days.map(function (d, i) {
      return '<div class="day-header' + (w.todayIdx === i ? ' today' : '') + '">' + d + '</div>';
    }).join('');

    alldayEl.innerHTML = w.days.map(function (_, i) {
      var chips = w.allday.filter(function (c) { return c.day === i; }).map(function (c) {
        if (c.due) {
          return '<a class="allday-chip due" href="' + c.href + '">' + FLAG_SVG + c.label + '</a>';
        }
        var hide = hiddenCals[c.cal] ? ' hidden' : '';
        return '<div class="allday-chip ' + c.cls + '" data-cal="' + c.cal + '"' + hide + '>' + c.label + '</div>';
      }).join('');
      return '<div class="allday-cell' + (i === 0 || i === 6 ? ' weekend' : '') + '">' + chips + '</div>';
    }).join('');

    bodyEl.innerHTML = w.days.map(function (_, i) {
      var evs = w.events.filter(function (e) { return e.day === i; }).map(function (e) {
        var sel = selectedId && e.id === selectedId;
        var cls = 'cal-event ' + e.cls + (sel ? ' selected' : '');
        var hide = hiddenCals[e.cal] ? ' hidden' : '';
        var style = 'top:' + e.top + 'px;height:' + e.h + 'px;';
        var inner = '<div class="event-title">' + e.title + (e.lock ? ' ' + LOCK_SVG : '') + '</div><div class="event-sub">' + e.sub + '</div>';
        if (sel) return '<a class="' + cls + '" href="calendar.html" data-cal="' + e.cal + '"' + hide + ' style="' + style + '">' + inner + '</a>';
        if (e.href) return '<a class="' + cls + '" href="' + e.href + '" data-cal="' + e.cal + '"' + hide + ' style="' + style + '">' + inner + '</a>';
        return '<a class="' + cls + '" data-toast="' + STUB + '" data-cal="' + e.cal + '"' + hide + ' style="' + style + 'cursor:pointer;">' + inner + '</a>';
      }).join('');
      var now = (w.nowLine && w.nowLine.day === i) ? '<div class="now-line" style="top:' + w.nowLine.top + 'px;"></div>' : '';
      return '<div class="day-col' + (i === 0 || i === 6 ? ' weekend' : '') + '">' + evs + now + '</div>';
    }).join('');

    if (rangeEl) rangeEl.textContent = w.range;
    document.querySelectorAll('.mini-cal-row').forEach(function (row, i) {
      row.classList.toggle('viewing', i === w.miniRow);
    });
  }

  // Prev / next / Today (D44A). Edges stay honest stubs.
  var navBtns = document.querySelectorAll('.week-nav-btn');
  if (navBtns.length === 2) {
    navBtns[0].addEventListener('click', function () {
      if (weekIdx > 0) { weekIdx--; render(); } else if (window.showToast) window.showToast(STUB);
    });
    navBtns[1].addEventListener('click', function () {
      if (weekIdx < WEEKS.length - 1) { weekIdx++; render(); } else if (window.showToast) window.showToast(STUB);
    });
  }
  var todayBtn = document.getElementById('today-btn');
  if (todayBtn) {
    todayBtn.addEventListener('click', function () {
      if (weekIdx !== 1) { weekIdx = 1; render(); }
      else if (window.showToast) window.showToast('You\u2019re viewing the current week (Jul 5\u201311)');
    });
  }

  // Per-calendar toggles (D45A) — same show/hide grammar as the Knowledge chip filter.
  document.querySelectorAll('.cal-row[data-cal]').forEach(function (row) {
    row.addEventListener('click', function () {
      var cal = row.getAttribute('data-cal');
      hiddenCals[cal] = !hiddenCals[cal];
      row.classList.toggle('off', !!hiddenCals[cal]);
      document.querySelectorAll('[data-cal="' + cal + '"]').forEach(function (el) {
        if (el.classList.contains('cal-event') || el.classList.contains('allday-chip')) el.hidden = !!hiddenCals[cal];
      });
    });
  });

  // Drawer state switch (D46B) — show the ?id= body; default kredi-offsite.
  if (selectedId) {
    var bodies = document.querySelectorAll('.drawer-body[data-event]');
    var matched = false;
    bodies.forEach(function (b) {
      var on = b.getAttribute('data-event') === selectedId;
      b.hidden = !on;
      if (on) matched = true;
    });
    if (!matched && bodies.length) { bodies[0].hidden = false; selectedId = bodies[0].getAttribute('data-event'); }
    // Follow-up line reflects shared demo state (records.js / NysaState, D19).
    var followup = document.getElementById('followup-t1');
    if (followup && window.NysaState && window.NysaState.getApproval('t1') === 'approved') {
      followup.innerHTML = 'Follow-up: <span class="followup-receipt">proposal approved and sent \u2014 receipt on the meeting page</span>';
    }
  }

  render();
})();
