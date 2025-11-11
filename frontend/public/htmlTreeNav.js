// Paste into console or include in a <script> tag
(() => {
  const TEXT_TAGS = ['P','H1','H2','H3','H4','H5','H6','SPAN','DIV'];
  const HEADING_TAGS = ['H1','H2','H3','H4','H5','H6'];

  const params = new URLSearchParams(window.location.search);
  const mode = (params.get('mode') || 'panel').toLowerCase(); // 'panel' | 'full' | 'debug'
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
  function labelFor(el, id, useIndex = true) {
    if (idFreq[id] > 1 && useIndex) {
      const idx = elsWithId.filter(e => e.id === id).indexOf(el) + 1;
      return `#${id} [${idx}/${idFreq[id]}]`;
    }
    return `#${id}`;
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
      padding: '10px 12px',
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

    function nodeRow(text, el) {
      const row = document.createElement('div');
      row.textContent = text;
      row.style.cursor = 'pointer';
      row.style.padding = '2px 4px';
      row.style.borderRadius = '4px';
      row.onmouseenter = () => (row.style.background = '#eef2ff');
      row.onmouseleave = () => (row.style.background = 'transparent');
      row.onclick = () => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const prev = el.style.outline;
        el.style.outline = '3px solid orange';
        setTimeout(() => { el.style.outline = prev; }, 1500);
      };
      return row;
    }

    function buildDetailsNode(node) {
      const hasChildren = node.children && node.children.length > 0;
      if (!hasChildren) return nodeRow(labelFor(node.el, node.id), node.el);

      const details = document.createElement('details');
      details.open = false;
      const summary = document.createElement('summary');
      summary.textContent = labelFor(node.el, node.id);
      summary.style.cursor = 'pointer';
      summary.style.padding = '2px 4px';
      summary.style.borderRadius = '4px';
      summary.onmouseenter = () => (summary.style.background = '#eef2ff');
      summary.onmouseleave = () => (summary.style.background = 'transparent');
      details.appendChild(summary);

      const inner = document.createElement('div');
      inner.style.marginLeft = '12px';
      for (const child of node.children) inner.appendChild(buildDetailsNode(child));
      details.appendChild(inner);
      return details;
    }

    function renderTree(filterText = '') {
      treeContainer.innerHTML = '';
      const ft = filterText.trim().toLowerCase();
      const matches = (node) => labelFor(node.el, node.id, false).toLowerCase().includes(ft);
      function filterNode(node) {
        if (!ft) return node;
        const kids = (node.children || []).map(filterNode).filter(Boolean);
        if (matches(node) || kids.length) return { ...node, children: kids };
        return null;
      }
      const forestNow = buildIdForest();
      const filtered = ft ? forestNow.map(filterNode).filter(Boolean) : forestNow;
      for (const node of filtered) treeContainer.appendChild(buildDetailsNode(node));
    }

    renderTree();

    const filterInput = header.querySelector('#__id_nav_filter__');
    filterInput.addEventListener('input', () => renderTree(filterInput.value));

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
