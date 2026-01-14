(() => {
  /**
   * This file implements an ID-based navigation panel for HTML documents.
   * It supports three modes, controlled via URL parameters:
   * - panel: shows a navigation panel only, hiding the main content. Used in a popover inside MMU HTML viewer.
   * - full: shows a navigation panel alongside the main content. It allows collapsing section and highlighting a selected element.
   * - debug: shows a navigation panel alongside the main content, with debug borders.
   *
   * URL Parameters:
   * - mode (optional): "panel", "full", or "debug". When omitted or invalid, the script do nothing.
   * - id (optional) : the ID of the element to highlight and focus on (used in "full" mode)
   *
   * TODO Handle traductions in labels/tooltips if needed. Only english for now.
   */

  // ---------------- Heading tags for content collapsing ----------------
  const HEADING_TAGS = ["H1", "H2", "H3", "H4", "H5", "H6"];

  // ---------------- Parse URL params ----------------
  const params = new URLSearchParams(window.location.search);
  const mode = (params.get("mode") || "").toLowerCase(); // panel | full | debug
  const selectedId = params.get("id") || null;

  /* If mode is not recognized, do nothing */
  const enablePanel = mode === "panel" || mode === "full" || mode === "debug";
  const enableCollapse = mode === "full" || mode === "panel";
  const enableDebugBorders = mode === "debug";

  // ---------------- Collect elements with IDs ----------------
  const allEls = Array.from(document.querySelectorAll("*"));
  const elsWithId = allEls.filter((el) => el.id);

  // ---------------- Duplicate ID detection ----------------
  const idCounts = {};
  for (const el of elsWithId) {
    const id = el.id.trim();
    if (!id) continue;
    idCounts[id] = (idCounts[id] || 0) + 1;
  }
  const duplicateIds = Object.keys(idCounts).filter((id) => idCounts[id] > 1);
  const duplicateIdSet = new Set(duplicateIds);

  // ---------------- Debug borders (debug mode only) ----------------
  if (enableDebugBorders) {
    allEls.forEach((el) => {
      el.style.border = "1px solid rgba(0,0,0,.15)";
    });
    elsWithId.forEach((el) => {
      el.style.border = "2px solid blue";
    });
  }

  // ---------------- Collapse content under headings (full/panel) ----------------
  if (enableCollapse) {
    const levelOf = (el) =>
      HEADING_TAGS.includes(el.tagName) ? Number(el.tagName[1]) : Infinity;
    const isHeading = (el) => HEADING_TAGS.includes(el.tagName || "");

    const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6"));
    for (const h of headings) {
      if (h.closest("details.__idnav_details__")) continue;
      const lvl = levelOf(h);
      const details = document.createElement("details");
      details.className = "__idnav_details__";
      details.open = false;

      const summary = document.createElement("summary");
      while (h.firstChild) summary.appendChild(h.firstChild);
      summary.style.cursor = "pointer";

      if (h.id) {
        details.id = h.id;
        h.removeAttribute("id");
      }

      const content = document.createElement("div");
      h.parentNode.insertBefore(details, h);
      details.appendChild(summary);

      let sib = h.nextSibling;
      while (
        sib &&
        !(sib.nodeType === 1 && isHeading(sib) && levelOf(sib) <= lvl)
      ) {
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
        target.style.backgroundColor = "rgba(255, 0, 0, 0.12)";
        const ancestorSet = new Set();
        let p = target;
        while (p && p !== document.body) {
          if (
            p.tagName === "DETAILS" &&
            p.classList.contains("__idnav_details__")
          )
            ancestorSet.add(p);
          p = p.parentElement;
        }
        const allDetails = Array.from(
          document.querySelectorAll("details.__idnav_details__"),
        );
        for (const d of allDetails) d.open = ancestorSet.has(d);
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }

  /**
   * Build a forest of elements with IDs
   * @param root
   * @returns {*[]}
   */
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

  /**
   * Normalize spaces in a string
   * @param s
   * @returns {string}
   */
  const normalizeSpaces = (s) => (s || "").replace(/\s+/g, " ").trim();

  /**
   * Generate a short snippet from a string (used for labels)
   * @param s
   * @param n
   * @returns {string|*}
   */
  const snippet = (s, n = 40) => {
    const t = normalizeSpaces(s);
    return t.length > n ? t.slice(0, n - 1) + "…" : t;
  };

  /**
   * Generate label and tooltip for an element
   * @param el
   * @returns {{label: (string|*), tooltip: (*|string)}}
   */
  function labelAndTooltipFor(el) {
    // For sections wrapped in <details>, only use the <summary> text as the title
    if (el.tagName === "DETAILS") {
      const sum = el.querySelector(":scope > summary");
      const txt = sum ? sum.textContent || "" : "";
      return {
        label: snippet(txt || (el.id ? `#${el.id}` : "")),
        tooltip: txt,
      };
    }
    const txt = el.textContent || "";
    return { label: snippet(txt || (el.id ? `#${el.id}` : "")), tooltip: txt };
  }

  // ---------------- Panel (nav) ----------------
  if (enablePanel) {
    document.getElementById("__id_nav_panel__")?.remove();

    const panel = document.createElement("div");
    panel.id = "__id_nav_panel__";

    // Panel layout depends on mode
    if (mode === "panel") {
      // Full-width centered (for iframe embedding)
      Object.assign(panel.style, {
        position: "relative",
        width: "100%",
        height: "100%",
        background: "#f7f7f9",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "20px 0",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        fontSize: "13px",
        lineHeight: "1.4",
      });
    } else {
      // Fixed left sidebar (for full/debug)
      Object.assign(panel.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "300px",
        height: "100%",
        background: "#f7f7f9",
        overflowY: "auto",
        zIndex: "2147483646",
        padding: "60px 12px 10px 12px",
        boxShadow: "2px 0 6px rgba(0,0,0,.2)",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        fontSize: "13px",
        lineHeight: "1.4",
        borderRight: "1px solid #e5e7eb",
        display: "block",
      });
      // Make room for the sidebar
      if (!document.body.style.marginLeft)
        document.body.style.marginLeft = "340px";
    }

    const treeContainer = document.createElement("div");
    if (mode === "panel") {
      Object.assign(treeContainer.style, { width: "90%", maxWidth: "600px" });
    }

    // ---- NEW: duplicate ID info at top in panel mode ----
    // ---- duplicate ID info at top in panel mode ----
    if (mode === "panel" && duplicateIds.length > 0) {
      const info = document.createElement("div");
      info.textContent =
        `Warning: duplicate IDs detected (${duplicateIds.length}): ` +
        duplicateIds.join(", ") +
        ". " +
        "Annotations using these elements can be impacted, edit your media to remove duplicates.";
      Object.assign(info.style, {
        width: "90%",
        maxWidth: "600px",
        marginBottom: "12px",
        padding: "6px 8px",
        borderRadius: "4px",
        background: "#fef2f2",
        color: "#991b1b",
        fontSize: "12px",
        border: "1px solid #fecaca",
        boxSizing: "border-box",
      });
      panel.appendChild(info);
    }

    // ---- END NEW BLOCK ----

    panel.appendChild(treeContainer);

    function makeCopyBtn(id) {
      const btn = document.createElement("button");
      const img = document.createElement("img");
      img.src = "/public/copy-icon.png";
      img.alt = "Copy";
      Object.assign(img.style, {
        width: "16px",
        height: "16px",
        display: "block",
      });

      btn.title = "Copy link";
      btn.setAttribute("aria-label", "Copy link");
      Object.assign(btn.style, {
        border: "none",
        background: "transparent",
        cursor: "pointer",
        fontSize: "16px",
        flexShrink: "0",
        padding: "0 4px",
        display: "flex",
        alignItems: "center",
      });

      const status = document.createElement("span");
      status.textContent = "";
      status.style.cssText = "margin-left:4px;font-size:12px;";

      btn.appendChild(img);
      btn.appendChild(status);

      btn.onclick = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        const url = new URL(window.location);
        url.searchParams.set("mode", "full");
        url.searchParams.set("id", id);
        await navigator.clipboard?.writeText(url.toString());
        status.textContent = "Copied!";
        setTimeout(() => (status.textContent = ""), 1500);
        window.parent.postMessage("close-annotation-popover", "*");
        console.log("Close html viewer");
      };

      return btn;
    }

    /**
     * Create a row for a node. Used for leaf nodes in the tree.
     * @param el
     * @param idRaw
     * @returns {HTMLDivElement}
     */
    function nodeRow(el, idRaw) {
      const { label, tooltip } = labelAndTooltipFor(el);
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.justifyContent = "space-between";
      row.style.cursor = "pointer";
      row.style.padding = mode === "panel" ? "4px 8px" : "2px 4px";
      row.title = tooltip;
      if (mode === "panel") row.style.borderBottom = "1px solid #e5e7eb";

      const labelEl = document.createElement("span");
      labelEl.textContent = label;
      labelEl.style.whiteSpace = "nowrap";
      labelEl.style.overflow = "hidden";
      labelEl.style.textOverflow = "ellipsis";
      labelEl.style.flex = "1";
      labelEl.style.paddingRight = "10px";

      // highlight duplicates
      if (idRaw && duplicateIdSet.has(idRaw)) {
        labelEl.style.color = "#b91c1c"; // red text
        labelEl.style.fontWeight = "600"; // semi-bold
        row.title = `${tooltip || ""} (duplicate ID: ${idRaw})`.trim();
      }

      row.appendChild(labelEl);
      if (idRaw) row.appendChild(makeCopyBtn(idRaw));

      // Hover feedback
      row.addEventListener(
        "mouseenter",
        () => (row.style.background = "#fee2e2"), // light red on hover
      );
      row.addEventListener(
        "mouseleave",
        () => (row.style.background = "transparent"),
      );

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

    /**
     * Build a details node for a tree node. Used for non-leaf nodes.
     * @param node
     * @returns {HTMLDetailsElement}
     */
    function buildDetailsNode(node) {
      const { label, tooltip } = labelAndTooltipFor(node.el);
      const details = document.createElement("details");
      details.open = pathIds ? pathIds.has(node.id) : true;

      const summary = document.createElement("summary");
      summary.style.cursor = "pointer";
      summary.style.padding = mode === "panel" ? "4px 8px" : "2px 4px";
      summary.title = tooltip;
      if (mode === "panel") summary.style.borderBottom = "1px solid #e5e7eb";

      // Hover feedback
      summary.addEventListener(
        "mouseenter",
        () => (summary.style.background = "#eef2ff"),
      );
      summary.addEventListener(
        "mouseleave",
        () => (summary.style.background = "transparent"),
      );

      const wrap = document.createElement("span");
      wrap.textContent = label;
      wrap.style.whiteSpace = "nowrap";
      wrap.style.overflow = "hidden";
      wrap.style.textOverflow = "ellipsis";
      wrap.style.flex = "1";
      wrap.style.paddingRight = "10px";

      // highlight duplicates
      if (node.id && duplicateIdSet.has(node.id)) {
        wrap.style.color = "#b91c1c";
        wrap.style.fontWeight = "600";
        summary.title = `${tooltip || ""} (duplicate ID: ${node.id})`.trim();
      }

      summary.appendChild(wrap);
      summary.appendChild(makeCopyBtn(node.id));
      details.appendChild(summary);

      const inner = document.createElement("div");
      inner.style.marginLeft = "12px";
      for (const child of node.children) {
        inner.appendChild(
          child.children && child.children.length
            ? buildDetailsNode(child)
            : nodeRow(child.el, child.id),
        );
      }
      details.appendChild(inner);

      return details;
    }

    const forestNow = buildIdForest();
    forestNow.forEach((node) =>
      treeContainer.appendChild(buildDetailsNode(node)),
    );

    document.body.appendChild(panel);

    // In panel mode: hide all other content
    if (mode === "panel") {
      Array.from(document.body.children).forEach((child) => {
        if (child !== panel) child.style.display = "none";
      });
      panel.style.position = "absolute";
      panel.style.left = "50%";
      panel.style.transform = "translateX(-50%)";
    }
  }
})();
