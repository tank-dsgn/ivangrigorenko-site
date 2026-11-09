// A snapshot of the page: images and text with coordinates
window.__snap = async function (name) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  document.documentElement.style.scrollBehavior = "auto";
  const H = () => document.documentElement.scrollHeight;
  for (let y = 0; y < H(); y += 700) { scrollTo(0, y); await sleep(120); }
  scrollTo(0, H()); await sleep(600); scrollTo(0, 0); await sleep(300);
  const hidden = (el) => {
    for (let p = el; p && p !== document.documentElement; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0) return true;
    }
    return false;
  };
  const key = (u) => { const m = /([0-9a-f]{40})/.exec(u || ""); return m ? m[1].slice(0, 12) : (u || "").split("/").pop().slice(0, 24); };
  const box = (el) => { const r = el.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top + scrollY), Math.round(r.width), Math.round(r.height)]; };
  const imgs = [], texts = [];
  for (const el of document.querySelectorAll("img")) {
    const b = box(el); if (b[2] < 2 || b[3] < 2 || hidden(el)) continue;
    imgs.push({ k: key(el.currentSrc || el.src), b });
  }
  for (const el of document.querySelectorAll("svg image")) {
    const b = box(el); if (b[2] < 2 || b[3] < 2 || hidden(el)) continue;
    imgs.push({ k: key(el.getAttribute("href")), b });
  }
  for (const el of document.querySelectorAll("[data-isimage] svg")) {
    const b = box(el); if (b[2] < 2 || b[3] < 2 || hidden(el)) continue;
    imgs.push({ k: "svg", b });
  }
  for (const el of document.querySelectorAll("*")) {
    const cs0 = getComputedStyle(el);
    const bg = [cs0.backgroundImage, cs0.maskImage || cs0.webkitMaskImage].filter((v) => v && v.includes("url(") && !/url\(.?data:/.test(v)).join(" ");
    if (!bg) continue;
    const b = box(el); if (b[2] < 2 || b[3] < 2 || hidden(el)) continue;
    for (const m of bg.matchAll(/url\("?([^")]+)"?\)/g)) imgs.push({ k: key(m[1]), b, bg: 1 });
  }
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Map();
  for (let n = tw.nextNode(); n; n = tw.nextNode()) {
    const t = n.textContent.replace(/\s+/g, " ").trim(); if (!t) continue;
    let el = n.parentElement; if (!el || hidden(el)) continue;
    const leaf = el;
    if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(el.tagName)) continue;
    // walk up to the block that consists entirely of text
    while (el.parentElement && getComputedStyle(el).display.startsWith("inline") ) el = el.parentElement;
    if (el.getAttribute("aria-hidden") === "true" && el.tagName === "SPAN") continue;
    const tc = el.closest(".textContents"); if (tc) el = tc;
    if (el.tagName === "LI" || el.parentElement.tagName === "LI") el = el.closest("ul").parentElement.classList.contains("figma-page") ? el.closest("ul") : (tc ? el : el.closest("ul").parentElement);
    if (seen.has(el)) continue; seen.set(el, 1);
    const cs = getComputedStyle(leaf);
    const b = box(el); if (b[2] < 1 || b[3] < 1) continue;
    texts.push({ t: el.innerText.replace(/•/g, "").replace(/\s+/g, " ").trim().slice(0, 60), b, f: Math.round(parseFloat(cs.fontSize) * 10) / 10, w: cs.fontWeight, ff: cs.fontFamily.split(",")[0].replace(/"/g, "").trim(), c: cs.webkitTextFillColor || cs.color, lh: cs.lineHeight });
  }
  const data = { name, url: location.href, w: innerWidth, h: H(), imgs, texts };
  return JSON.stringify(data);
};
