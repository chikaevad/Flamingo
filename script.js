/* =============================================================
   FLAMINGO / a study in pink — runtime
   ============================================================= */
(() => {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- custom cursor ---------- */
  const cursor = $(".cursor");
  const trail  = $(".cursor-trail");

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let trailX = mouseX;
  let trailY = mouseY;

  window.addEventListener("pointermove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + "px";
    cursor.style.top  = mouseY + "px";
  }, { passive: true });

  // smoothly trailing ring
  function tick(){
    trailX += (mouseX - trailX) * 0.16;
    trailY += (mouseY - trailY) * 0.16;
    trail.style.left = trailX + "px";
    trail.style.top  = trailY + "px";
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // grow over interactive elements
  const linkSelector = "a, button, [data-cursor='link'], .card, .leg__bird, .foot__nav a";
  $$(linkSelector).forEach(el => {
    el.addEventListener("pointerenter", () => cursor.classList.add("is-link"));
    el.addEventListener("pointerleave", () => cursor.classList.remove("is-link"));
  });

  // click pulse
  window.addEventListener("pointerdown", () => cursor.classList.add("is-link"));
  window.addEventListener("pointerup",   () => cursor.classList.remove("is-link"));

  /* ---------- glitch on hover: scramble text briefly ---------- */
  // letter-shaped characters so widths stay consistent with the display font
  const SCRAMBLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$&%*+";
  $$("[data-glitch]").forEach(el => {
    // skip elements with child markup (e.g. <br>, <em>) — CSS hover effect still applies
    if (el.children.length > 0) return;
    const original = el.textContent;
    let raf = null;
    let start = 0;
    const dur = 380;
    el.addEventListener("pointerenter", () => {
      cancelAnimationFrame(raf);
      // pin the box so the page doesn't reflow while text scrambles
      const rect = el.getBoundingClientRect();
      el.style.width = rect.width + "px";
      el.style.whiteSpace = "nowrap";
      el.style.textAlign = "center";
      start = performance.now();
      const len = original.length;
      const animate = (now) => {
        const t = (now - start) / dur;
        if (t >= 1) { el.textContent = original; return; }
        let out = "";
        for (let i = 0; i < len; i++){
          const settled = i / len < t;
          out += settled
            ? original[i]
            : (original[i] === " "
                ? " "
                : (Math.random() < 0.5
                    ? original[i]
                    : SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)]));
        }
        el.textContent = out;
        raf = requestAnimationFrame(animate);
      };
      raf = requestAnimationFrame(animate);
    });
    el.addEventListener("pointerleave", () => {
      cancelAnimationFrame(raf);
      el.textContent = original;
      el.style.width = "";
      el.style.whiteSpace = "";
      el.style.textAlign = "";
    });
  });

  /* ---------- counter animation on view ---------- */
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.target || "0");
    const suffix = el.dataset.suffix || "";
    const dur = 1600;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const v = Math.round(easeOut(t) * target);
      el.textContent = v + suffix;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting){
        animateCount(en.target);
        counterIO.unobserve(en.target);
      }
    });
  }, { threshold: 0.4 });
  $$(".num").forEach(el => counterIO.observe(el));

  /* ---------- anatomy fact sync ---------- */
  const facts = $$(".fact");
  const labelGroups = $$(".anatomy__labels g[data-fact]");
  const factIO = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting && en.intersectionRatio > 0.5){
        const i = en.target.dataset.fact;
        labelGroups.forEach(g => {
          g.classList.toggle("is-active", g.dataset.fact === i);
        });
      }
    });
  }, { threshold: [0.5, 0.75] });
  facts.forEach(f => factIO.observe(f));

  /* ---------- flock: inject flamingo SVGs ---------- */
  const flockSVG = `
    <svg viewBox="0 0 400 600" preserveAspectRatio="xMidYMid meet">
      <g>
        <path d="M335 332 Q372 312 380 278 L355 338 Z" fill="currentColor"/>
        <ellipse cx="245" cy="335" rx="105" ry="58" fill="currentColor"/>
        <path d="M205 325 Q260 295 305 320 Q280 340 225 345 Z" fill="rgba(0,0,0,.2)"/>
        <path d="M188 320 Q128 285 148 220 Q170 148 218 132 Q272 118 268 70"
              stroke="currentColor" stroke-width="22" fill="none"
              stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="265" cy="68" r="18" fill="currentColor"/>
        <circle cx="271" cy="64" r="2.4" fill="#0A0A0A"/>
        <path d="M281 72 Q307 78 310 100 Q296 92 282 84 Z" fill="#0A0A0A"/>
        <line x1="222" y1="390" x2="222" y2="568" stroke="currentColor" stroke-width="11" stroke-linecap="round"/>
        <circle cx="222" cy="430" r="6" fill="currentColor"/>
        <path d="M210 568 L 248 568" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>
        <path d="M268 385 L 288 445 L 254 472" stroke="currentColor" stroke-width="11"
              fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="288" cy="445" r="6" fill="currentColor"/>
      </g>
    </svg>`;
  $$(".flock__bird").forEach(el => { el.innerHTML = flockSVG; });

  /* ---------- click trail: pink ink splat ---------- */
  window.addEventListener("click", (e) => {
    if (e.target.closest("a, button")) return;
    const splat = document.createElement("span");
    splat.className = "splat";
    splat.style.left = e.clientX + "px";
    splat.style.top  = e.clientY + "px";
    document.body.appendChild(splat);
    setTimeout(() => splat.remove(), 700);
  });

  /* ---------- smooth-scroll for anchor links ---------- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href").slice(1);
      const t = document.getElementById(id);
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  /* ---------- inject splat styles once (so script is self-contained) ---------- */
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    .splat{
      position:fixed; width:8px; height:8px;
      background: var(--hot);
      border-radius:50%;
      pointer-events:none;
      mix-blend-mode: multiply;
      z-index: 9500;
      translate: -50% -50%;
      animation: splat .65s cubic-bezier(.2,.7,.2,1) forwards;
    }
    @keyframes splat{
      0%   { transform: scale(.4); opacity: 1; }
      100% { transform: scale(14);  opacity: 0; }
    }
  `;
  document.head.appendChild(styleEl);

  /* ---------- konami pose: press F to make page flamingo-tilt ---------- */
  window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "f"){
      document.documentElement.classList.toggle("flamingo-tilt");
    }
  });
  const tiltStyle = document.createElement("style");
  tiltStyle.textContent = `
    .flamingo-tilt body{
      transform: rotate(-2deg);
      transition: transform .8s cubic-bezier(.2,.9,.2,1.1);
    }
  `;
  document.head.appendChild(tiltStyle);

})();
