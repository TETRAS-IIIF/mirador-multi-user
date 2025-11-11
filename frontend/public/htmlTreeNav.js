// Paste into console or include in a <script> tag
(() => {
  const TEXT_TAGS = ['P','H1','H2','H3','H4','H5','H6','SPAN','DIV'];
  const HEADING_TAGS = ['H1','H2','H3','H4','H5','H6'];

  const params = new URLSearchParams(window.location.search);
  const mode = (params.get('mode') || 'panel').toLowerCase();
  const selectedId = params.get('id');

  const enablePanel = mode === 'panel' || mode === 'full' || mode === 'debug';
  const enableCollapse = mode === 'full';
  const enableDebugBorders = mode === 'debug';

  const levelOf = (el) => (HEADING_TAGS.includes(el.tagName) ? Number(el.tagName[1]) : Infinity);
  const isHeading = (el) => HEADING_TAGS.includes(el.tagName || '');

  const allEls = Array.from(document.querySelectorAll('*'));
  const elsWithId = allEls.filter(el => el.id);
  const textNoId = allEls.filter(el => !el.id && TEXT_TAGS.includes(el.tagName));

  if (enableDebugBorders) {
    allEls.forEach(el => { el.style.border = '1px solid rgba(0,0,0,.15)'; });
    elsWithId.forEach(el => { el.style.border = '2px solid blue'; });
    textNoId.forEach(el => { el.style.border = '2px solid red'; });
  }

  if (enableCollapse) {
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
      summary.style.padding = '2px 4px';
      summary.style.borderRadius = '4px';
      summary.onmouseenter = () => (summary.style.background = '#eef2ff');
      summary.onmouseleave = () => (summary.style.background = 'transparent');

      if (h.id) {
        details.id = h.id;
        h.removeAttribute('id');
      }

      const content = document.createElement('div');
      content.className = '__idnav_section__';

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

    if (selectedId) {
      const target = document.getElementById(selectedId);
      if (target) {
        target.style.backgroundColor = 'rgba(255, 0, 0, 0.12)';
        target.style.transition = 'background-color 200ms ease-in-out';

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

  const forest = buildIdForest();
  const idFreq = elsWithId.reduce((m, el) => (m[el.id] = (m[el.id] || 0) + 1, m), {});

  const normalizeSpaces = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const snippet = (s, n = 80) => {
    const t = normalizeSpaces(s);
    return t.length > n ? t.slice(0, n - 1) + '…' : t;
  };
  function labelAndTooltipFor(el) {
    if (el.tagName === 'DETAILS') {
      const sum = el.querySelector(':scope > summary');
      const text = sum ? sum.textContent : '';
      return {
        label: snippet(text || (el.id ? `#${el.id}` : '')),
        tooltip: text // only text, hide HTML tags
      };
    }
    const txt = el.textContent || '';
    return {
      label: snippet(txt || (el.id ? `#${el.id}` : '')),
      tooltip: txt // only text, hide HTML tags
    };
  }

  if (enablePanel) {
    document.getElementById('__id_nav_panel__')?.remove();
    document.getElementById('__id_nav_toggle__')?.remove();

    const panel = document.createElement('div');
    panel.id = '__id_nav_panel__';
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

    const header = document.createElement('div');
    header.innerHTML = `
      <div style="font-weight:600;margin-bottom:8px;">ID Navigator</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
        <span style="background:#e8f0fe;border:1px solid #c6d2ff;border-radius:4px;padding:2px 6px;">with ID: ${document.querySelectorAll('[id]').length}</span>
      </div>
      <input id="__id_nav_filter__" placeholder="Filter IDs…" style="width:100%;padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;margin-bottom:8px;outline:none"/>
      <div style="border-top:1px solid #e5e7eb;margin:8px 0;"></div>
    `;
    panel.appendChild(header);

    const treeContainer = document.createElement('div');
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
        padding: '0 4px',
        lineHeight: '1',
      });
      btn.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        const u = new URL(window.location.origin + window.location.pathname);
        u.searchParams.set('mode', 'full');
        u.searchParams.set('id', id);
        navigator.clipboard?.writeText(u.toString());
        btn.title = 'Copied';
        setTimeout(() => (btn.title = 'Copy link (full mode)'), 1200);
      };
      return btn;
    }

    function nodeRow(el, idRaw) {
      const { label, tooltip } = labelAndTooltipFor(el);
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '6px';
      row.style.cursor = 'pointer';
      row.style.padding = '2px 4px';
      row.style.borderRadius = '4px';
      row.title = tooltip;

      const labelEl = document.createElement('span');
      labelEl.textContent = label;
      labelEl.style.whiteSpace = 'nowrap';
      labelEl.style.overflow = 'hidden';
      labelEl.style.textOverflow = 'ellipsis';
      row.appendChild(labelEl);

      if (idRaw) row.appendChild(makeCopyBtn(idRaw));

      if (idRaw && idRaw === selectedId) {
        row.style.background = 'rgba(255,0,0,.3)';
        row.style.fontWeight = '700';
      }

      row.onmouseenter = () => (row.style.background = idRaw === selectedId ? 'rgba(255,0,0,.4)' : '#eef2ff');
      row.onmouseleave = () => (row.style.background = idRaw === selectedId ? 'rgba(255,0,0,.3)' : 'transparent');
      row.onclick = () => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const prev = el.style.outline;
        el.style.outline = '3px solid orange';
        setTimeout(() => { el.style.outline = prev; }, 1500);
      };
      return row;
    }

    function buildDetailsNode(node) {
      const { label, tooltip } = labelAndTooltipFor(node.el);
      const details = document.createElement('details');
      details.open = true;

      const summary = document.createElement('summary');
      summary.style.cursor = 'pointer';
      summary.style.padding = '2px 4px';
      summary.style.borderRadius = '4px';
      summary.title = tooltip;

      const wrap = document.createElement('span');
      wrap.textContent = label;
      wrap.style.whiteSpace = 'nowrap';
      wrap.style.overflow = 'hidden';
      wrap.style.textOverflow = 'ellipsis';
      if (node.id === selectedId) {
        wrap.style.background = 'rgba(255,0,0,.3)';
        wrap.style.fontWeight = '700';
        wrap.style.padding = '0 4px';
        wrap.style.borderRadius = '3px';
      }
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

    const toggle = document.createElement('button');
    toggle.id = '__id_nav_toggle__';
    toggle.textContent = '☰ IDs';
    Object.assign(toggle.style, {
      position: 'fixed',
      top: '10px',
      left: '10px',
      zIndex: '2147483647',
      background: '#2563eb',
      color: '#fff',
      border: 'none',
      padding: '6px 10px',
      borderRadius: '6px',
      cursor: 'pointer',
      boxShadow: '0 1px 2px rgba(0,0,0,.2)'
    });

    let visible = true;
    toggle.onclick = () => {
      visible = !visible;
      panel.style.display = visible ? 'block' : 'none';
    };

    document.body.appendChild(toggle);
    document.body.appendChild(panel);
  }
})();
