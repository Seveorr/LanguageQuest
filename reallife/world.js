/* ============================================================
   REAL LIFE · world.js
   Motor 3D (three.js r128): renderer, càmera cinemàtica automàtica,
   personatges procedurals amb expressions facials, senyals amb
   pictogrames dins del món i efectes de partícules.
   Els escenaris 3D (carrer, cafeteria...) estan a sets.js
   ============================================================ */
(function () {
    'use strict';

    if (typeof THREE === 'undefined') { window.World = null; return; }

    const T = THREE;
    const TAU = Math.PI * 2;
    const clamp = T.MathUtils.clamp;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const damp = (a, b, l, dt) => a + (b - a) * (1 - Math.exp(-l * dt));
    const easeIO = k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
    const angDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
    const V3 = (x, y, z) => new T.Vector3(x || 0, y || 0, z || 0);
    const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

    /* ---------- Cachés de colors, materials i geometries ---------- */
    const colCache = {};
    const col = hex => colCache[hex] || (colCache[hex] = new T.Color(hex).convertSRGBToLinear());

    const matCache = {};
    function mat(color, o) {
        o = o || {};
        const key = [color, o.rough, o.metal, o.emissive, o.ei, o.opacity, o.side, o.flat].join('|');
        if (matCache[key]) return matCache[key];
        const m = new T.MeshStandardMaterial({
            color: col(color),
            roughness: o.rough !== undefined ? o.rough : 0.8,
            metalness: o.metal || 0,
            flatShading: !!o.flat
        });
        if (o.emissive) { m.emissive = col(o.emissive); m.emissiveIntensity = o.ei !== undefined ? o.ei : 1; }
        if (o.opacity !== undefined && o.opacity < 1) { m.transparent = true; m.opacity = o.opacity; m.depthWrite = false; }
        if (o.side) m.side = o.side;
        matCache[key] = m;
        return m;
    }

    const geoCache = {};
    const geo = (key, make) => geoCache[key] || (geoCache[key] = make());
    const G = {
        box: (w, h, d) => geo('b' + [w, h, d], () => new T.BoxGeometry(w, h, d)),
        cyl: (rt, rb, h, s) => geo('c' + [rt, rb, h, s], () => new T.CylinderGeometry(rt, rb, h, s)),
        sph: (r, ws, hs) => geo('s' + [r, ws, hs], () => new T.SphereGeometry(r, ws || 16, hs || 12)),
        pln: (w, h) => geo('p' + [w, h], () => new T.PlaneGeometry(w, h)),
        cone: (r, h, s) => geo('n' + [r, h, s], () => new T.ConeGeometry(r, h, s || 12)),
        ico: (r, d) => geo('i' + [r, d], () => new T.IcosahedronGeometry(r, d || 0)),
        tor: (r, t, a) => geo('t' + [r, t, a], () => new T.TorusGeometry(r, t, 6, 18, a || TAU)),
        cir: (r, s) => geo('o' + [r, s], () => new T.CircleGeometry(r, s || 24))
    };

    function addMesh(p, g, m, x, y, z, o) {
        const mesh = new T.Mesh(g, m);
        mesh.position.set(x || 0, y || 0, z || 0);
        if (o) {
            if (o.rx) mesh.rotation.x = o.rx;
            if (o.ry) mesh.rotation.y = o.ry;
            if (o.rz) mesh.rotation.z = o.rz;
            if (o.sx || o.sy || o.sz) mesh.scale.set(o.sx || 1, o.sy || 1, o.sz || 1);
        }
        mesh.castShadow = !(o && o.cast === false);
        mesh.receiveShadow = !(o && o.recv === false);
        if (p) p.add(mesh);
        return mesh;
    }

    /* ---------- Helpers públics (els fa servir sets.js) ---------- */
    const H = {
        T, col, mat, G, rnd, pick, TAU, V3, damp, clamp, easeIO, angDiff, EMOJI_FONT
    };
    H.box = (p, w, h, d, c, x, y, z, o) => addMesh(p, G.box(w, h, d), mat(c, o), x, y, z, o);
    H.cyl = (p, rt, rb, h, c, x, y, z, o) => addMesh(p, G.cyl(rt, rb, h, (o && o.seg) || 14), mat(c, o), x, y, z, o);
    H.sph = (p, r, c, x, y, z, o) => addMesh(p, G.sph(r), mat(c, o), x, y, z, o);
    H.cone = (p, r, h, c, x, y, z, o) => addMesh(p, G.cone(r, h, (o && o.seg) || 12), mat(c, o), x, y, z, o);
    H.ico = (p, r, c, x, y, z, o) => addMesh(p, G.ico(r, (o && o.detail) || 1), mat(c, Object.assign({ flat: true }, o)), x, y, z, o);
    H.pln = (p, w, h, c, x, y, z, o) => addMesh(p, G.pln(w, h), typeof c === 'string' ? mat(c, o) : c, x, y, z, o);
    H.tor = (p, r, t, c, x, y, z, o) => addMesh(p, G.tor(r, t, o && o.arc), mat(c, o), x, y, z, o);

    /* ---------- Textures dinàmiques (canvas) ---------- */
    function canvasTex(w, h, draw, rep) {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const g = c.getContext('2d');
        draw(g, w, h);
        const t = new T.CanvasTexture(c);
        t.encoding = T.sRGBEncoding;
        t.anisotropy = 4;
        if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
        World._texs.push(t);
        return t;
    }
    H.tex = canvasTex;
    H.texMat = (tex, o) => {
        o = o || {};
        const m = new T.MeshStandardMaterial({ map: tex, roughness: o.rough !== undefined ? o.rough : 0.9, metalness: o.metal || 0 });
        if (o.glow) { m.emissive = new T.Color(0xffffff); m.emissiveMap = tex; m.emissiveIntensity = o.glow; }
        if (o.transparent) { m.transparent = true; m.depthWrite = false; }
        if (o.side) m.side = o.side;
        return m;
    };

    function roundRect(g, x, y, w, h, r) {
        g.beginPath();
        g.moveTo(x + r, y);
        g.arcTo(x + w, y, x + w, y + h, r);
        g.arcTo(x + w, y + h, x, y + h, r);
        g.arcTo(x, y + h, x, y, r);
        g.arcTo(x, y, x + w, y, r);
        g.closePath();
    }
    H.roundRect = roundRect;

    function fitText(g, text, maxW, size, font) {
        let s = size;
        do { g.font = 'bold ' + s + 'px ' + font; s -= 4; } while (g.measureText(text).width > maxW && s > 16);
    }

    // Rètol amb text i/o emoji (botigues, cartes, pòsters...)
    H.signPlane = function (p, w, h, spec, x, y, z, o) {
        const px = 512, py = Math.max(64, Math.round(512 * h / w));
        const tex = canvasTex(px, py, (g, W, Hh) => {
            g.fillStyle = spec.bg || '#ffffff';
            roundRect(g, 4, 4, W - 8, Hh - 8, 26); g.fill();
            if (spec.border) { g.lineWidth = 10; g.strokeStyle = spec.border; roundRect(g, 10, 10, W - 20, Hh - 20, 22); g.stroke(); }
            g.textAlign = 'center'; g.textBaseline = 'middle';
            if (spec.emoji && spec.text) {
                g.font = (Hh * 0.62) + 'px ' + EMOJI_FONT;
                g.fillStyle = '#000'; g.fillText(spec.emoji, W * 0.2, Hh * 0.54);
                g.fillStyle = spec.fg || '#222';
                fitText(g, spec.text, W * 0.58, Hh * 0.42, 'Arial, sans-serif');
                g.fillText(spec.text, W * 0.6, Hh * 0.52);
            } else if (spec.emoji) {
                g.font = (Math.min(W, Hh) * 0.7) + 'px ' + EMOJI_FONT;
                g.fillText(spec.emoji, W / 2, Hh * 0.54);
            } else {
                g.fillStyle = spec.fg || '#222';
                fitText(g, spec.text || '', W * 0.86, Hh * 0.5, 'Arial, sans-serif');
                g.fillText(spec.text || '', W / 2, Hh * 0.52);
            }
        });
        return addMesh(p, G.pln(w, h), H.texMat(tex, { glow: spec.glow !== undefined ? spec.glow : 0.35, rough: 0.5 }), x, y, z, o);
    };

    // Façana d'edifici amb finestres, balcons i planta baixa comercial
    H.facade = function (base, floors, cols, o) {
        o = o || {};
        const tex = canvasTex(512, 640, (g, W, Hh) => {
            g.fillStyle = base; g.fillRect(0, 0, W, Hh);
            for (let i = 0; i < 260; i++) { g.fillStyle = 'rgba(0,0,0,' + rnd(0.01, 0.035) + ')'; g.fillRect(rnd(0, W), rnd(0, Hh), rnd(8, 40), rnd(2, 8)); }
            const groundH = Hh * 0.27, fh = (Hh - groundH) / floors, cw = W / cols;
            for (let f = 0; f < floors; f++) {
                for (let c = 0; c < cols; c++) {
                    const ww = cw * 0.5, wh = fh * 0.56, x = c * cw + (cw - ww) / 2, y = f * fh + fh * 0.2;
                    g.fillStyle = '#f7f4ee'; g.fillRect(x - 6, y - 6, ww + 12, wh + 12);
                    const gr = g.createLinearGradient(0, y, 0, y + wh);
                    gr.addColorStop(0, '#8fc3e8'); gr.addColorStop(1, '#d6edf9');
                    g.fillStyle = gr; g.fillRect(x, y, ww, wh);
                    g.fillStyle = '#f7f4ee'; g.fillRect(x + ww / 2 - 2, y, 4, wh); g.fillRect(x, y + wh * 0.45, ww, 4);
                    if (o.shutters) { g.fillStyle = o.shutters; g.fillRect(x - ww * 0.34, y - 4, ww * 0.3, wh + 8); g.fillRect(x + ww * 1.04, y - 4, ww * 0.3, wh + 8); }
                    if (f % 2 === 1) { g.fillStyle = '#3d3d44'; g.fillRect(x - 10, y + wh + 6, ww + 20, 8); for (let b = 0; b < 8; b++) g.fillRect(x - 8 + b * ((ww + 16) / 7), y + wh + 6, 2, 22); }
                }
            }
            const gy = Hh - groundH;
            g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, gy - 4, W, 6);
            const sg = g.createLinearGradient(0, gy + 30, 0, Hh);
            sg.addColorStop(0, '#9fc9e0'); sg.addColorStop(1, '#e6f4fa');
            g.fillStyle = '#f2efe8'; g.fillRect(W * 0.07, gy + 22, W * 0.58, groundH - 22);
            g.fillStyle = sg; g.fillRect(W * 0.09, gy + 40, W * 0.54, groundH - 40);
            g.fillStyle = o.door || '#7a4a2a'; g.fillRect(W * 0.72, gy + 22, W * 0.2, groundH - 22);
            g.fillStyle = '#d9c9a0'; g.fillRect(W * 0.74, gy + 44, W * 0.16, groundH * 0.5);
            g.fillStyle = '#f5d76e'; g.beginPath(); g.arc(W * 0.755, gy + groundH * 0.62, 5, 0, TAU); g.fill();
            if (o.awning) {
                for (let i = 0; i < 12; i++) { g.fillStyle = i % 2 ? '#ffffff' : o.awning; g.fillRect(W * 0.04 + i * (W * 0.64 / 12), gy + 6, W * 0.64 / 12, 34); }
            }
        });
        return H.texMat(tex, { rough: 0.95 });
    };

    /* ---------- Cel, núvols i llum ---------- */
    H.skyDome = function (top, horizon, bottom) {
        const g = new T.SphereGeometry(320, 24, 16);
        const pos = g.attributes.position, cols = [];
        const ct = col(top), ch = col(horizon), cb = col(bottom || horizon);
        for (let i = 0; i < pos.count; i++) {
            const y = pos.getY(i) / 320;
            const c = y > 0 ? ch.clone().lerp(ct, Math.pow(y, 0.55)) : ch.clone().lerp(cb, clamp(-y * 2.2, 0, 1));
            cols.push(c.r, c.g, c.b);
        }
        g.setAttribute('color', new T.Float32BufferAttribute(cols, 3));
        const m = new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, toneMapped: false });
        const sky = new T.Mesh(g, m);
        sky.userData.noShadow = true;
        return sky;
    };

    H.sunGlow = function (p, x, y, z, color, size) {
        const tex = canvasTex(128, 128, (g, W, Hh) => {
            const gr = g.createRadialGradient(W / 2, Hh / 2, 0, W / 2, Hh / 2, W / 2);
            gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, color || 'rgba(255,240,200,0.8)'); gr.addColorStop(1, 'rgba(255,240,200,0)');
            g.fillStyle = gr; g.fillRect(0, 0, W, Hh);
        });
        const s = new T.Sprite(new T.SpriteMaterial({ map: tex, blending: T.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }));
        s.position.set(x, y, z); s.scale.set(size, size, 1);
        p.add(s);
        return s;
    };

    H.clouds = function (p, n, area, y) {
        const cm = new T.MeshBasicMaterial({ color: col('#ffffff'), transparent: true, opacity: 0.92, fog: false, toneMapped: false });
        const list = [];
        for (let i = 0; i < n; i++) {
            const c = new T.Group();
            const parts = 4 + Math.floor(Math.random() * 3);
            for (let k = 0; k < parts; k++) {
                const s = new T.Mesh(G.sph(1, 10, 8), cm);
                s.position.set(k * 1.4 - parts * 0.7, rnd(-0.2, 0.3), rnd(-0.6, 0.6));
                s.scale.set(rnd(1.2, 2), rnd(0.8, 1.2), rnd(0.9, 1.4));
                c.add(s);
            }
            const sc = rnd(4, 8);
            c.scale.set(sc, sc * 0.8, sc);
            c.position.set(rnd(-area, area), y + rnd(-6, 10), rnd(-area, area));
            p.add(c);
            list.push(c);
        }
        H.onUpdate(dt => list.forEach(c => { c.position.x += dt * 0.6; if (c.position.x > area) c.position.x = -area; }));
    };

    // Registra una funció que s'executa cada fotograma mentre l'escena actual està carregada
    H.onUpdate = fn => World._updaters.push(fn);

    // Configura l'àrea d'ombres d'una llum direccional (cal updateProjectionMatrix!)
    H.setShadow = function (light, s, far, size) {
        light.castShadow = true;
        light.shadow.mapSize.set(size || 2048, size || 2048);
        const c = light.shadow.camera;
        c.left = -s; c.right = s; c.top = s; c.bottom = -s; c.near = 1; c.far = far || 120;
        c.updateProjectionMatrix();
        light.shadow.bias = -0.0006;
    };

    // Llum de dia exterior (hemisfèrica + sol amb ombres)
    H.daylight = function (p, o) {
        o = o || {};
        p.add(new T.HemisphereLight(col(o.sky || '#cfe8ff'), col(o.ground || '#8a8f7a'), o.hemi !== undefined ? o.hemi : 0.75));
        const sun = new T.DirectionalLight(col(o.sun || '#fff1d6'), o.intensity !== undefined ? o.intensity : 1.7);
        const c = o.center || [20, 0, 0];
        sun.position.set(c[0] + (o.dir ? o.dir[0] : 14), o.dir ? o.dir[1] : 30, c[2] + (o.dir ? o.dir[2] : -22));
        sun.target.position.set(c[0], 0, c[2]);
        H.setShadow(sun, o.shadowSize || 36, 120, 2048);
        p.add(sun); p.add(sun.target);
        return sun;
    };

    H.setAtmosphere = function (p, top, horizon, fogCol, near, far, bottom) {
        p.add(H.skyDome(top, horizon, bottom));
        World.scene.fog = new T.Fog(col(fogCol), near, far);
        World.scene.background = col(horizon);
    };

    /* ============================================================
       EXPRESSIONS FACIALS
       brow: inclinació (+ enfadat, − trist)  · browY: alçada
       eye: obertura dels ulls · mouth: tipus · ms: mida · blush: vergonya
       ============================================================ */
    const EXPR = {
        neutral: { brow: 0, browY: 0, eye: 1, mouth: 'smile', ms: 0.42, blush: 0 },
        happy: { brow: -0.08, browY: 0.004, eye: 0.82, mouth: 'smile', ms: 1.0, blush: 0 },
        sad: { brow: -0.55, browY: 0, eye: 0.8, mouth: 'frown', ms: 0.9, blush: 0 },
        angry: { brow: 0.6, browY: -0.008, eye: 0.75, mouth: 'frown', ms: 0.75, blush: 0 },
        scared: { brow: -0.35, browY: 0.02, eye: 1.3, mouth: 'open', ms: 0.9, blush: 0 },
        tired: { brow: -0.15, browY: -0.004, eye: 0.32, mouth: 'flat', ms: 0.8, blush: 0 },
        surprised: { brow: 0, browY: 0.032, eye: 1.35, mouth: 'open', ms: 0.7, blush: 0 },
        shy: { brow: -0.2, browY: 0, eye: 0.9, mouth: 'smile', ms: 0.5, blush: 1 },
        worried: { brow: -0.45, browY: 0.012, eye: 1.05, mouth: 'small', ms: 0.6, blush: 0 },
        calm: { brow: 0, browY: 0, eye: 0.5, mouth: 'smile', ms: 0.7, blush: 0 },
        bored: { brow: 0.05, browY: -0.008, eye: 0.45, mouth: 'flat', ms: 0.7, blush: 0 },
        love: { brow: -0.12, browY: 0.006, eye: 0.85, mouth: 'smile', ms: 1.1, blush: 1 }
    };
    H.EXPR = EXPR;

    /* ============================================================
       PERSONATGES PROCEDURALS
       ============================================================ */
    H.person = function (def) {
        const d = Object.assign({
            skin: '#f0c6a0', hair: '#3b2417', hairStyle: 'short', top: '#3498db', bottom: '#34495e',
            shoes: '#222222', accessory: null, height: 1, build: 1, sleeves: 'short', glasses: false, name: ''
        }, def || {});

        const root = new T.Group();
        const body = new T.Group();
        body.scale.setScalar(d.height);
        root.add(body);

        const skinM = mat(d.skin, { rough: 0.7 });
        const topM = mat(d.top, { rough: 0.85 });
        const botM = mat(d.bottom, { rough: 0.9 });
        const hairM = mat(d.hair, { rough: 0.6 });
        const dark = mat('#1b1b1f', { rough: 0.4 });
        const bd = d.build;

        // Cames
        const legs = [];
        [-1, 1].forEach(s => {
            const g = new T.Group();
            g.position.set(s * 0.095 * bd, 0.9, 0);
            addMesh(g, G.cyl(0.072, 0.056, 0.9, 12), botM, 0, -0.45, 0);
            addMesh(g, G.box(0.105, 0.07, 0.25), mat(d.shoes, { rough: 0.5 }), 0, -0.9, 0.05);
            body.add(g); legs.push(g);
        });
        // Maluc
        addMesh(body, G.cyl(0.178 * bd, 0.17 * bd, 0.2, 14), botM, 0, 0.95, 0, { sz: 0.7 });

        // Tors
        const torso = new T.Group();
        torso.position.set(0, 1.2, 0);
        const torsoMesh = addMesh(torso, G.cyl(0.2 * bd, 0.172 * bd, 0.56, 16), topM, 0, 0, 0, { sz: 0.68 });
        body.add(torso);
        if (d.accessory === 'whitecoat') {
            addMesh(torso, G.cyl(0.212 * bd, 0.2 * bd, 0.78, 16), mat('#fbfbfb', { rough: 0.8 }), 0, -0.1, 0, { sz: 0.72 });
            addMesh(torso, G.box(0.06, 0.2, 0.012), mat('#e5e5e5'), -0.05, 0.2, 0.14);
            addMesh(torso, G.box(0.06, 0.2, 0.012), mat('#e5e5e5'), 0.05, 0.2, 0.14);
        }
        if (d.accessory === 'apron') {
            addMesh(torso, G.box(0.33 * bd, 0.5, 0.02), mat(d.apron || '#f4f1ea'), 0, -0.04, 0.125);
            addMesh(torso, G.box(0.1, 0.08, 0.02), mat('#d8d2c4'), 0, -0.16, 0.14);
        }
        if (d.accessory === 'tie') {
            addMesh(torso, G.box(0.045, 0.22, 0.012), mat(d.tie || '#c0392b'), 0, 0.08, 0.133);
            addMesh(torso, G.sph(0.03), mat(d.tie || '#c0392b'), 0, 0.2, 0.13);
        }
        if (d.accessory === 'badge') {
            addMesh(torso, G.box(0.07, 0.1, 0.01), mat('#ffffff'), 0.1 * bd, 0.05, 0.136);
            addMesh(torso, G.box(0.012, 0.3, 0.008), mat('#2563eb'), 0.1 * bd, 0.22, 0.13);
        }
        if (d.accessory === 'scarf') {
            const sc = addMesh(body, G.tor(0.082, 0.032), mat(d.scarf || '#e74c3c'), 0, 1.5, 0, { rx: Math.PI / 2 });
            sc.castShadow = true;
        }
        // Coll
        addMesh(body, G.cyl(0.045, 0.05, 0.1, 10), skinM, 0, 1.5, 0);

        // Braços (espatlla → colze → mà)
        const arms = [];
        [-1, 1].forEach(s => {
            const up = new T.Group();
            up.position.set(s * (0.215 * bd + 0.03), 1.43, 0);
            addMesh(up, G.sph(0.052), topM, 0, 0, 0);
            addMesh(up, G.cyl(0.043, 0.037, 0.3, 10), topM, 0, -0.15, 0);
            const fo = new T.Group();
            fo.position.set(0, -0.3, 0);
            const longSleeve = d.sleeves === 'long' || d.accessory === 'whitecoat';
            addMesh(fo, G.cyl(0.036, 0.029, 0.28, 10), longSleeve ? (d.accessory === 'whitecoat' ? mat('#fbfbfb') : topM) : skinM, 0, -0.14, 0);
            addMesh(fo, G.sph(0.04), skinM, 0, -0.3, 0);
            up.add(fo);
            up.rotation.z = s * 0.07;
            body.add(up);
            arms.push({ up, fo, s });
        });

        // Cap
        const head = new T.Group();
        head.position.set(0, 1.54, 0);
        body.add(head);
        addMesh(head, G.sph(0.115, 24, 18), skinM, 0, 0.11, 0, { sy: 1.12 });
        addMesh(head, G.sph(0.02), skinM, 0.113, 0.105, 0, { sx: 0.5 });
        addMesh(head, G.sph(0.02), skinM, -0.113, 0.105, 0, { sx: 0.5 });
        addMesh(head, G.sph(0.018), mat(d.skin, { rough: 0.6 }), 0, 0.095, 0.118);

        // Cabells
        const capGeo = geo('hair', () => new T.SphereGeometry(0.124, 20, 14, 0, TAU, 0, Math.PI * 0.49));
        const hs = d.hairStyle;
        if (hs !== 'bald') {
            const isCap = hs === 'cap';
            const cap = addMesh(head, capGeo, isCap ? mat(d.hat || d.top, { rough: 0.7 }) : hairM, 0, 0.115, -0.004, { rx: -0.62 });
            cap.castShadow = true;
            if (isCap) addMesh(head, G.box(0.19, 0.012, 0.11), mat(d.hat || d.top), 0, 0.185, 0.13, { rx: 0.12 });
            if (hs === 'long') {
                addMesh(head, G.box(0.25, 0.36, 0.07), hairM, 0, -0.02, -0.095);
                addMesh(head, G.box(0.03, 0.22, 0.09), hairM, 0.11, 0.05, -0.04);
                addMesh(head, G.box(0.03, 0.22, 0.09), hairM, -0.11, 0.05, -0.04);
            }
            if (hs === 'bun') addMesh(head, G.sph(0.06), hairM, 0, 0.255, -0.075);
            if (hs === 'ponytail') {
                addMesh(head, G.sph(0.05), hairM, 0, 0.15, -0.135);
                addMesh(head, G.cyl(0.04, 0.02, 0.26, 8), hairM, 0, 0.02, -0.165, { rx: -0.12 });
            }
            if (hs === 'curly') {
                for (let i = 0; i < 9; i++) {
                    const a = (i / 9) * TAU;
                    addMesh(head, G.sph(0.05), hairM, Math.sin(a) * 0.1, 0.2 + Math.cos(a * 2) * 0.02, Math.cos(a) * 0.1 - 0.03);
                }
                addMesh(head, G.sph(0.07), hairM, 0, 0.245, -0.02);
            }
        }

        // Ulls
        const eyes = [];
        [-1, 1].forEach(s => {
            const e = new T.Group();
            e.position.set(s * 0.043, 0.125, 0.097);
            addMesh(e, G.sph(0.021), mat('#ffffff', { rough: 0.3 }), 0, 0, 0, { cast: false });
            addMesh(e, G.sph(0.0115), dark, 0, 0, 0.015, { cast: false });
            head.add(e);
            eyes.push(e);
        });
        // Celles
        const brows = [];
        [-1, 1].forEach(s => {
            const b = new T.Group();
            b.position.set(s * 0.045, 0.158, 0.1);
            addMesh(b, G.box(0.05, 0.009, 0.01), hairM, 0, 0, 0, { cast: false });
            head.add(b);
            brows.push({ g: b, s, y: 0.158 });
        });
        // Boca
        const mouthG = new T.Group();
        mouthG.position.set(0, 0.057, 0.1);
        const mouthM = mat('#7a2f2f', { rough: 0.5 });
        const smile = addMesh(mouthG, G.tor(0.04, 0.0055, Math.PI), mouthM, 0, 0.012, 0.006, { rz: Math.PI, cast: false });
        const frown = addMesh(mouthG, G.tor(0.04, 0.0055, Math.PI), mouthM, 0, -0.022, 0.006, { cast: false });
        const flat = addMesh(mouthG, G.box(0.055, 0.007, 0.008), mouthM, 0, 0, 0.006, { cast: false });
        const open = addMesh(mouthG, G.sph(0.022, 12, 10), mat('#4a1515', { rough: 0.6 }), 0, 0, 0.004, { sz: 0.5, cast: false });
        head.add(mouthG);
        const mouths = { smile, frown, flat, open, small: open };
        // Gesticles de vergonya
        const blushM = new T.MeshBasicMaterial({ color: col('#ff7a8a'), transparent: true, opacity: 0, depthWrite: false });
        const blush = [-1, 1].map(s => {
            const b = new T.Mesh(G.cir(0.026, 16), blushM.clone());
            b.position.set(s * 0.072, 0.082, 0.088);
            b.lookAt(new T.Vector3(s * 0.2, 0.082, 0.4));
            head.add(b);
            return b;
        });
        // Ulleres
        if (d.accessory === 'glasses' || d.glasses) {
            [-1, 1].forEach(s => addMesh(head, G.tor(0.027, 0.0035), dark, s * 0.043, 0.125, 0.118, { cast: false }));
            addMesh(head, G.box(0.03, 0.004, 0.004), dark, 0, 0.13, 0.118, { cast: false });
        }

        root.traverse(o => { if (o.isMesh && o.castShadow === undefined) o.castShadow = true; });

        /* ----- Estat i animació ----- */
        const P = {
            root, body, head, def: d, legs, arms, torso, eyes, brows, mouths, blush,
            seed: Math.random() * 10, height: d.height,
            expr: EXPR.neutral, cur: { brow: 0, browY: 0, eye: 1, ms: 0.42, blush: 0 },
            talk: 0, talking: false, act: null, wt: 0, walkTarget: null, walkSpeed: 1.5,
            faceYaw: 0, blink: 0, nextBlink: rnd(1, 4), lookAtCam: true, spot: null
        };
        P.arrived = Promise.resolve();
        P._resolveArrive = null;

        P.setExpression = function (name) { P.expr = EXPR[name] || EXPR.neutral; };
        P.setTalking = function (v) { P.talking = !!v; };
        P.play = function (name, dur) { P.act = { name, t: 0, dur: dur || 1.4 }; };
        P.walkTo = function (pos, speed) {
            P.walkTarget = pos.clone();
            P.walkSpeed = speed || 1.6;
            P.arrived = new Promise(res => { P._resolveArrive = res; });
            return P.arrived;
        };

        const tmp = V3();
        P.update = function (dt, t, camPos) {
            const s = P.seed;
            // --- Moviment ---
            let walking = false;
            if (P.walkTarget) {
                const dx = P.walkTarget.x - root.position.x, dz = P.walkTarget.z - root.position.z;
                const dist = Math.hypot(dx, dz);
                if (dist < 0.06) {
                    root.position.x = P.walkTarget.x; root.position.z = P.walkTarget.z;
                    P.walkTarget = null;
                    if (P._resolveArrive) { const r = P._resolveArrive; P._resolveArrive = null; r(); }
                } else {
                    walking = true;
                    const st = Math.min(dist, P.walkSpeed * dt);
                    root.position.x += (dx / dist) * st; root.position.z += (dz / dist) * st;
                    root.rotation.y += angDiff(root.rotation.y, Math.atan2(dx, dz)) * Math.min(1, dt * 8);
                    P.wt += dt * P.walkSpeed * 4.4;
                }
            } else if (P.spot) {
                root.rotation.y += angDiff(root.rotation.y, P.spot.face) * Math.min(1, dt * 5);
            }
            const wk = walking ? 1 : 0;
            P.walkK = damp(P.walkK || 0, wk, 8, dt);

            // --- Accions puntuals ---
            let act = null, k = 0;
            if (P.act) {
                P.act.t += dt; k = clamp(P.act.t / P.act.dur, 0, 1);
                act = P.act.name;
                if (P.act.t >= P.act.dur) { P.act = null; act = null; }
            }
            P.talk = damp(P.talk, P.talking ? 1 : 0, 8, dt);

            // --- Objectius de pose ---
            const sw = P.walkK;
            const swing = Math.sin(P.wt) * 0.62 * sw;
            const tg = {
                lx: Math.sin(t * 1.3 + s) * 0.03 + swing * 0.7, rx: Math.sin(t * 1.1 + s) * 0.03 - swing * 0.7,
                lz: -0.07, rz: 0.07, lfx: -0.08, rfx: -0.08,
                hx: 0, hy: 0, hz: 0, tx: 0, jump: 0
            };
            // gestos mentre parla
            const a = P.talk * (1 - sw);
            if (a > 0.01) {
                tg.rx += -0.55 * a + Math.sin(t * 2.4 + s) * 0.2 * a; tg.rfx = -1.0 * a + Math.sin(t * 3.3) * 0.35 * a;
                tg.lx += -0.2 * a + Math.sin(t * 2.0 + 1) * 0.12 * a; tg.lfx = -0.5 * a + Math.sin(t * 2.7) * 0.25 * a;
                tg.hx += Math.sin(t * 5 + s) * 0.04 * a; tg.hy += Math.sin(t * 1.9) * 0.08 * a;
            }
            // accions
            if (act === 'wave') {
                tg.rx = -2.35; tg.rz = 0.45; tg.rfx = -0.35 + Math.sin(P.act ? P.act.t * 11 : 0) * 0.55;
            } else if (act === 'cheer') {
                tg.lx = -2.7; tg.rx = -2.7; tg.lz = -0.5; tg.rz = 0.5; tg.lfx = -0.2; tg.rfx = -0.2;
                tg.jump = Math.abs(Math.sin(k * Math.PI * 3)) * 0.13; tg.hx = -0.15;
            } else if (act === 'confused') {
                tg.hz = 0.28 * Math.sin(k * Math.PI); tg.hy = Math.sin(k * Math.PI * 4) * 0.25;
                tg.lx = -0.5; tg.rx = -0.5; tg.lz = -0.55; tg.rz = 0.55; tg.lfx = -1.1; tg.rfx = -1.1;
            } else if (act === 'sad') {
                tg.hx = 0.45 * Math.sin(k * Math.PI * 0.9); tg.tx = 0.12 * Math.sin(k * Math.PI);
            } else if (act === 'nod') {
                tg.hx = Math.sin(k * Math.PI * 4) * 0.22;
            } else if (act === 'shake') {
                tg.hy = Math.sin(k * Math.PI * 6) * 0.38;
            } else if (act === 'thumbs') {
                tg.rx = -0.9; tg.rfx = -1.9; tg.rz = 0.2;
            }

            const f = Math.min(1, dt * 10);
            arms[0].up.rotation.x += (tg.lx - arms[0].up.rotation.x) * f;
            arms[1].up.rotation.x += (tg.rx - arms[1].up.rotation.x) * f;
            arms[0].up.rotation.z += (tg.lz - arms[0].up.rotation.z) * f;
            arms[1].up.rotation.z += (tg.rz - arms[1].up.rotation.z) * f;
            arms[0].fo.rotation.x += (tg.lfx - arms[0].fo.rotation.x) * f;
            arms[1].fo.rotation.x += (tg.rfx - arms[1].fo.rotation.x) * f;
            legs[0].rotation.x = Math.sin(P.wt) * 0.6 * sw;
            legs[1].rotation.x = -Math.sin(P.wt) * 0.6 * sw;
            torso.scale.y = 1 + Math.sin(t * 1.9 + s) * 0.012;
            torso.rotation.x += (tg.tx - torso.rotation.x) * f;
            body.position.y = tg.jump + Math.abs(Math.sin(P.wt)) * 0.035 * sw;
            body.rotation.z = Math.sin(t * 0.6 + s) * 0.008;

            // --- Cap: mira la càmera ---
            let yaw = 0, pitch = 0;
            if (P.lookAtCam && camPos) {
                tmp.copy(camPos);
                root.worldToLocal(tmp);
                yaw = clamp(Math.atan2(tmp.x, tmp.z), -0.85, 0.85);
                pitch = clamp(Math.atan2(tmp.y - 1.65 * d.height, Math.hypot(tmp.x, tmp.z)), -0.35, 0.35);
            }
            head.rotation.y += ((yaw * 0.8 + tg.hy) - head.rotation.y) * Math.min(1, dt * 6);
            head.rotation.x += ((-pitch * 0.7 + tg.hx) - head.rotation.x) * Math.min(1, dt * 6);
            head.rotation.z += (tg.hz - head.rotation.z) * Math.min(1, dt * 6);

            // --- Expressió ---
            const ex = P.expr, c = P.cur, fe = Math.min(1, dt * 7);
            c.brow += (ex.brow - c.brow) * fe; c.browY += (ex.browY - c.browY) * fe;
            c.eye += (ex.eye - c.eye) * fe; c.ms += (ex.ms - c.ms) * fe; c.blush += (ex.blush - c.blush) * fe;
            P.nextBlink -= dt;
            if (P.nextBlink < 0) { P.blink = 0.13; P.nextBlink = rnd(2, 5.5); }
            if (P.blink > 0) P.blink -= dt;
            const eyeS = c.eye * (P.blink > 0 ? 0.08 : 1);
            eyes[0].scale.y = eyes[1].scale.y = Math.max(0.05, eyeS);
            brows.forEach(b => { b.g.rotation.z = b.s * c.brow; b.g.position.y = b.y + c.browY; });
            blush.forEach(b => { b.material.opacity = c.blush * 0.55; });

            const talkOpen = P.talk > 0.15 ? (0.25 + 0.75 * Math.abs(Math.sin(t * 11 + s) * Math.sin(t * 4.3))) * P.talk : 0;
            let shape = ex.mouth, msz = c.ms;
            if (talkOpen > 0.12) { shape = 'open'; }
            Object.keys(mouths).forEach(key => { mouths[key].visible = (key === shape) && !(key === 'small' && shape !== 'small'); });
            if (shape === 'open') {
                const base = talkOpen > 0.12 ? 0.8 : msz;
                mouths.open.scale.set(base, talkOpen > 0.12 ? 0.35 + talkOpen * 1.1 : msz * 1.1, 0.5);
            } else if (shape === 'small') {
                mouths.open.visible = true; mouths.open.scale.set(0.45, 0.45, 0.5);
            } else {
                mouths[shape].scale.set(msz, msz, 1);
            }
        };

        return P;
    };

    /* ============================================================
       OBJECTE PRINCIPAL
       ============================================================ */
    const World = window.World = {
        H, sets: {}, npcs: [], _texs: [], _updaters: [], fx: [], current: null,
        sway: 1, walkAmt: 0, tween: null, orbit: null, sign: null, onFrame: null, ready: false
    };

    World.init = function (canvas) {
        const r = this.renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
        r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        r.shadowMap.enabled = true;
        r.shadowMap.type = T.PCFSoftShadowMap;
        r.outputEncoding = T.sRGBEncoding;
        r.toneMapping = T.ACESFilmicToneMapping;
        r.toneMappingExposure = 1.05;
        this.scene = new T.Scene();
        this.camera = new T.PerspectiveCamera(58, 1, 0.1, 600);
        this.camPos = V3(0, 1.7, 0);
        this.camLook = V3(1, 1.5, 0);
        this.t = 0;
        this.last = performance.now();
        this.resize();
        window.addEventListener('resize', () => this.resize());
        const loop = now => {
            requestAnimationFrame(loop);
            const dt = Math.min(0.05, (now - this.last) / 1000);
            this.last = now;
            try { this.update(dt); this.renderer.render(this.scene, this.camera); }
            catch (e) { if (!this._errShown) { this._errShown = true; console.error('[World] error al fotograma:', e); } }
        };
        requestAnimationFrame(loop);
        this.ready = true;
    };

    World.resize = function () {
        const w = window.innerWidth, h = window.innerHeight;
        this.renderer.setSize(w, h, false);
        this.camera.aspect = w / h;
        this.camera.fov = w / h < 1 ? 58 + (1 - w / h) * 30 : 58;
        this.camera.updateProjectionMatrix();
    };

    World.update = function (dt) {
        this.t += dt;
        const t = this.t;
        // Òrbita (pantalla de menú)
        if (this.orbit) {
            const o = this.orbit;
            o.a += dt * o.speed;
            this.camPos.set(o.c[0] + Math.cos(o.a) * o.r, o.h + Math.sin(o.a * 0.7) * 0.6, o.c[2] + Math.sin(o.a) * o.r);
            this.camLook.set(o.c[0], o.look, o.c[2]);
        }
        // Tween de càmera
        const tw = this.tween;
        if (tw) {
            tw.k += dt / tw.dur;
            const e = easeIO(clamp(tw.k, 0, 1));
            this.camPos.lerpVectors(tw.p0, tw.p1, e);
            this.camLook.lerpVectors(tw.l0, tw.l1, e);
            if (tw.arc) this.camPos.y += Math.sin(e * Math.PI) * tw.arc;
            if (tw.k >= 1) { this.tween = null; if (tw.resolve) tw.resolve(); }
        }
        this.walkAmt = damp(this.walkAmt, tw && tw.walk ? 1 : 0, 4, dt);

        // Balanceig orgànic de càmera (respiració + passos)
        const s = this.sway, w = this.walkAmt;
        const p = this._p || (this._p = V3());
        p.copy(this.camPos);
        p.x += Math.sin(t * 0.45) * 0.035 * s + Math.sin(t * 3.1) * 0.02 * w;
        p.y += Math.sin(t * 0.63) * 0.02 * s + Math.abs(Math.sin(t * 6.2)) * 0.045 * w;
        p.z += Math.cos(t * 0.38) * 0.035 * s;
        this.camera.position.copy(p);
        this.camera.lookAt(this.camLook);

        this._updaters.forEach(fn => fn(dt, t));
        this.npcs.forEach(n => n.update(dt, t, this.camera.position));

        // Senyal flotant
        if (this.sign) {
            const g = this.sign;
            g.userData.k = Math.min(1, (g.userData.k || 0) + dt * 3.2);
            const k = g.userData.k, pop = 1 - Math.pow(1 - k, 3) * (1 + 0.6 * Math.cos(k * 8)) * 0.0 - (1 - k) * (1 - k);
            g.scale.setScalar(Math.max(0.01, pop) * (g.userData.size || 1));
            g.position.y = g.userData.y0 + Math.sin(t * 2) * 0.04;
            g.lookAt(this.camera.position);
        }

        // Partícules
        for (let i = this.fx.length - 1; i >= 0; i--) {
            const f = this.fx[i];
            f.life += dt;
            const pos = f.pts.geometry.attributes.position, arr = pos.array;
            for (let j = 0; j < f.n; j++) {
                f.vel[j * 3 + 1] -= f.grav * dt;
                arr[j * 3] += f.vel[j * 3] * dt; arr[j * 3 + 1] += f.vel[j * 3 + 1] * dt; arr[j * 3 + 2] += f.vel[j * 3 + 2] * dt;
            }
            pos.needsUpdate = true;
            f.pts.material.opacity = Math.max(0, 1 - f.life / f.dur);
            if (f.life >= f.dur) { this.scene.remove(f.pts); f.pts.geometry.dispose(); f.pts.material.dispose(); this.fx.splice(i, 1); }
        }
        if (this.onFrame) this.onFrame(dt);
    };

    // Projecta un punt 3D a coordenades de pantalla (per a les etiquetes HTML)
    World.project = function (v) {
        const q = v.clone().project(this.camera);
        return { x: (q.x * 0.5 + 0.5) * window.innerWidth, y: (-q.y * 0.5 + 0.5) * window.innerHeight, visible: q.z < 1 && q.z > -1 };
    };

    /* ---------- Escenaris ---------- */
    World.unloadSet = function () {
        if (!this.current) return;
        this.npcs.forEach(n => n.root.parent && n.root.parent.remove(n.root));
        this.npcs.length = 0;
        this.hideSign();
        this.scene.remove(this.current.group);
        this.scene.fog = null;
        this._texs.forEach(t => t.dispose());
        this._texs.length = 0;
        this._updaters.length = 0;
        this.current = null;
    };

    World.loadSet = function (name) {
        this.unloadSet();
        const group = new T.Group();
        this.scene.add(group);
        let res;
        try {
            if (!this.sets[name]) throw new Error('Escenari 3D desconegut: ' + name);
            res = this.sets[name](group, H);
        } catch (e) {
            console.error('[World] No s\'ha pogut construir "' + name + '":', e);
            // Escenari mínim de seguretat perquè el joc sigui jugable igualment
            H.setAtmosphere(group, '#7ab8ee', '#dff0ff', '#dff0ff', 30, 140);
            H.daylight(group, { center: [0, 0, 0] });
            H.box(group, 80, 0.2, 80, '#9aa89a', 0, -0.1, 0);
            res = {
                spots: { a: { pos: [0, 0, 6], face: Math.PI }, b: { pos: [6, 0, 6], face: Math.PI }, c: { pos: [12, 0, 6], face: Math.PI } },
                intro: { from: { pos: [-6, 1.7, 14], look: [0, 1.4, 6] }, to: { pos: [0, 1.7, 12], look: [0, 1.4, 6] }, dur: 3 }
            };
        }
        this.current = { name, group, spots: res.spots || {}, intro: res.intro, ambience: res.ambience || name };
        if (res.update) this._updaters.push(res.update);
        return this.current;
    };

    /* ---------- Càmera ---------- */
    World.camSnap = function (pos, look) {
        this.tween = null;
        this.camPos.set(pos[0], pos[1], pos[2]);
        this.camLook.set(look[0], look[1], look[2]);
    };

    World.camTo = function (pos, look, dur, opts) {
        opts = opts || {};
        this.orbit = null;
        const p1 = Array.isArray(pos) ? V3(pos[0], pos[1], pos[2]) : pos.clone();
        const l1 = Array.isArray(look) ? V3(look[0], look[1], look[2]) : look.clone();
        if (!dur || dur <= 0) { this.tween = null; this.camPos.copy(p1); this.camLook.copy(l1); return Promise.resolve(); }
        if (this.tween && this.tween.resolve) this.tween.resolve();
        return new Promise(resolve => {
            this.tween = { p0: this.camPos.clone(), p1, l0: this.camLook.clone(), l1, k: 0, dur, walk: !!opts.walk, arc: opts.arc || 0, resolve };
        });
    };

    World.shotFor = function (npc, kind) {
        const s = npc.spot, h = npc.height || 1;
        const f = V3(Math.sin(s.face), 0, Math.cos(s.face));
        const r = V3(f.z, 0, -f.x);
        const dist = s.dist || 2.7;
        const K = {
            medium: { d: dist, side: 0.28, h: 1.5 * h, ly: 0.98 * h },
            face: { d: Math.max(1.15, dist * 0.45), side: 0.12, h: 1.66 * h, ly: 1.42 * h },
            wide: { d: dist * 1.6, side: 0.5, h: 1.85, ly: 1.0 }
        }[kind || 'medium'];
        const base = V3(s.pos[0], 0, s.pos[2]);
        const pos = base.clone().addScaledVector(f, K.d).addScaledVector(r, K.side); pos.y = K.h;
        const look = base.clone().addScaledVector(r, K.side * 0.25); look.y = K.ly;
        return { pos, look };
    };

    World.camToNPC = function (npc, kind, dur, opts) {
        const sh = this.shotFor(npc, kind);
        return this.camTo(sh.pos, sh.look, dur, opts);
    };

    World.introShot = function () {
        const it = this.current && this.current.intro;
        if (!it) return Promise.resolve();
        this.camSnap(it.from.pos, it.from.look);
        return this.camTo(it.to.pos, it.to.look, it.dur || 4, { walk: true });
    };

    World.startOrbit = function (center, r, h, look, speed) {
        this.tween = null;
        this.orbit = { c: center, r, h, look: look || 1.6, speed: speed || 0.07, a: 0.4 };
    };

    /* ---------- Personatges no jugadors ---------- */
    World.spawnNPC = function (def, spotName, opts) {
        opts = opts || {};
        const spots = this.current.spots;
        const spot = spots[spotName] || spots[Object.keys(spots)[0]];
        const p = H.person(def);
        p.spot = spot;
        const target = V3(spot.pos[0], spot.pos[1] || 0, spot.pos[2]);
        const walking = opts.walk !== false && !!spot.from;
        const start = target.clone();
        if (walking) { start.x += spot.from[0]; start.z += spot.from[1]; }
        p.root.position.copy(start);
        p.root.rotation.y = walking ? Math.atan2(target.x - start.x, target.z - start.z) : spot.face;
        this.current.group.add(p.root);
        this.npcs.push(p);
        if (walking) p.walkTo(target, opts.speed || 1.7);
        return p;
    };

    World.removeNPC = function (npc, walkAway) {
        const done = () => {
            if (npc.root.parent) npc.root.parent.remove(npc.root);
            const i = this.npcs.indexOf(npc); if (i >= 0) this.npcs.splice(i, 1);
        };
        if (walkAway && npc.spot) {
            npc.spot = null;
            const away = npc.root.position.clone();
            away.x += walkAway[0]; away.z += walkAway[1];
            npc.walkTo(away, 1.7).then(done);
        } else done();
    };

    // Cap d'un NPC en coordenades de món (per a l'etiqueta amb el nom)
    World.headPos = function (npc) {
        const v = V3(0, 1.95 * (npc.height || 1), 0);
        npc.root.localToWorld(v);
        return v;
    };

    /* ---------- Senyal flotant amb pictograma/text ---------- */
    World.showSign = function (spec, npc) {
        this.hideSign();
        const g = new T.Group();
        const w = spec.text && !spec.emoji ? 1.5 : 1.0;
        const plane = H.signPlane(g, w, 1.0, { emoji: spec.emoji, text: spec.text, bg: '#ffffff', border: '#2196F3', fg: '#1f2937', glow: 0.5 }, 0, 0, 0, { cast: false, recv: false });
        plane.material.side = T.DoubleSide;
        const s = npc.spot;
        const f = V3(Math.sin(s.face), 0, Math.cos(s.face));
        const r = V3(f.z, 0, -f.x);
        const pos = V3(s.pos[0], 0, s.pos[2]).addScaledVector(f, 0.55).addScaledVector(r, -0.75 * (spec.side || 1));
        pos.y = 1.5 * (npc.height || 1);
        g.position.copy(pos);
        g.userData = { k: 0, y0: pos.y, size: spec.size || 0.9 };
        g.scale.setScalar(0.01);
        this.current.group.add(g);
        this.sign = g;
    };

    World.hideSign = function () {
        if (!this.sign) return;
        if (this.sign.parent) this.sign.parent.remove(this.sign);
        this.sign = null;
    };

    /* ---------- Partícules ---------- */
    World.burst = function (pos, colors, n, speed, grav, dur, size) {
        n = n || 28;
        const arr = new Float32Array(n * 3), vel = new Float32Array(n * 3), cols = new Float32Array(n * 3);
        const list = Array.isArray(colors) ? colors : [colors];
        for (let i = 0; i < n; i++) {
            arr[i * 3] = pos.x; arr[i * 3 + 1] = pos.y; arr[i * 3 + 2] = pos.z;
            const a = Math.random() * TAU, u = Math.random() * 2 - 1, sp = (speed || 2.2) * (0.4 + Math.random() * 0.8);
            vel[i * 3] = Math.cos(a) * Math.sqrt(1 - u * u) * sp; vel[i * 3 + 1] = Math.abs(u) * sp + 1; vel[i * 3 + 2] = Math.sin(a) * Math.sqrt(1 - u * u) * sp;
            const c = col(pick(list));
            cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
        }
        const g = new T.BufferGeometry();
        g.setAttribute('position', new T.Float32BufferAttribute(arr, 3));
        g.setAttribute('color', new T.Float32BufferAttribute(cols, 3));
        const m = new T.PointsMaterial({ size: size || 0.09, vertexColors: true, transparent: true, depthWrite: false, toneMapped: false });
        const pts = new T.Points(g, m);
        pts.frustumCulled = false;
        this.scene.add(pts);
        this.fx.push({ pts, vel, n, life: 0, dur: dur || 1.3, grav: grav === undefined ? 5 : grav });
    };

    World.confetti = function () {
        const cam = this.camera.position;
        const dir = V3(this.camLook.x - cam.x, 0, this.camLook.z - cam.z).normalize();
        for (let i = 0; i < 4; i++) {
            const c = cam.clone().addScaledVector(dir, 3 + i * 0.4); c.y += 2.4; c.x += rnd(-1.5, 1.5); c.z += rnd(-1.5, 1.5);
            this.burst(c, ['#ff5252', '#ffd740', '#40c4ff', '#69f0ae', '#e040fb', '#ffffff'], 90, 3.2, 3.2, 2.8, 0.12);
        }
    };
})();