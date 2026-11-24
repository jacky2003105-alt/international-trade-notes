/* 國際貿易課程筆記：互動圖（不依賴外部函式庫；寫法仿 SRM 筆記的 widgets.js）
   用法：正文裡寫 @widget 名稱 {鍵=值, …} | 圖說，組版程式會產生 <div class="tw" data-w="名稱" data-a="鍵=值,…">。
   每個圖：上面是 SVG 座標圖，下面是滑桿與即時計算的結果。顏色用 CSS 變數，深色模式也能讀。 */
(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const C = { navy: '#1c3858', blue: '#2b6cb0', red: '#b4232c', gold: '#b88938', green: '#1f7a4a', gray: '#8a94a6',
    light: '#dce1e8', purple: '#6b46c1', teal: '#0f766e' };
  const E = (tag, a = {}, p) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  const H = (tag, a = {}, p, html) => { const e = document.createElement(tag); for (const k in a) e.setAttribute(k, a[k]); if (html != null) e.innerHTML = html; if (p) p.appendChild(e); return e; };
  const f = (v, d = 2) => { if (!isFinite(v)) return '—'; const s = (+v).toFixed(d); return (s.includes('.') ? s.replace(/\.?0+$/, '') : s) || '0'; };
  const pct = (v, d = 1) => (v >= 0 ? '+' : '') + (v * 100).toFixed(d) + '%';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function args(el) { const o = {}; (el.dataset.a || '').split(',').forEach(kv => { const [k, v] = kv.split('=').map(s => s && s.trim()); if (k) o[k] = isNaN(+v) ? v : +v; }); return o; }
  function nice(span, n = 5) { const s0 = span / n, m = 10 ** Math.floor(Math.log10(s0)); return [1, 2, 2.5, 5, 10].map(k => k * m).find(s => span / s <= n + 0.5) || m * 10; }

  // ---------- 座標圖 ----------
  class Plot {
    constructor(parent, o) {
      this.o = Object.assign({ w: 520, h: 330, m: { l: 50, r: 16, t: 14, b: 42 }, xlab: '', ylab: '' }, o);
      const cw = parent.clientWidth || 600;                    // 手機上用比較小的座標寬度，字才不會被縮得太小
      if (cw < 470 && this.o.w > 340) { const k = 340 / this.o.w; this.o.w = 340; this.o.h = Math.round(this.o.h * Math.max(k, 0.82)); }
      const { w, h } = this.o;
      this.svg = E('svg', { viewBox: `0 0 ${w} ${h}`, class: 'tw-svg', role: 'img' }, parent);
      this.bg = E('g', {}, this.svg); this.g = E('g', {}, this.svg);
      this.setRange(this.o.xr, this.o.yr);
    }
    setRange(xr, yr) { this.xr = xr; this.yr = yr; this.drawAxes(); }
    X(v) { const { w, m } = this.o; return m.l + (v - this.xr[0]) / (this.xr[1] - this.xr[0]) * (w - m.l - m.r); }
    Y(v) { const { h, m } = this.o; return h - m.b - (v - this.yr[0]) / (this.yr[1] - this.yr[0]) * (h - m.t - m.b); }
    drawAxes() {
      const { w, h, m } = this.o; this.bg.innerHTML = '';
      const sx = nice(this.xr[1] - this.xr[0]), sy = nice(this.yr[1] - this.yr[0]);
      for (let v = Math.ceil(this.xr[0] / sx) * sx; v <= this.xr[1] + 1e-9; v += sx) {
        E('line', { x1: this.X(v), x2: this.X(v), y1: h - m.b, y2: m.t, class: 'tw-grid' }, this.bg);
        E('text', { x: this.X(v), y: h - m.b + 16, 'text-anchor': 'middle', class: 'tw-tick' }, this.bg).textContent = f(v, 2);
      }
      for (let v = Math.ceil(this.yr[0] / sy) * sy; v <= this.yr[1] + 1e-9; v += sy) {
        E('line', { x1: m.l, x2: w - m.r, y1: this.Y(v), y2: this.Y(v), class: 'tw-grid' }, this.bg);
        E('text', { x: m.l - 6, y: this.Y(v) + 4, 'text-anchor': 'end', class: 'tw-tick' }, this.bg).textContent = f(v, 2);
      }
      E('line', { x1: m.l, x2: w - m.r, y1: h - m.b, y2: h - m.b, class: 'tw-axis' }, this.bg);
      E('line', { x1: m.l, x2: m.l, y1: m.t, y2: h - m.b, class: 'tw-axis' }, this.bg);
      E('text', { x: (m.l + w - m.r) / 2, y: h - 6, 'text-anchor': 'middle', class: 'tw-lab' }, this.bg).textContent = this.o.xlab;
      const yl = E('text', { x: 14, y: (m.t + h - m.b) / 2, 'text-anchor': 'middle', class: 'tw-lab', transform: `rotate(-90 14 ${(m.t + h - m.b) / 2})` }, this.bg);
      yl.textContent = this.o.ylab;
    }
    clear() { this.g.innerHTML = ''; }
    line(pts, a = {}) { const d = pts.filter(p => isFinite(p[0]) && isFinite(p[1])).map((p, i) => (i ? 'L' : 'M') + this.X(p[0]).toFixed(1) + ' ' + this.Y(p[1]).toFixed(1)).join(''); return E('path', Object.assign({ d, fill: 'none', 'stroke-width': 2.4 }, a), this.g); }
    poly(pts, a = {}) { return E('polygon', Object.assign({ points: pts.map(p => this.X(p[0]).toFixed(1) + ',' + this.Y(p[1]).toFixed(1)).join(' ') }, a), this.g); }
    dot(x, y, a = {}) { return E('circle', Object.assign({ cx: this.X(x), cy: this.Y(y), r: 5 }, a), this.g); }
    text(x, y, t, a = {}) { const e = E('text', Object.assign({ x: this.X(x), y: this.Y(y), class: 'tw-note' }, a), this.g); e.textContent = t; return e; }
    fn(F, x0, x1, a = {}, n = 120) { const pts = []; for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; pts.push([x, F(x)]); } return this.line(pts, a); }
  }

  // ---------- 控制項 ----------
  function panel(el) { const box = H('div', { class: 'tw-ctl' }, el); const out = H('div', { class: 'tw-out', 'aria-live': 'polite' }, el); return { box, out }; }
  function slider(box, label, min, max, step, val, fmt, on) {
    const row = H('label', { class: 'tw-row' }, box);
    H('span', { class: 'tw-name' }, row, label);
    const inp = H('input', { type: 'range', min, max, step, value: val }, row);
    const v = H('output', {}, row);
    const upd = () => { v.textContent = fmt(+inp.value); on(); };
    inp.addEventListener('input', upd); v.textContent = fmt(+val);
    return inp;
  }
  function seg(box, label, opts, on) {
    const row = H('div', { class: 'tw-row tw-seg' }, box); H('span', { class: 'tw-name' }, row, label);
    const wrap = H('span', { class: 'tw-btns' }, row); const btns = [];
    opts.forEach(([k, t], i) => { const b = H('button', { type: 'button', 'data-k': k, class: i ? '' : 'on' }, wrap, t); btns.push(b);
      b.addEventListener('click', () => { btns.forEach(x => x.classList.toggle('on', x === b)); on(k); }); });
    return () => btns.find(b => b.classList.contains('on')).dataset.k;
  }
  const legend = (out, items) => '<p class="tw-leg">' + items.map(([c, t, dash]) => `<span><i style="background:${c}${dash ? ';opacity:.6' : ''}"></i>${t}</span>`).join('') + '</p>';

  const W = {};

  // ===== 第 2 章：李嘉圖模型，兩國的生產可能線、專業化與貿易三角形 =====
  W.ricardo = (el, a) => {
    const P = Object.assign({ aLX: 1, aLY: 2, L: 100, faLX: 6, faLY: 3, fL: 300, p: 1, s: 0.5 }, a);
    const wrap = H('div', { class: 'tw-two' }, el);
    const mk = (who) => new Plot(H('div', {}, wrap), { w: 300, h: 290, m: { l: 42, r: 10, t: 22, b: 40 }, xlab: 'X', ylab: 'Y', xr: [0, 1], yr: [0, 1] });
    const ph = mk('home'), pf = mk('foreign');
    const { box, out } = panel(el);
    const sp = slider(box, '世界相對價格 P<sub>X</sub>/P<sub>Y</sub>', 0.1, 3, 0.05, P.p, v => f(v, 2), draw);
    const ss = slider(box, '對 X 的偏好（支出比例）', 0.2, 0.8, 0.05, P.s, v => Math.round(v * 100) + '%', draw);
    function country(pl, aLX, aLY, L, p, s, name, col) {
      const xm = L / aLX, ym = L / aLY, m = Math.max(xm, ym) * 1.35;
      pl.setRange([0, m], [0, m]); pl.clear();
      pl.text(m * 0.02, m * 0.98, name, { class: 'tw-title' });
      pl.line([[0, ym], [xm, 0]], { stroke: col });
      const oc = aLX / aLY;
      let qx, qy, spec;
      if (p > oc + 1e-9) { qx = xm; qy = 0; spec = '只生產 X'; } else if (p < oc - 1e-9) { qx = 0; qy = ym; spec = '只生產 Y'; } else { qx = s * xm; qy = (1 - s) * ym; spec = '兩樣都生產（無差異）'; }
      const I = p * qx + qy, cx = s * I / p, cy = (1 - s) * I;              // 以 Y 計的所得、Cobb–Douglas 消費
      const ax = s * xm, ay = (1 - s) * ym;                                     // 自給自足的消費點
      pl.line([[0, I], [I / p, 0]], { stroke: C.gold, 'stroke-dasharray': '6 4', 'stroke-width': 1.8 });
      if (Math.abs(qx - cx) > 1e-6) pl.poly([[qx, qy], [Math.min(qx, cx), Math.min(qy, cy)], [cx, cy]], { fill: C.gold, 'fill-opacity': 0.16, stroke: 'none' });
      pl.dot(ax, ay, { fill: C.gray }); pl.text(ax, ay, '  A 自給', { dy: -6 });
      pl.dot(qx, qy, { fill: col }); pl.text(qx, qy, '  Q 生產', { dy: -6 });
      pl.dot(cx, cy, { fill: C.gold }); pl.text(cx, cy, '  C 消費', { dy: 14 });
      const better = cx >= ax - 1e-9 && cy >= ay - 1e-9 && (cx > ax + 1e-9 || cy > ay + 1e-9);
      return { oc, spec, ex: qx - cx, im: cy - qy, cx, cy, ax, ay, better };
    }
    function draw() {
      const p = +sp.value, s = +ss.value;
      const h = country(ph, P.aLX, P.aLY, P.L, p, s, '本國', C.navy);
      const g = country(pf, P.faLX, P.faLY, P.fL, p, s, '外國', C.red);
      const tr = (r) => r.ex > 1e-9 ? `出口 X ${f(r.ex, 1)}、進口 Y ${f(r.im, 1)}` : r.ex < -1e-9 ? `出口 Y ${f(-r.im, 1)}、進口 X ${f(-r.ex, 1)}` : '不貿易';
      const gain = (r) => r.better ? '消費點在生產可能線外，比自給自足好' : (Math.abs(r.cx - r.ax) < 1e-6 ? '和自給自足一樣' : '兩樣沒有都比較多');
      out.innerHTML = legend(out, [[C.navy, '本國生產可能線'], [C.red, '外國生產可能線'], [C.gold, '貿易後的預算線（斜率＝−P<sub>X</sub>/P<sub>Y</sub>）']]) +
        `<table class="tw-tab"><tr><th></th><th>本國</th><th>外國</th></tr>
        <tr><td>X 的機會成本 a<sub>LX</sub>/a<sub>LY</sub></td><td>${f(h.oc)}</td><td>${f(g.oc)}</td></tr>
        <tr><td>生產</td><td>${h.spec}</td><td>${g.spec}</td></tr>
        <tr><td>貿易</td><td>${tr(h)}</td><td>${tr(g)}</td></tr>
        <tr><td>和自給自足比</td><td>${gain(h)}</td><td>${gain(g)}</td></tr></table>
        <p class="tw-hint">價格介於 ${f(Math.min(h.oc, g.oc))} 和 ${f(Math.max(h.oc, g.oc))} 之間時，兩國各自完全專業化，消費點都跑到生產可能線外。拉到區間外，有一國只生產它沒有比較利益的商品，就不再得利。這裡的價格由你設定；世界價格實際落在哪裡，要看世界相對供需（下一個互動圖）。</p>`;
    }
    draw();
  };

  // ===== 第 2 章：世界相對供給（階梯）與相對需求 =====
  W.rsrd = (el, a) => {
    const P = Object.assign({ aLX: 1, aLY: 2, L: 100, faLX: 6, faLY: 3, fL: 300, s: 0.5 }, a);
    const pl = new Plot(el, { xlab: '世界相對產量 (Q_X + Q*_X)/(Q_Y + Q*_Y)', ylab: 'P_X / P_Y', xr: [0, 3], yr: [0, 3] });
    const { box, out } = panel(el);
    const ss = slider(box, '對 X 的支出比例', 0.1, 0.9, 0.02, P.s, v => Math.round(v * 100) + '%', draw);
    const sL = slider(box, '本國勞動 L', 20, 400, 10, P.L, v => f(v, 0), draw);
    function draw() {
      const L = +sL.value, s = +ss.value;
      const oh = P.aLX / P.aLY, of = P.faLX / P.faLY;                       // 假設本國在 X 有比較利益（oh < of）
      const lo = Math.min(oh, of), hi = Math.max(oh, of);
      const homeX = oh < of;
      const qx = homeX ? L / P.aLX : P.fL / P.faLX, qy = homeX ? P.fL / P.faLY : L / P.aLY;
      const k = qx / qy;                                                     // 完全專業化時的相對產量
      const xmax = Math.max(3, k * 2.2), ymax = hi * 1.6;
      pl.setRange([0, xmax], [0, ymax]); pl.clear();
      pl.line([[0, lo], [k, lo], [k, hi], [xmax, hi]], { stroke: C.navy, 'stroke-width': 3 });
      const RD = q => (s / (1 - s)) / q;                                     // Cobb–Douglas：Q_X/Q_Y = (s/(1−s))/(P_X/P_Y)
      pl.fn(RD, Math.max(0.02, s / (1 - s) / ymax), xmax, { stroke: C.red });
      let pe, qe, where;
      if (RD(k) > hi) { pe = hi; qe = (s / (1 - s)) / hi; where = `需求很偏向 X，價格停在 ${f(hi)}（${homeX ? '外國' : '本國'}的機會成本），${homeX ? '外國' : '本國'}兩樣都生產`; }
      else if (RD(k) < lo) { pe = lo; qe = (s / (1 - s)) / lo; where = `需求很偏向 Y，價格停在 ${f(lo)}（${homeX ? '本國' : '外國'}的機會成本），${homeX ? '本國' : '外國'}兩樣都生產`; }
      else { pe = RD(k); qe = k; where = '價格落在兩國機會成本之間，兩國都完全專業化'; }
      pl.dot(qe, pe, { fill: C.gold, r: 6 });
      pl.text(k, lo, ' 階梯的垂直段', { dy: 16 });
      out.innerHTML = legend(out, [[C.navy, '世界相對供給 RS'], [C.red, '世界相對需求 RD'], [C.gold, '均衡']]) +
        `<p>均衡相對價格 P<sub>X</sub>/P<sub>Y</sub> ＝ <b>${f(pe, 3)}</b>，相對產量 ＝ ${f(qe, 3)}。${where}。</p>
         <p class="tw-hint">相對供給是階梯：價格低於 ${f(lo)} 時沒有人生產 X；高於 ${f(hi)} 時沒有人生產 Y；中間的垂直段是兩國都完全專業化。把本國勞動加大，垂直段往右移，本國這個「大國」比較可能落在水平段，貿易利得全歸外國。</p>`;
    }
    draw();
  };

  // ===== 第 3 章：特定要素模型的雙原點圖 =====
  W.sf = (el, a) => {
    const P = Object.assign({ L: 100, ax: 12, bx: 0.08, ay: 7, by: 0.04, px: 1, py: 1 }, a);
    const pl = new Plot(el, { xlab: '← L_X（從左量）　　　L_Y（從右量）→', ylab: '工資、邊際產值', xr: [0, P.L], yr: [0, 20] });
    const { box, out } = panel(el);
    const sx = slider(box, 'P<sub>X</sub>', 0.5, 2, 0.05, P.px, v => f(v, 2), draw);
    const sy = slider(box, 'P<sub>Y</sub>', 0.5, 2, 0.05, P.py, v => f(v, 2), draw);
    const solve = (px, py) => { // px(ax − bx Lx) = py(ay − by (L − Lx))
      let Lx = (px * P.ax - py * P.ay + py * P.by * P.L) / (px * P.bx + py * P.by); Lx = clamp(Lx, 0, P.L);
      const w = px * (P.ax - P.bx * Lx), Ly = P.L - Lx;
      const capital = px * (P.ax * Lx - P.bx * Lx * Lx / 2) - w * Lx, land = py * (P.ay * Ly - P.by * Ly * Ly / 2) - w * Ly;
      return { Lx, Ly, w, capital, land };
    };
    const base = solve(P.px, P.py);
    function draw() {
      const px = +sx.value, py = +sy.value, r = solve(px, py);
      const ymax = Math.max(px * P.ax, py * P.ay) * 1.15;
      pl.setRange([0, P.L], [0, ymax]); pl.clear();
      const vx = L => px * (P.ax - P.bx * L), vy = L => py * (P.ay - P.by * (P.L - L));
      const pts = []; for (let i = 0; i <= 60; i++) pts.push([r.Lx * i / 60, vx(r.Lx * i / 60)]);
      pl.poly([[0, r.w], ...pts, [r.Lx, r.w]], { fill: C.navy, 'fill-opacity': .14, stroke: 'none' });
      const pts2 = []; for (let i = 0; i <= 60; i++) { const L = r.Lx + (P.L - r.Lx) * i / 60; pts2.push([L, vy(L)]); }
      pl.poly([[r.Lx, r.w], ...pts2, [P.L, r.w]], { fill: C.red, 'fill-opacity': .12, stroke: 'none' });
      pl.poly([[0, 0], [0, r.w], [P.L, r.w], [P.L, 0]], { fill: C.gold, 'fill-opacity': .10, stroke: 'none' });
      pl.fn(vx, 0, P.L, { stroke: C.navy }); pl.fn(vy, 0, P.L, { stroke: C.red });
      if (px !== P.px || py !== P.py) { pl.fn(L => P.px * (P.ax - P.bx * L), 0, P.L, { stroke: C.navy, 'stroke-dasharray': '5 4', 'stroke-width': 1.4, opacity: .6 }); }
      pl.line([[r.Lx, 0], [r.Lx, r.w]], { stroke: C.gray, 'stroke-dasharray': '4 3', 'stroke-width': 1.2 });
      pl.dot(r.Lx, r.w, { fill: C.gold }); pl.text(r.Lx, r.w, '  w = ' + f(r.w, 2), { dy: -8 });
      const g = (x, y) => y / x - 1;
      out.innerHTML = legend(out, [[C.navy, 'P<sub>X</sub>·MPL<sub>X</sub>（X 部門的勞動需求）'], [C.red, 'P<sub>Y</sub>·MPL<sub>Y</sub>（從右邊量）'], [C.navy, '藍色面積：資本所得', 1], [C.red, '紅色面積：土地所得', 1], [C.gold, '黃色面積：勞動所得', 1]]) +
        `<table class="tw-tab"><tr><th></th><th>原本</th><th>現在</th><th>變動</th></tr>
        <tr><td>L<sub>X</sub>／L<sub>Y</sub></td><td>${f(base.Lx, 1)}／${f(base.Ly, 1)}</td><td>${f(r.Lx, 1)}／${f(r.Ly, 1)}</td><td></td></tr>
        <tr><td>名目工資 w</td><td>${f(base.w)}</td><td>${f(r.w)}</td><td>${pct(g(base.w, r.w))}</td></tr>
        <tr><td>以 X 計的實質工資 w/P<sub>X</sub></td><td>${f(base.w / P.px)}</td><td>${f(r.w / px)}</td><td>${pct(g(base.w / P.px, r.w / px))}</td></tr>
        <tr><td>以 Y 計的實質工資 w/P<sub>Y</sub></td><td>${f(base.w / P.py)}</td><td>${f(r.w / py)}</td><td>${pct(g(base.w / P.py, r.w / py))}</td></tr>
        <tr><td>資本的實質所得（以 X 計）</td><td>${f(base.capital / P.px, 1)}</td><td>${f(r.capital / px, 1)}</td><td>${pct(g(base.capital / P.px, r.capital / px))}</td></tr>
        <tr><td>土地的實質所得（以 Y 計）</td><td>${f(base.land / P.py, 1)}</td><td>${f(r.land / py, 1)}</td><td>${pct(g(base.land / P.py, r.land / py))}</td></tr></table>
        <p class="tw-hint">只拉高 P<sub>X</sub>：藍線按比例往上張開（虛線是原來的位置），交點往右上移。工資的漲幅（${pct(g(base.w, r.w))}）介於 P<sub>Y</sub> 和 P<sub>X</sub> 的漲幅之間；兩種價格同比例上漲時，所有實質報酬都不變。</p>`;
    }
    draw();
  };

  // ===== 第 4 章：雷布津斯基定理（固定投入係數） =====
  W.ryb = (el, a) => {
    const P = Object.assign({ aKX: 1, aLX: 2, aKY: 2, aLY: 1, K: 300, L: 300 }, a);   // 預設照課本：X 勞力密集、Y 資本密集
    const pl = new Plot(el, { xlab: 'X 的產量', ylab: 'Y 的產量', xr: [0, 200], yr: [0, 200] });
    const { box, out } = panel(el);
    const sK = slider(box, '資本 K', 150, 600, 10, P.K, v => f(v, 0), draw);
    const sL = slider(box, '勞動 L', 150, 600, 10, P.L, v => f(v, 0), draw);
    const solve = (K, L) => { const d = P.aKX * P.aLY - P.aKY * P.aLX; return { X: (K * P.aLY - L * P.aKY) / d, Y: (L * P.aKX - K * P.aLX) / d }; };
    const base = solve(P.K, P.L);
    function draw() {
      const K = +sK.value, L = +sL.value, r = solve(K, L);
      const m = Math.max(K / P.aKX, L / P.aLX, K / P.aKY, L / P.aLY) * 0.75;
      pl.setRange([0, m], [0, m]); pl.clear();
      pl.line([[0, K / P.aKY], [K / P.aKX, 0]], { stroke: C.navy });
      pl.line([[0, L / P.aLY], [L / P.aLX, 0]], { stroke: C.red });
      const ok = r.X >= 0 && r.Y >= 0;
      if (ok) { pl.dot(r.X, r.Y, { fill: C.gold, r: 6 }); pl.text(r.X, r.Y, `  (${f(r.X, 0)}, ${f(r.Y, 0)})`, { dy: -8 }); }
      pl.dot(base.X, base.Y, { fill: C.gray, r: 4 });
      out.innerHTML = legend(out, [[C.navy, '資本限制：a<sub>KX</sub>X + a<sub>KY</sub>Y = K'], [C.red, '勞動限制：a<sub>LX</sub>X + a<sub>LY</sub>Y = L'], [C.gold, '兩種要素都充分就業的產量']]) +
        (ok ? `<p>X（${P.aKX / P.aLX < P.aKY / P.aLY ? '勞力' : '資本'}密集，K/L＝${f(P.aKX / P.aLX)}）＝ <b>${f(r.X, 1)}</b>（${pct(r.X / base.X - 1)}），Y（${P.aKX / P.aLX < P.aKY / P.aLY ? '資本' : '勞力'}密集，K/L＝${f(P.aKY / P.aLY)}）＝ <b>${f(r.Y, 1)}</b>（${pct(r.Y / base.Y - 1)}）。
               資本 ${pct(K / P.K - 1)}、勞動 ${pct(L / P.L - 1)}。</p>` : '<p>這組秉賦下有一種要素用不完（完全專業化），雷布津斯基定理只適用於兩種商品都生產的範圍。</p>') +
        `<p class="tw-hint">只增加勞動：紅線往外平移，交點沿著藍線往右下走，勞力密集的 X 增加、資本密集的 Y 減少；而且 X 的增加比例大於勞動的增加比例（放大效果）。只增加資本則相反。商品價格固定，所以兩個產業的 K/L 不變，這就是固定投入係數的意思。</p>`;
    }
    draw();
  };

  // ===== 第 4 章：斯托爾珀－薩繆爾森定理（零利潤條件） =====
  W.ss = (el, a) => {
    const P = Object.assign({ aKX: 1, aLX: 2, aKY: 2, aLY: 1, px: 6, py: 6 }, a);   // X 勞力密集、Y 資本密集
    const pl = new Plot(el, { xlab: '工資 w', ylab: '租金 r', xr: [0, 8], yr: [0, 8] });
    const { box, out } = panel(el);
    const xi = P.aKX / P.aLX < P.aKY / P.aLY ? '勞力密集' : '資本密集', yi = xi === '勞力密集' ? '資本密集' : '勞力密集';
    const sx = slider(box, `P<sub>X</sub>（X 是${xi}）`, 3, 12, 0.1, P.px, v => f(v, 1), draw);
    const sy = slider(box, `P<sub>Y</sub>（Y 是${yi}）`, 3, 12, 0.1, P.py, v => f(v, 1), draw);
    const solve = (px, py) => { const d = P.aLX * P.aKY - P.aLY * P.aKX; return { w: (px * P.aKY - py * P.aKX) / d, r: (py * P.aLX - px * P.aLY) / d }; };
    const base = solve(P.px, P.py);
    function draw() {
      const px = +sx.value, py = +sy.value, r = solve(px, py);
      const m = Math.max(px, py) / Math.min(P.aLX, P.aLY, P.aKX, P.aKY) * 0.75;
      pl.setRange([0, m], [0, m]); pl.clear();
      pl.line([[0, px / P.aKX], [px / P.aLX, 0]], { stroke: C.navy });
      pl.line([[0, py / P.aKY], [py / P.aLY, 0]], { stroke: C.red });
      const ok = r.w > 0 && r.r > 0;
      if (ok) { pl.dot(r.w, r.r, { fill: C.gold, r: 6 }); pl.text(r.w, r.r, `  (w, r) = (${f(r.w)}, ${f(r.r)})`, { dy: -8 }); }
      pl.dot(base.w, base.r, { fill: C.gray, r: 4 });
      out.innerHTML = legend(out, [[C.navy, 'X 的零利潤線：a<sub>LX</sub>w + a<sub>KX</sub>r = P<sub>X</sub>'], [C.red, 'Y 的零利潤線：a<sub>LY</sub>w + a<sub>KY</sub>r = P<sub>Y</sub>']]) +
        (ok ? `<table class="tw-tab"><tr><th>變動率</th><th>P<sub>X</sub></th><th>P<sub>Y</sub></th><th>w</th><th>r</th></tr>
        <tr><td>和原本比</td><td>${pct(px / P.px - 1)}</td><td>${pct(py / P.py - 1)}</td><td>${pct(r.w / base.w - 1)}</td><td>${pct(r.r / base.r - 1)}</td></tr></table>` :
          '<p>這組價格下有一種要素報酬變成負的，代表那個產業不會被生產（完全專業化）。</p>') +
        `<p class="tw-hint">只拉高 P<sub>X</sub>：藍線往外平移，交點沿著紅線移動。X 是${xi}，所以${xi === '勞力密集' ? '工資 w 上升、租金 r 下降，w 的漲幅大於 P<sub>X</sub> 的漲幅：勞工以兩種商品計都變富、資本家都變窮，ŵ ＞ P̂<sub>X</sub> ＞ P̂<sub>Y</sub> ＞ r̂' : '租金 r 上升、工資 w 下降，r 的漲幅大於 P<sub>X</sub> 的漲幅：r̂ ＞ P̂<sub>X</sub> ＞ P̂<sub>Y</sub> ＞ ŵ'}，這就是放大效果。</p>`;
    }
    draw();
  };

  // ===== 第 2、5 章：生產可能線（橢圓）、成長與生產點 =====
  const ppfPoint = (A, B, p) => { const d = Math.sqrt(A * A * p * p + B * B); return [A * A * p / d, B * B / d]; };
  W.growth = (el, a) => {
    const P = Object.assign({ A: 100, B: 100, p: 1 }, a);
    const pl = new Plot(el, { xlab: 'X', ylab: 'Y', xr: [0, 160], yr: [0, 160] });
    const { box, out } = panel(el);
    const gA = slider(box, 'X 的生產能力（橫軸截距）', 0, 50, 1, 0, v => '+' + v + '%', draw);
    const gB = slider(box, 'Y 的生產能力（縱軸截距）', 0, 50, 1, 0, v => '+' + v + '%', draw);
    const sp = slider(box, '相對價格 P<sub>X</sub>/P<sub>Y</sub>（固定不變）', 0.4, 2.5, 0.05, P.p, v => f(v, 2), draw);
    function draw() {
      const A1 = P.A * (1 + gA.value / 100), B1 = P.B * (1 + gB.value / 100), p = +sp.value;
      const m = Math.max(A1, B1) * 1.12; pl.setRange([0, m], [0, m]); pl.clear();
      const arc = (A, B) => { const pts = []; for (let i = 0; i <= 90; i++) { const t = i / 90 * Math.PI / 2; pts.push([A * Math.sin(t), B * Math.cos(t)]); } return pts; };
      pl.line(arc(P.A, P.B), { stroke: C.gray }); pl.line(arc(A1, B1), { stroke: C.navy });
      const q0 = ppfPoint(P.A, P.B, p), q1 = ppfPoint(A1, B1, p);
      const I1 = p * q1[0] + q1[1]; pl.line([[0, I1], [I1 / p, 0]], { stroke: C.gold, 'stroke-dasharray': '6 4', 'stroke-width': 1.6 });
      pl.line([[0, 0], [q0[0] * 3, q0[1] * 3]], { stroke: C.gray, 'stroke-dasharray': '3 4', 'stroke-width': 1 });
      pl.dot(q0[0], q0[1], { fill: C.gray }); pl.dot(q1[0], q1[1], { fill: C.navy });
      const r0 = q0[0] / q0[1], r1 = q1[0] / q1[1];
      const kind = Math.abs(r1 / r0 - 1) < 0.005 ? (gA.value == 0 && gB.value == 0 ? '還沒有成長' : '平衡成長：X、Y 同比例增加') : r1 > r0 ? '偏向 X 的成長：X/Y 上升' : '偏向 Y 的成長：X/Y 下降';
      out.innerHTML = legend(out, [[C.gray, '成長前'], [C.navy, '成長後'], [C.gold, '成長後的所得線（斜率＝−P<sub>X</sub>/P<sub>Y</sub>）']]) +
        `<p>同一個價格下，生產點從 (${f(q0[0], 1)}, ${f(q0[1], 1)}) 移到 (${f(q1[0], 1)}, ${f(q1[1], 1)})：X ${pct(q1[0] / q0[0] - 1)}、Y ${pct(q1[1] / q0[1] - 1)}。<b>${kind}</b>。</p>
         <p class="tw-hint">判斷偏向一定要「固定價格」：灰色虛線是成長前的 X/Y 射線，新的生產點落在射線右下方就是偏向 X。只拉 Y 的截距，X 的產量反而可能減少，這就是偏向成長「不代表另一財一定增產」。</p>`;
    }
    draw();
  };

  // ===== 第 5 章：提供曲線與世界均衡 =====
  W.offer = (el, a) => {
    const P = Object.assign({ A: 100, B: 50, fA: 50, fB: 100, s: 0.5, fs: 0.5, p: 1.2 }, a);
    const pl = new Plot(el, { xlab: '本國出口的 X（＝外國進口的 X）', ylab: '本國進口的 Y（＝外國出口的 Y）', xr: [0, 60], yr: [0, 60] });
    const { box, out } = panel(el);
    const sp = slider(box, '貿易條件 P<sub>X</sub>/P<sub>Y</sub>（射線的斜率）', 0.4, 2.5, 0.01, P.p, v => f(v, 2), draw);
    const sf = slider(box, '外國對 X 的支出比例', 0.3, 0.7, 0.01, P.fs, v => Math.round(v * 100) + '%', draw);
    const trade = (A, B, s, p) => { const [x, y] = ppfPoint(A, B, p), I = p * x + y; return { ex: x - s * I / p, im: (1 - s) * I - y }; };
    function draw() {
      const p0 = +sp.value, fs = +sf.value;
      const home = [], frn = [];
      for (let i = 0; i <= 200; i++) { const p = 0.2 + i * 0.02; const h = trade(P.A, P.B, P.s, p), g = trade(P.fA, P.fB, fs, p);
        if (h.ex >= 0) home.push([h.ex, h.im]); if (g.ex <= 0) frn.push([-g.ex, -g.im]); }
      const all = home.concat(frn), m = Math.min(Math.max(...all.map(q => Math.max(q[0], q[1]))) * 0.9, 90);
      pl.setRange([0, m], [0, m]); pl.clear();
      pl.line(home.filter(q => q[0] <= m && q[1] <= m), { stroke: C.navy }); pl.line(frn.filter(q => q[0] <= m && q[1] <= m), { stroke: C.red });
      pl.line([[0, 0], [m, m * p0]], { stroke: C.gold, 'stroke-dasharray': '6 4', 'stroke-width': 1.6 });
      const h = trade(P.A, P.B, P.s, p0), g = trade(P.fA, P.fB, fs, p0);
      pl.dot(h.ex, h.im, { fill: C.navy }); pl.dot(-g.ex, -g.im, { fill: C.red });
      // 找均衡
      let lo = 0.2, hi = 4; const ed = p => trade(P.A, P.B, P.s, p).ex + trade(P.fA, P.fB, fs, p).ex; // X 的世界超額供給
      for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; (ed(mid) > 0) ? (hi = mid) : (lo = mid); }
      const pe = (lo + hi) / 2, he = trade(P.A, P.B, P.s, pe);
      pl.dot(he.ex, he.im, { fill: C.gold, r: 6, stroke: '#fff', 'stroke-width': 1.5 });
      const exs = h.ex + g.ex;
      out.innerHTML = legend(out, [[C.navy, '本國提供曲線'], [C.red, '外國提供曲線'], [C.gold, '貿易條件射線']]) +
        `<p>在 P<sub>X</sub>/P<sub>Y</sub> ＝ ${f(p0)}：本國想出口 X ${f(h.ex, 1)}，外國只想進口 ${f(-g.ex, 1)}，` +
        (Math.abs(exs) < 0.05 ? '剛好結清。' : exs > 0 ? `X 供過於求 ${f(exs, 1)}，P<sub>X</sub>/P<sub>Y</sub> 會下跌。` : `X 供不應求 ${f(-exs, 1)}，P<sub>X</sub>/P<sub>Y</sub> 會上漲。`) +
        `均衡貿易條件約 <b>${f(pe, 3)}</b>（黃點）。</p>
        <p class="tw-hint">每一條提供曲線都是把「各種貿易條件下想出口多少、想進口多少」連起來。把外國對 X 的偏好提高，外國的提供曲線往外移，均衡射線變陡：本國的貿易條件改善。</p>`;
    }
    draw();
  };

  // ===== 第 8 章：小國的關稅與配額（部分均衡） =====
  W.tariff = (el, a) => {
    const P = Object.assign({ a: 100, b: 1, c: -20, d: 1, pw: 30, t: 10 }, a);   // 需求 Q = a − bP，供給 Q = c + dP
    const pl = new Plot(el, { xlab: '數量 Q', ylab: '價格 P', xr: [0, 100], yr: [0, 100] });
    const { box, out } = panel(el);
    const mode = seg(box, '政策', [['t', '從量關稅'], ['q', '進口配額']], draw);
    const sw = slider(box, '世界價格 P<sub>W</sub>', 15, 55, 1, P.pw, v => f(v, 0), draw);
    const st = slider(box, '關稅 t（每單位）／配額換算的價差', 0, 40, 1, P.t, v => f(v, 0), draw);
    const D = p => P.a - P.b * p, S = p => Math.max(0, P.c + P.d * p);
    function draw() {
      const pw = +sw.value, pA = (P.a - P.c) / (P.b + P.d);
      const pt = Math.min(pw + +st.value, pA);
      const ymax = P.a / P.b; pl.setRange([0, P.a], [0, ymax]); pl.clear();
      const S1 = S(pw), D1 = D(pw), S2 = S(pt), D2 = D(pt);
      const sh = (pts, c, o = .22) => pl.poly(pts, { fill: c, 'fill-opacity': o, stroke: 'none' });
      sh([[0, pw], [S1, pw], [S2, pt], [0, pt]], C.green);              // a：生產者剩餘增加
      sh([[S1, pw], [S2, pw], [S2, pt]], C.red);                         // b：生產扭曲
      sh([[S2, pw], [D2, pw], [D2, pt], [S2, pt]], C.gold);              // c：關稅收入或配額租
      sh([[D2, pw], [D1, pw], [D2, pt]], C.red);                         // d：消費扭曲
      pl.line([[0, P.a / P.b], [P.a, 0]], { stroke: C.navy });
      pl.line([[0, -P.c / P.d], [100, (100 - P.c) / P.d]].filter(q => q[1] >= 0), { stroke: C.teal });
      pl.line([[0, pw], [P.a, pw]], { stroke: C.gray, 'stroke-dasharray': '6 4', 'stroke-width': 1.4 });
      pl.line([[0, pt], [P.a, pt]], { stroke: C.purple, 'stroke-width': 1.6 });
      pl.text(P.a * 0.82, pw, 'P_W', { dy: 14 }); pl.text(P.a * 0.82, pt, mode() === 't' ? 'P_W + t' : '國內價格', { dy: -6 });
      const A = (S1 + S2) / 2 * (pt - pw), B = (S2 - S1) * (pt - pw) / 2, Cc = (D2 - S2) * (pt - pw), Dd = (D1 - D2) * (pt - pw) / 2;
      const q = mode() === 'q';
      out.innerHTML = legend(out, [[C.navy, '國內需求'], [C.teal, '國內供給'], [C.green, 'a：生產者剩餘增加'], [C.red, 'b、d：無謂損失'], [C.gold, q ? 'c：配額租（給拿到配額的人）' : 'c：政府的關稅收入']]) +
        `<table class="tw-tab"><tr><th></th><th>自由貿易</th><th>${q ? '配額' : '關稅'}之後</th></tr>
        <tr><td>國內價格</td><td>${f(pw, 1)}</td><td>${f(pt, 1)}</td></tr>
        <tr><td>國內生產／消費</td><td>${f(S1, 1)}／${f(D1, 1)}</td><td>${f(S2, 1)}／${f(D2, 1)}</td></tr>
        <tr><td>進口量</td><td>${f(D1 - S1, 1)}</td><td>${f(Math.max(0, D2 - S2), 1)}</td></tr></table>
        <p>消費者剩餘減少 a＋b＋c＋d ＝ ${f(A + B + Cc + Dd, 1)}；生產者剩餘增加 a ＝ ${f(A, 1)}；${q ? '配額租' : '關稅收入'} c ＝ ${f(Cc, 1)}；
        本國淨損失 b＋d ＝ <b>${f(B + Dd, 1)}</b>（生產扭曲 ${f(B, 1)}＋消費扭曲 ${f(Dd, 1)}）。</p>
        <p class="tw-hint">小國不影響世界價格，所以國內價格剛好上漲 t。關稅和「讓價格上漲同樣多的配額」對價格、產量、進口的效果完全一樣，差別在 c 這塊歸誰：關稅歸政府，配額歸拿到進口許可的人。</p>`;
    }
    draw();
  };

  // ===== 第 6 章：規模經濟下的平均成本 =====
  W.scale = (el, a) => {
    const P = Object.assign({ F: 2000, c: 10, q: 100 }, a);
    const pl = new Plot(el, { xlab: '產量 Q', ylab: '每單位成本', xr: [0, 1000], yr: [0, 60] });
    const { box, out } = panel(el);
    const sF = slider(box, '固定成本 F', 0, 10000, 100, P.F, v => f(v, 0), draw);
    const sq = slider(box, '產量 Q', 20, 1000, 10, P.q, v => f(v, 0), draw);
    function draw() {
      const F = +sF.value, q = +sq.value, AC = x => F / x + P.c;
      pl.setRange([0, 1000], [0, Math.max(60, AC(60) * 0.6)]); pl.clear();
      pl.fn(AC, 20, 1000, { stroke: C.navy }); pl.line([[0, P.c], [1000, P.c]], { stroke: C.red, 'stroke-dasharray': '6 4' });
      pl.dot(q, AC(q), { fill: C.gold }); pl.text(q, AC(q), `  AC = ${f(AC(q), 2)}`, { dy: -8 });
      out.innerHTML = legend(out, [[C.navy, '平均成本 AC = F/Q + c'], [C.red, '邊際成本 c']]) +
        `<p>產量 ${f(q, 0)} 時平均成本 ${f(AC(q), 2)}；產量加倍到 ${f(2 * q, 0)}，平均成本降到 ${f(AC(2 * q), 2)}（${pct(AC(2 * q) / AC(q) - 1)}）。</p>
         <p class="tw-hint">固定成本攤給越多單位，平均成本越接近邊際成本。這就是規模經濟：市場越大（例如加入貿易），廠商能把產量做大，平均成本下降。</p>`;
    }
    draw();
  };

  // ===== 第 6 章：Krugman 模型的 PP 線與 CC 線 =====
  W.krugman = (el, a) => {
    const P = Object.assign({ S: 900, F: 100, c: 5, b: 0.04 }, a);
    const pl = new Plot(el, { xlab: '廠商家數 n（＝產品種類）', ylab: '價格 P', xr: [0, 40], yr: [0, 20] });
    const { box, out } = panel(el);
    const sS = slider(box, '市場規模 S（開放貿易＝兩國加總）', 300, 3600, 100, P.S, v => f(v, 0), draw);
    const sF = slider(box, '固定成本 F', 25, 400, 5, P.F, v => f(v, 0), draw);
    const sb = slider(box, '需求對價格的敏感度 b', 0.01, 0.1, 0.005, P.b, v => f(v, 3), draw);
    const eq = (S, F, b) => { const n = Math.sqrt(S / (b * F)); return { n, p: P.c + 1 / (b * n), y: S / n }; };
    const e0 = eq(P.S, P.F, P.b);
    function draw() {
      const S = +sS.value, F = +sF.value, b = +sb.value, e = eq(S, F, b), N = Math.max(40, e.n * 1.6, e0.n * 1.6);
      pl.setRange([0, N], [0, P.c + 16]); pl.clear();
      pl.line([[0, P.c], [N, P.c]], { stroke: C.gray, 'stroke-dasharray': '6 4', 'stroke-width': 1.2 });
      pl.fn(n => P.c + 1 / (b * n), Math.max(0.4, 1 / (b * 16)), N, { stroke: C.navy });
      pl.fn(n => P.c + n * F / S, 0, Math.min(N, 16 * S / F), { stroke: C.red });
      if (S !== P.S || F !== P.F || b !== P.b) pl.dot(e0.n, e0.p, { fill: C.gray, r: 4 });
      pl.dot(e.n, e.p, { fill: C.gold, r: 6 }); pl.text(e.n, e.p, `  (${f(e.n, 1)}, ${f(e.p, 2)})`, { dy: -8 });
      out.innerHTML = legend(out, [[C.navy, 'PP 線：P = c + 1/(bn)（MR = MC）'], [C.red, 'CC 線：P = c + nF/S（P = AC）'], [C.gray, '邊際成本 c']]) +
        `<table class="tw-tab"><tr><th></th><th>預設</th><th>目前</th></tr>
         <tr><td>廠商家數 n</td><td>${f(e0.n, 1)}</td><td>${f(e.n, 1)}</td></tr>
         <tr><td>價格 P</td><td>${f(e0.p, 2)}</td><td>${f(e.p, 2)}</td></tr>
         <tr><td>每家產量 y</td><td>${f(e0.y, 1)}</td><td>${f(e.y, 1)}</td></tr></table>
         <p class="tw-hint">只把 S 拉大（開放貿易）：PP 線不動、CC 線往下轉，交點往右下走：種類變多、價格下降。S 變成 4 倍時，n 變成 2 倍、P − c 減半（因為 n = √(S/bF)）。拉高 F：CC 線往上，種類變少、價格上升。</p>`;
    }
    draw();
  };

  // ===== 第 6 章：異質廠商（Melitz）的進入與出口門檻 =====
  W.melitz = (el, a) => {
    const P = Object.assign({ A: 20, F0: 9, Ft: 16, tau: 2, lam: 1.1 }, a);   // 每個市場的需求 P = A − Q；營業利潤 (A − 邊際成本)²/4
    const pl = new Plot(el, { xlab: '邊際成本 c（越右越沒有生產力）', ylab: '營業利潤', xr: [0, 20], yr: [0, 100] });
    const { box, out } = panel(el);
    const open = seg(box, '情境', [['c', '封閉'], ['o', '開放出口']], draw);
    const st = slider(box, '出口的單位貿易成本 τ', 0, 6, 0.1, P.tau, v => f(v, 1), draw);
    const sF = slider(box, '出口的固定成本 F<sub>t</sub>', 9, 40, 0.5, P.Ft, v => f(v, 1), draw);
    const sl = slider(box, '開放後工資上漲使成本變為 λ 倍', 1, 1.3, 0.01, P.lam, v => f(v, 2), draw);
    function draw() {
      const A = P.A, F0 = P.F0, isO = open() === 'o', tau = +st.value, Ft = +sF.value, lam = isO ? +sl.value : 1;
      pl.setRange([0, A], [0, A * A / 4 * 1.05]); pl.clear();
      const pd0 = c => Math.max(0, (A - c) ** 2 / 4), pd = c => Math.max(0, (A - lam * c) ** 2 / 4), px = c => Math.max(0, (A - lam * c - tau) ** 2 / 4);
      pl.fn(pd0, 0, A, { stroke: C.gray, 'stroke-dasharray': isO ? '6 4' : '' });
      if (isO) { pl.fn(pd, 0, A / lam, { stroke: C.navy }); pl.fn(px, 0, Math.max(0, (A - tau) / lam), { stroke: C.red }); }
      pl.line([[0, F0], [A, F0]], { stroke: C.green, 'stroke-width': 1.4 });
      if (isO) pl.line([[0, Ft], [A, Ft]], { stroke: C.purple, 'stroke-width': 1.4 });
      const c0 = A - 2 * Math.sqrt(F0), cw = (A - 2 * Math.sqrt(F0)) / lam, ct = Math.max(0, (A - tau - 2 * Math.sqrt(Ft)) / lam);
      pl.dot(c0, F0, { fill: C.gray, r: 4 }); pl.text(c0, F0, ' c*', { dy: -6 });
      if (isO) { pl.dot(cw, F0, { fill: C.navy, r: 5 }); pl.text(cw, F0, 'c_w ', { dy: 16, 'text-anchor': 'end' }); pl.dot(ct, Ft, { fill: C.red, r: 5 }); pl.text(ct, Ft, ' c_t', { dy: -6 }); }
      out.innerHTML = legend(out, isO ? [[C.gray, '封閉時的國內營業利潤'], [C.navy, '開放後的國內營業利潤（工資上漲）'], [C.red, '出口市場的營業利潤'], [C.green, '國內的固定成本 F₀'], [C.purple, '出口的固定成本 F_t']] : [[C.gray, '國內營業利潤'], [C.green, '進入國內市場的固定成本 F₀']]) +
        (isO ? `<p>c 小於 <b>${f(ct, 2)}</b>：內銷＋出口；介於 ${f(ct, 2)} 與 <b>${f(cw, 2)}</b>：只內銷；介於 ${f(cw, 2)} 與 ${f(c0, 2)}：開放後退出；大於 ${f(c0, 2)}：本來就不進入。</p>`
              : `<p>邊際成本低於 c* ＝ <b>${f(c0, 2)}</b> 的廠商，營業利潤足以支付固定成本，會進入市場；c* 到 ${f(A, 0)} 之間的廠商營業利潤為正，但扣掉固定成本會虧損，在門外觀望。</p>`) +
        `<p class="tw-hint">切到「開放出口」：工資上漲讓藍線比灰線往左縮，最沒有生產力的一群被擠出（自我選擇、促進競爭）；提高 τ 或 F<sub>t</sub>，出口門檻 c_t 往左移，能出口的廠商變少。</p>`;
    }
    draw();
  };

  // ===== 第 8 章：大國課關稅（進口需求與出口供給） =====
  W.bigtariff = (el, a) => {
    const P = Object.assign({ a: 100, b: 2, c: -20, d: 2, t: 10 }, a);   // 進口需求 M = a − bP；外國出口供給 X = c + dP*
    const pl = new Plot(el, { xlab: '進口量', ylab: '價格', xr: [0, 70], yr: [0, 50] });
    const { box, out } = panel(el);
    const st = slider(box, '從量關稅 t', 0, 60, 0.5, P.t, v => f(v, 1), draw);
    const M = p => Math.max(0, P.a - P.b * p), X = p => Math.max(0, P.c + P.d * p);
    const p0 = (P.a - P.c) / (P.b + P.d), M0 = M(p0);
    const res = t => { const ps = Math.max(-P.c / P.d, (P.a - P.c - P.b * t) / (P.b + P.d)), pd = ps + t, m = M(pd);
      const vol = 0.5 * (pd - p0) * (M0 - m), tot = (p0 - ps) * m; return { ps, pd, m, vol, tot, net: tot - vol }; };
    let best = 0, bw = -1e9; for (let t = 0; t <= 60; t += 0.05) { const r = res(t); if (r.net > bw) { bw = r.net; best = t; } }
    function draw() {
      const t = +st.value, r = res(t);
      pl.setRange([0, P.a * 0.7], [0, P.a / P.b]); pl.clear();
      const sh = (pts, c, o = .25) => pl.poly(pts, { fill: c, 'fill-opacity': o, stroke: 'none' });
      if (r.m > 0) { sh([[0, p0], [r.m, p0], [r.m, r.pd], [0, r.pd]], C.gold, .18); sh([[0, r.ps], [r.m, r.ps], [r.m, p0], [0, p0]], C.green); sh([[r.m, p0], [M0, p0], [r.m, r.pd]], C.red); }
      pl.fn(q => (P.a - q) / P.b, 0, P.a, { stroke: C.navy });
      pl.fn(q => (q - P.c) / P.d, Math.max(0, P.c), P.a * 0.7, { stroke: C.teal });
      pl.fn(q => (q - P.c) / P.d + t, Math.max(0, P.c), P.a * 0.7, { stroke: C.purple, 'stroke-dasharray': '6 4' });
      pl.dot(M0, p0, { fill: C.gray, r: 4 }); if (r.m > 0) { pl.dot(r.m, r.pd, { fill: C.gold, r: 5 }); pl.dot(r.m, r.ps, { fill: C.teal, r: 4 }); }
      out.innerHTML = legend(out, [[C.navy, '本國進口需求'], [C.teal, '外國出口供給'], [C.purple, '外國出口供給＋關稅'], [C.green, 'e：貿易條件效果（外國吸收的關稅）'], [C.red, 'b＋d：貿易數量效果（無謂損失）']]) +
        `<table class="tw-tab"><tr><th></th><th>自由貿易</th><th>關稅 ${f(t, 1)}</th></tr>
         <tr><td>本國國內價格</td><td>${f(p0, 2)}</td><td>${f(r.pd, 2)}</td></tr>
         <tr><td>外國拿到的價格</td><td>${f(p0, 2)}</td><td>${f(r.ps, 2)}</td></tr>
         <tr><td>進口量</td><td>${f(M0, 1)}</td><td>${f(r.m, 1)}</td></tr></table>
         <p>貿易條件效果 e ＝ ${f(r.tot, 1)}；貿易數量效果 b＋d ＝ ${f(r.vol, 1)}；本國淨福利 e −（b＋d）＝ <b>${f(r.net, 1)}</b>。這組數字的最適關稅約為 <b>${f(best, 1)}</b>（淨福利 ${f(bw, 1)}）。</p>
         <p class="tw-hint">關稅的一部分由外國吸收（外國拿到的價格下跌），所以國內價格上漲得比 t 少。關稅不高時 e 大於 b＋d，福利上升；繼續提高，進口萎縮的損失追上來，到最適關稅之後福利開始下降。</p>`;
    }
    draw();
  };

  function init() {
    document.querySelectorAll('.tw[data-w]').forEach(el => {
      if (el.dataset.done) return; const fn = W[el.dataset.w];
      if (!fn) { el.textContent = '（找不到互動圖：' + el.dataset.w + '）'; return; }
      el.dataset.done = 1; el.innerHTML = '';
      try { fn(el, args(el)); } catch (e) { console.error(e); el.textContent = '互動圖載入失敗'; }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.TradeWidgets = W;
})();
