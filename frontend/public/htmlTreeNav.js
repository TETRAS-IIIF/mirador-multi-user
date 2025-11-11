(() => {
  const HEADING_TAGS = ['H1','H2','H3','H4','H5','H6'];

  const params = new URLSearchParams(window.location.search);
  const mode = (params.get('mode') || 'panel').toLowerCase(); // panel | full | debug
  const selectedId = params.get('id') || null;

  const enablePanel = mode === 'panel' || mode === 'full' || mode === 'debug';
  const enableCollapse = mode === 'full';
  const enableDebugBorders = mode === 'debug';

  const allEls = Array.from(document.querySelectorAll('*'));
  const elsWithId = allEls.filter(el => el.id);

  // ---------------- Debug borders (debug mode only) ----------------
  if (enableDebugBorders) {
    allEls.forEach(el => { el.style.border = '1px solid rgba(0,0,0,.15)'; });
    elsWithId.forEach(el => { el.style.border = '2px solid blue'; });
  }

  // ---------------- FULL mode: collapse content under headings ----------------
  if (enableCollapse) {
    const levelOf = (el) => (HEADING_TAGS.includes(el.tagName) ? Number(el.tagName[1]) : Infinity);
    const isHeading = (el) => HEADING_TAGS.includes(el.tagName || '');

    const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'));
    for (const h of headings) {
      if (h.closest('details.__idnav_details__')) continue;
      const lvl = levelOf(h);
      const details = document.createElement('details');
      details.className = '__idnav_details__';
      details.open = false;

      const summary = document.createElement('summary');
      while (h.firstChild) summary.appendChild(h.firstChild);
      summary.style.cursor = 'pointer';

      if (h.id) {
        details.id = h.id;
        h.removeAttribute('id');
      }

      const content = document.createElement('div');
      h.parentNode.insertBefore(details, h);
      details.appendChild(summary);

      let sib = h.nextSibling;
      while (sib && !(sib.nodeType === 1 && isHeading(sib) && levelOf(sib) <= lvl)) {
        const next = sib.nextSibling;
        content.appendChild(sib);
        sib = next;
      }
      h.remove();
      if (content.childNodes.length) details.appendChild(content);
    }

    // If id provided: open only sections on the path to the selected element and highlight it
    if (selectedId) {
      const target = document.getElementById(selectedId);
      if (target) {
        target.style.backgroundColor = 'rgba(255, 0, 0, 0.12)';
        const ancestorSet = new Set();
        let p = target;
        while (p && p !== document.body) {
          if (p.tagName === 'DETAILS' && p.classList.contains('__idnav_details__')) ancestorSet.add(p);
          p = p.parentElement;
        }
        const allDetails = Array.from(document.querySelectorAll('details.__idnav_details__'));
        for (const d of allDetails) d.open = ancestorSet.has(d);
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  // ---------------- Tree data ----------------
  function buildIdForest(root = document.body) {
    const forest = [];
    function walk(node, parentList) {
      if (node.id) {
        const n = { el: node, id: node.id, children: [] };
        parentList.push(n);
        for (const c of node.children) walk(c, n.children);
      } else {
        for (const c of node.children) walk(c, parentList);
      }
    }
    walk(root, forest);
    return forest;
  }

  const normalizeSpaces = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const snippet = (s, n = 40) => {
    const t = normalizeSpaces(s);
    return t.length > n ? t.slice(0, n - 1) + '…' : t;
  };

  function labelAndTooltipFor(el) {
    const txt = el.textContent || '';
    return { label: snippet(txt || (el.id ? `#${el.id}` : '')), tooltip: txt };
  }

  // ---------------- Panel (nav) ----------------
  if (enablePanel) {
    document.getElementById('__id_nav_panel__')?.remove();

    const panel = document.createElement('div');
    panel.id = '__id_nav_panel__';

    // Panel layout depends on mode
    if (mode === 'panel') {
      // Full-width centered (for iframe embedding)
      Object.assign(panel.style, {
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#f7f7f9',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '20px 0',
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        fontSize: '13px',
        lineHeight: '1.4'
      });
    } else {
      // Fixed left sidebar (for full/debug)
      Object.assign(panel.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '300px',
        height: '100%',
        background: '#f7f7f9',
        overflowY: 'auto',
        zIndex: '2147483646',
        padding: '60px 12px 10px 12px',
        boxShadow: '2px 0 6px rgba(0,0,0,.2)',
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        fontSize: '13px',
        lineHeight: '1.4',
        borderRight: '1px solid #e5e7eb',
        display: 'block'
      });
      // Make room for the sidebar
      if (!document.body.style.marginLeft) document.body.style.marginLeft = '300px';
    }

    const treeContainer = document.createElement('div');
    if (mode === 'panel') Object.assign(treeContainer.style, { width: '90%', maxWidth: '600px' });
    panel.appendChild(treeContainer);

    function makeCopyBtn(id) {
      const btn = document.createElement('button');
      btn.textContent = '📋';
      btn.title = 'Copy link (full mode)';
      Object.assign(btn.style, {
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontSize: '12px',
        flexShrink: '0',
        padding: '0 4px'
      });
      btn.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        const u = new URL(window.location.origin + window.location.pathname);
        u.searchParams.set('mode', 'full');
        u.searchParams.set('id', id);
        navigator.clipboard?.writeText(u.toString());
      };
      return btn;
    }

    function nodeRow(el, idRaw) {
      const { label, tooltip } = labelAndTooltipFor(el);
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.justifyContent = 'space-between';
      row.style.cursor = 'pointer';
      row.style.padding = mode === 'panel' ? '4px 8px' : '2px 4px';
      row.title = tooltip;
      if (mode === 'panel') row.style.borderBottom = '1px solid #e5e7eb';

      const labelEl = document.createElement('span');
      labelEl.textContent = label;
      labelEl.style.whiteSpace = 'nowrap';
      labelEl.style.overflow = 'hidden';
      labelEl.style.textOverflow = 'ellipsis';
      labelEl.style.flex = '1';
      labelEl.style.paddingRight = '10px';
      row.appendChild(labelEl);
      if (idRaw) row.appendChild(makeCopyBtn(idRaw));
      return row;
    }

    // Compute path to selectedId for auto-collapse of non-selected branches in the tree
    let pathIds = null;
    if (selectedId) {
      const targetEl = document.getElementById(selectedId);
      if (targetEl) {
        pathIds = new Set();
        let p = targetEl;
        while (p && p !== document.body) {
          if (p.id) pathIds.add(p.id);
          p = p.parentElement;
        }
      }
    }

    function buildDetailsNode(node) {
      const { label, tooltip } = labelAndTooltipFor(node.el);
      const details = document.createElement('details');
      details.open = pathIds ? pathIds.has(node.id) : true; // open only branch for selected; else open by default

      const summary = document.createElement('summary');
      summary.style.cursor = 'pointer';
      summary.style.padding = mode === 'panel' ? '4px 8px' : '2px 4px';
      summary.title = tooltip;
      if (mode === 'panel') summary.style.borderBottom = '1px solid #e5e7eb';

      const wrap = document.createElement('span');
      wrap.textContent = label;
      wrap.style.whiteSpace = 'nowrap';
      wrap.style.overflow = 'hidden';
      wrap.style.textOverflow = 'ellipsis';
      wrap.style.flex = '1';
      wrap.style.paddingRight = '10px';
      summary.appendChild(wrap);
      summary.appendChild(makeCopyBtn(node.id));
      details.appendChild(summary);

      const inner = document.createElement('div');
      inner.style.marginLeft = '12px';
      for (const child of node.children) {
        inner.appendChild(child.children && child.children.length ? buildDetailsNode(child) : nodeRow(child.el, child.id));
      }
      details.appendChild(inner);

      return details;
    }

    const forestNow = buildIdForest();
    forestNow.forEach(node => treeContainer.appendChild(buildDetailsNode(node)));

    document.body.appendChild(panel);

    if (mode === 'panel') {
      Array.from(document.body.children).forEach(child => {
        if (child !== panel) child.style.display = 'none';
      });
      panel.style.position = 'absolute';
      panel.style.left = '50%';
      panel.style.transform = 'translateX(-50%)';
    }
  }
})();
