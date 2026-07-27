// Sidebar behavior: collapse to icon rail + workspace switcher popover.
// Workspace switch (Decision 27, option A): the active workspace lives in
// localStorage['nysa-workspace'] (kredi default | personal | handypass).
// Every page reads it on load, re-skins the sidebar identity, moves the
// popover checkmark, and shows/hides any [data-workspace] content block.
(function () {
  var WORKSPACES = {
    kredi: { name: 'Kredi', tileClass: '', tileHTML: '<img src="assets/kredi-logo.png" alt="Kredi">' },
    personal: { name: 'Personal', tileClass: 'tile-p', tileHTML: 'P' },
    handypass: { name: 'HandyPass', tileClass: 'tile-h', tileHTML: 'H' }
  };
  var current = localStorage.getItem('nysa-workspace') || 'kredi';
  if (!WORKSPACES[current]) current = 'kredi';
  window.NysaWorkspace = current;
  window.NysaWorkspaceName = WORKSPACES[current].name;

  // Content filtering applies on every page (settings.html has no sidebar
  // but list pages always do; this runs regardless of the sidebar guard below).
  document.querySelectorAll('[data-workspace]').forEach(function (el) {
    var scopes = el.getAttribute('data-workspace').split(/\s+/);
    el.hidden = scopes.indexOf(current) === -1;
  });

  var sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  // Collapse state persists across pages.
  if (localStorage.getItem('nysa-sidebar-collapsed') === '1') sidebar.classList.add('collapsed');

  var collapseBtn = sidebar.querySelector('.sidebar-collapse');
  if (collapseBtn) collapseBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    var collapsed = sidebar.classList.toggle('collapsed');
    localStorage.setItem('nysa-sidebar-collapsed', collapsed ? '1' : '0');
  });

  // Re-skin the sidebar header tile + name for the active workspace.
  var logoTile = sidebar.querySelector('.sidebar-logo-tile');
  var nameEl = sidebar.querySelector('.sidebar-workspace-name');
  var ws = WORKSPACES[current];
  if (logoTile && nameEl) {
    logoTile.className = 'sidebar-logo-tile' + (ws.tileClass ? ' ' + ws.tileClass : '');
    logoTile.innerHTML = ws.tileHTML;
    nameEl.textContent = ws.name;
  }

  var header = sidebar.querySelector('.sidebar-workspace-header');
  var popover = sidebar.querySelector('.workspace-popover');
  if (header && popover) {
    // Move the existing checkmark to the active row.
    var checkSvg = popover.querySelector('svg.check');
    var rows = popover.querySelectorAll('.workspace-row');
    rows.forEach(function (row) {
      if (checkSvg && row.getAttribute('data-workspace-id') === current) row.appendChild(checkSvg);
    });

    header.addEventListener('click', function (e) {
      e.stopPropagation();
      popover.classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      if (!popover.contains(e.target)) popover.classList.remove('open');
    });
    // Clicking a workspace row switches the active workspace and reloads.
    rows.forEach(function (row) {
      row.addEventListener('click', function () {
        var id = row.getAttribute('data-workspace-id');
        if (id && id !== current) {
          localStorage.setItem('nysa-workspace', id);
          location.reload();
        } else {
          popover.classList.remove('open');
        }
      });
    });
  }
})();

