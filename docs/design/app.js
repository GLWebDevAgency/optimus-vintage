(function(){
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let uid = 0;
  function stitchSVG(pct){
    const id = "stm" + (++uid);
    const w = 1000;
    return `<svg viewBox="0 0 ${w} 14" preserveAspectRatio="none" aria-hidden="true"><defs><mask id="${id}"><path class="maskline" d="M0 7 H${w}" pathLength="1"/></mask></defs><path class="base" d="M0 7 H${w}"/><path class="run" d="M0 7 H${w*pct/100}" mask="url(#${id})"/></svg>`;
  }
  function initStitches(root){ root.querySelectorAll(".stitch[data-pct]").forEach(el=>{ el.innerHTML = stitchSVG(+el.dataset.pct); }); }
  const fmt = (v,d)=> v.toLocaleString("fr-FR",{minimumFractionDigits:d,maximumFractionDigits:d});
  function tally(el){
    const to = parseFloat(el.dataset.to), d = +(el.dataset.dec||0), dur = 1400, t0 = performance.now();
    if(reduce){ el.textContent = fmt(to,d); return; }
    function step(t){ const p = Math.min(1,(t-t0)/dur); const e = 1-Math.pow(1-p,4); el.textContent = fmt(to*e,d); if(p<1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  function initTallies(root){ root.querySelectorAll(".tally[data-to]").forEach(tally); }
  function init(root){ initStitches(root); initTallies(root); }
  // Lazy start: run when visible
  const io = new IntersectionObserver(es=>{ es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.remove("paused"); init(e.target); e.target.dataset.live="1"; io.unobserve(e.target);} }); },{threshold:.15});
  document.querySelectorAll(".demo, .phone, .price-hero, .comp").forEach(n=>{ n.classList.add("paused"); io.observe(n); });
  // Replay: clone node to restart CSS animations, then re-init JS
  function replay(node){ const c = node.cloneNode(true); c.classList.remove("paused"); node.replaceWith(c); init(c); bind(c); return c; }
  function bind(scope){
    scope.querySelectorAll("[data-replay]").forEach(b=> b.onclick = ()=>{ const stage = b.closest(".demo").querySelector(".stage"); const c = stage.cloneNode(true); stage.replaceWith(c); init(c); });
    scope.querySelectorAll(".snap").forEach(s=> s.onclick = ()=> s.setAttribute("aria-checked", s.getAttribute("aria-checked")==="true"?"false":"true"));
    scope.querySelectorAll(".chip").forEach(c=> c.onclick = ()=>{ c.parentElement.querySelectorAll(".chip").forEach(x=>x.setAttribute("aria-pressed","false")); c.setAttribute("aria-pressed","true"); });
  }
  bind(document);
  document.querySelector("[data-replay-all]").onclick = ()=> document.querySelectorAll(".phone").forEach(replay);
  const phones = document.getElementById("phones");
  document.querySelectorAll("[data-skin]").forEach(b=> b.onclick = ()=>{
    document.querySelectorAll("[data-skin]").forEach(x=>x.setAttribute("aria-pressed","false")); b.setAttribute("aria-pressed","true");
    phones.classList.remove("skin-calico","skin-indigo"); if(b.dataset.skin!=="auto") phones.classList.add("skin-"+b.dataset.skin);
    document.querySelectorAll(".phone").forEach(replay);
  });
})();