// Decision 55A — one facet-agnostic search+filter engine (generalizes the
// Decision 53A engine that used to live here just for Projects/Meetings).
// Any [data-facet-filter="<name>"] group of `.facet-option[data-filter]`
// controls filters the page's `[data-search]` rows/cards, ANDed with the
// page's search input and every other active facet group. Facet names map
// to the row attribute they read against a control's data-filter value:
//   visibility   -> data-visibility ("private" flags Only-you; else shared)
//   category     -> data-category   (Knowledge)
//   type         -> data-type       (Companies)
//   relationship -> data-relationship (Persons)
//   status       -> data-status     (Automations)
//   source       -> data-source     (Files' secondary Source popover)
// A facet group and the rows it should apply to only ever count as "active"
// together when both are visible (not hidden by the workspace switch, or —
// Files in Personal — a facet the picked design deliberately hides). That
// one rule is what lets a single pass handle per-workspace facet sets (e.g.
// Knowledge's Kredi vs. Personal category chips) with no extra scoping
// logic: whichever facet group and rows are un-hidden right now belong to
// the same workspace. Runs after the workspace-hiding block above.
(function () {
  // Deliberately NOT `el.closest('[hidden]')`: rows get their `hidden`
  // attribute toggled by this same engine's own apply() below, so checking
  // the live attribute would treat "hidden by last filter pass" as
  // permanently hidden and rows could never come back after Clear filters.
  // Workspace exclusion is re-derived fresh from data-workspace + the
  // current workspace every call instead, which is stateless and safe to
  // check on anything — a row, a facet group, or a search input.
  function isWorkspaceExcluded(el) {
    var scoped = el.closest('[data-workspace]');
    if (!scoped) return false;
    var scopes = scoped.getAttribute('data-workspace').split(/\s+/);
    return scopes.indexOf(window.NysaWorkspace || 'kredi') === -1;
  }

  function matchesFacet(row, facetName, mode) {
    if (mode === 'all') return true;
    if (facetName === 'visibility') {
      var priv = row.getAttribute('data-visibility') === 'private';
      return mode === 'shared' ? !priv : priv;
    }
    return row.getAttribute('data-' + facetName) === mode;
  }

  function activeFacetGroups() {
    var out = [];
    document.querySelectorAll('[data-facet-filter]').forEach(function (group) {
      if (isWorkspaceExcluded(group)) return;
      var opt = group.querySelector('.facet-option.active') || group.querySelector('.facet-option');
      out.push({ name: group.getAttribute('data-facet-filter'), mode: opt ? opt.getAttribute('data-filter') : 'all' });
    });
    return out;
  }

  function visibleSearchInput() {
    var found = null;
    document.querySelectorAll('.search').forEach(function (input) {
      if (!found && !isWorkspaceExcluded(input)) found = input;
    });
    return found;
  }

  function syncSourceLabel(group) {
    if (group.getAttribute('data-facet-filter') !== 'source') return;
    var label = group.querySelector('[data-source-label]');
    var active = group.querySelector('.facet-option.active');
    if (label && active) label.textContent = 'Source: ' + (active.getAttribute('data-label') || active.textContent.trim());
  }

  function syncPressedState(group) {
    group.querySelectorAll('.facet-option').forEach(function (opt) {
      opt.setAttribute('aria-pressed', opt.classList.contains('active') ? 'true' : 'false');
    });
  }

  function apply() {
    var searchInput = visibleSearchInput();
    var query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    var facets = activeFacetGroups();
    // Knowledge's Decision 26 empty state names the active category and only
    // ever appears when there's no search term; adding a search moves the
    // zero-result case to the generic filtered-zero state + reset instead.
    var categoryFacet = (facets.length === 1 && facets[0].name === 'category') ? facets[0] : null;
    var filtering = !!query || facets.some(function (f) { return f.mode !== 'all'; });
    var visibleCount = 0;

    document.querySelectorAll('[data-search]').forEach(function (row) {
      if (isWorkspaceExcluded(row)) { row.hidden = true; return; }
      var searchMatch = !query || row.getAttribute('data-search').indexOf(query) !== -1;
      var facetMatch = facets.every(function (f) { return matchesFacet(row, f.name, f.mode); });
      var show = searchMatch && facetMatch;
      row.hidden = !show;
      if (show) visibleCount++;
    });

    var legacyEmpty = document.querySelector('[data-empty-state]');
    var genericEmpty = document.querySelector('[data-filter-empty]');
    var legacyCase = !!(legacyEmpty && !query && categoryFacet && categoryFacet.mode !== 'all' && visibleCount === 0);
    if (legacyEmpty) {
      legacyEmpty.hidden = !legacyCase;
      if (legacyCase) {
        var nameEl = legacyEmpty.querySelector('.empty-category');
        if (nameEl) nameEl.textContent = categoryFacet.mode;
      }
    }
    document.querySelectorAll('[data-workspace-empty]').forEach(function (empty) {
      empty.hidden = isWorkspaceExcluded(empty) || filtering;
    });
    if (genericEmpty) genericEmpty.hidden = !(filtering && visibleCount === 0 && !legacyCase);
  }

  function resetGroup(group) {
    group.querySelectorAll('.facet-option').forEach(function (opt, i) { opt.classList.toggle('active', i === 0); });
    syncPressedState(group);
    syncSourceLabel(group);
  }

  function resetAll() {
    document.querySelectorAll('.search').forEach(function (input) { if (!isWorkspaceExcluded(input)) input.value = ''; });
    document.querySelectorAll('[data-facet-filter]').forEach(function (group) { if (!isWorkspaceExcluded(group)) resetGroup(group); });
    apply();
  }

  document.addEventListener('input', function (e) {
    if (e.target.classList && e.target.classList.contains('search')) apply();
  });

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-filter-reset]')) { resetAll(); return; }

    var opt = e.target.closest('.facet-option');
    if (!opt) return;
    var group = opt.closest('[data-facet-filter]');
    if (!group) return;
    if (opt.tagName === 'A' && opt.getAttribute('href') === '#') e.preventDefault();
    group.querySelectorAll('.facet-option').forEach(function (o) { o.classList.remove('active'); });
    opt.classList.add('active');
    syncPressedState(group);
    syncSourceLabel(group);
    apply();
    if (window.NysaCloseMenus) window.NysaCloseMenus();
  });

  document.querySelectorAll('[data-facet-filter]').forEach(function (group) {
    syncPressedState(group);
    syncSourceLabel(group);
  });
  apply();
})();

// Prototype navigation: composer send / Enter goes to the conversation.
(function () {
  document.querySelectorAll('.composer[data-send-target]').forEach(function (c) {
    var go = function () { location.href = c.getAttribute('data-send-target'); };
    var send = c.querySelector('.send-btn');
    if (send) send.addEventListener('click', go);
    var input = c.querySelector('.composer-input');
    if (input) input.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
  });
})();

// Toast: window.showToast(msg) + any [data-toast] element shows its message on click.
(function () {
  var node, timer;
  window.showToast = function (msg) {
    if (!node) {
      node = document.createElement('div');
      node.className = 'toast';
      document.body.appendChild(node);
    }
    node.textContent = msg;
    node.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(function () { node.classList.remove('show'); }, 2200);
  };
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-toast]');
    if (!el) return;
    if (el.tagName === 'A' && el.getAttribute('href') === '#') e.preventDefault();
    if (el.getAttribute('data-toast') === 'Signed out') {
      location.href = '2026-07-10-sign-in.html';
      return;
    }
    window.showToast(el.getAttribute('data-toast'));
  });
})();

// D38, option B — "Revision requested" demotes a Needs-you card in place
// (same group, same count) until a revised draft clears NysaState.revisions.
// Runs on any page with [data-approval-id] cards (tasks.html, tasks-detail.html);
// approved cards are left alone here — their own page script owns that render.
(function () {
  if (!window.NysaState) return;
  document.querySelectorAll('[data-approval-id]').forEach(function (card) {
    var id = card.dataset.approvalId;
    if (NysaState.getApproval(id) === 'approved') return;
    if (NysaState.getRevision(id)) {
      card.classList.add('revision-pending');
      var actions = card.querySelector('.needs-you-card-actions');
      if (actions) actions.innerHTML = '<span class="revision-tag">Revision requested</span>';
    }
  });
})();

// Popover menus: [data-menu] toggles the .menu-popover next to it (child or sibling).
// Outside click and Escape close; only one open at a time. Exposes
// window.NysaCloseMenus so other components (e.g. the Files Source facet)
// can close an open popover after a selection without duplicating the logic.
(function () {
  function syncExpanded() {
    document.querySelectorAll('[data-menu]').forEach(function (btn) {
      var menu = btn.querySelector('.menu-popover') || btn.parentElement.querySelector('.menu-popover');
      if (menu) btn.setAttribute('aria-expanded', menu.classList.contains('open') ? 'true' : 'false');
    });
  }
  function closeAll() {
    document.querySelectorAll('.menu-popover.open').forEach(function (m) { m.classList.remove('open'); });
    syncExpanded();
  }
  window.NysaCloseMenus = closeAll;
  document.addEventListener('click', function (e) {
    if (e.target.closest('.sidebar-footer-header .gear')) {
      e.stopPropagation();
      location.href = 'settings.html';
      return;
    }
    if (e.target.closest('.sidebar-footer-header')) {
      closeAll();
      return;
    }
    if (e.target.closest('.menu-popover')) {
      if (e.target.closest('.menu-item')) closeAll();
      return;
    }
    var btn = e.target.closest('[data-menu]');
    if (btn) {
      var menu = btn.querySelector('.menu-popover') || btn.parentElement.querySelector('.menu-popover');
      if (menu) {
        var wasOpen = menu.classList.contains('open');
        closeAll();
        if (!wasOpen) menu.classList.add('open');
        syncExpanded();
        return;
      }
    }
    closeAll();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
  syncExpanded();
})();

// Chips / tabs / segmented controls: clicking moves .active within the sibling group.
// files-tab with data-tab also filters .file-row[data-source] rows.
// filter-chip with data-filter also filters [data-category] cards.
// Legacy path for pages the Decision 55A facet engine above doesn't cover yet
// (knowledge-review.html, knowledge-detail.html, skills.html, files-add-drive.html);
// skips anything the new engine already owns to avoid double-handling a click.
(function () {
  document.addEventListener('click', function (e) {
    var el = e.target.closest('.filter-chip, .files-tab, .segmented-option');
    if (!el) return;
    if (el.closest('[data-facet-filter]')) return;
    if (el.tagName === 'A' && el.getAttribute('href') === '#') e.preventDefault();
    el.parentElement.querySelectorAll('.filter-chip, .files-tab, .segmented-option').forEach(function (s) {
      s.classList.remove('active');
    });
    el.classList.add('active');
    var tab = el.getAttribute('data-tab');
    if (el.classList.contains('files-tab') && tab) {
      document.querySelectorAll('.file-row[data-source]').forEach(function (r) {
        r.style.display = (tab === 'all' || r.getAttribute('data-source') === tab) ? '' : 'none';
      });
    }
    var filter = el.getAttribute('data-filter');
    if (filter) {
      var visibleCount = 0;
      document.querySelectorAll('[data-category]').forEach(function (c) {
        var show = filter === 'all' || c.getAttribute('data-category') === filter;
        c.hidden = !show;
        if (show) visibleCount++;
      });
      var emptyState = document.querySelector('[data-empty-state]');
      if (emptyState) {
        var isEmpty = filter !== 'all' && visibleCount === 0;
        emptyState.hidden = !isEmpty;
        if (isEmpty) emptyState.querySelector('.empty-category').textContent = filter;
      }
    }
  });
})();
