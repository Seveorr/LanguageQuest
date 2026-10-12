/* ============================================================
   REAL LIFE · sets.js
   Escenaris 3D. Cada escenari és una funció que construeix el món
   i retorna:
     spots  → llocs on poden aparèixer personatges (pos, face, from, dist)
     intro  → tir de càmera inicial
   Spots disponibles (els fa servir data.js):
     street  : neighbor, crossing, bakery, busstop, end
     cafe    : counter, table, window
     pharmacy: counter, shelf
     park    : path, bench, pond
     office  : reception, desk, meeting, kitchen
   Per afegir un escenari nou: World.sets.nom = function(g, H){...}
   ============================================================ */
(function () {
    'use strict';
    if (!window.World) return;

    const World = window.World, H = World.H, T = H.T;
    const rnd = H.rnd, pick = H.pick, TAU = H.TAU;
    const PI = Math.PI;

    /* ---------- Peces reutilitzables ---------- */
    function grp(p, x, y, z, ry) {
        const g = new T.Group();
        g.position.set(x || 0, y || 0, z || 0);
        if (ry) g.rotation.y = ry;
        p.add(g);
        return g;
    }

    const LOOKS = [
        { skin: '#f0c6a0', hair: '#4a2c17', hairStyle: 'short', top: '#2e86c1', bottom: '#2c3e50' },
        { skin: '#c68e63', hair: '#1b1209', hairStyle: 'curly', top: '#d35400', bottom: '#34495e' },
        { skin: '#e9b896', hair: '#a0522d', hairStyle: 'long', top: '#16a085', bottom: '#4b4b63' },
        { skin: '#8d5a3b', hair: '#111111', hairStyle: 'bun', top: '#8e44ad', bottom: '#2c2c3a' },
        { skin: '#f3d2b3', hair: '#d8c27a', hairStyle: 'ponytail', top: '#e84393', bottom: '#3d5a80' },
        { skin: '#d9a37a', hair: '#2b1d14', hairStyle: 'cap', top: '#27ae60', bottom: '#5d4e37', hat: '#c0392b' }
    ];

    // Vianant de fons que va i ve entre dos punts
    function walker(g, a, b, speed, accessory) {
        const p = H.person(Object.assign({}, pick(LOOKS), { accessory: accessory || null, height: rnd(0.93, 1.05) }));
        p.lookAtCam = false;
        p.root.position.set(a[0], 0, a[1]);
        g.add(p.root);
        World.npcs.push(p);
        let toB = true;
        const go = () => {
            const t = toB ? b : a; toB = !toB;
            p.walkTo(H.V3(t[0], 0, t[1]), speed || rnd(1.0, 1.5)).then(() => setTimeout(go, rnd(400, 2500)));
        };
        setTimeout(go, rnd(0, 2500));
        return p;
    }

    function idler(g, x, z, face, look) {
        const p = H.person(Object.assign({}, look || pick(LOOKS)));
        p.lookAtCam = false;
        p.root.position.set(x, 0, z);
        p.root.rotation.y = face || 0;
        g.add(p.root);
        World.npcs.push(p);
        return p;
    }

    function chair(p, x, z, ry, c) {
        const g = grp(p, x, 0, z, ry);
        H.box(g, 0.42, 0.05, 0.42, c, 0, 0.46, 0);
        H.box(g, 0.42, 0.46, 0.04, c, 0, 0.72, -0.19);
        [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(q => H.cyl(g, 0.02, 0.02, 0.45, '#3a3a3a', q[0], 0.225, q[1], { seg: 6 }));
        return g;
    }

    function table(p, x, z, c) {
        const g = grp(p, x, 0, z);
        H.cyl(g, 0.5, 0.5, 0.05, c || '#c9a074', 0, 0.76, 0, { seg: 20 });
        H.cyl(g, 0.05, 0.05, 0.74, '#2d2d2d', 0, 0.37, 0, { seg: 8 });
        H.cyl(g, 0.3, 0.3, 0.03, '#2d2d2d', 0, 0.015, 0, { seg: 14 });
        return g;
    }

    function plant(p, x, z, s) {
        s = s || 1;
        const g = grp(p, x, 0, z);
        H.cyl(g, 0.22 * s, 0.17 * s, 0.4 * s, '#b5651d', 0, 0.2 * s, 0);
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * TAU;
            H.sph(g, 0.16 * s, i % 2 ? '#2e8b57' : '#3da35d', Math.sin(a) * 0.14 * s, (0.7 + (i % 3) * 0.12) * s, Math.cos(a) * 0.14 * s, { sy: 2.2 });
        }
        return g;
    }

    function tree(p, x, z, s, kind, sw) {
        s = s || 1;
        const g = grp(p, x, 0, z);
        H.cyl(g, 0.16 * s, 0.25 * s, 3 * s, '#6b4a2f', 0, 1.5 * s, 0, { seg: 8 });
        const f = grp(g, 0, 0, 0);
        const gc = ['#3f9b4a', '#4caf50', '#2f8a3d', '#57b45a'];
        if (kind === 'pine') {
            for (let i = 0; i < 3; i++) H.cone(f, (1.5 - i * 0.35) * s, 1.8 * s, pick(gc), 0, (3.2 + i * 1.1) * s, 0, { seg: 8 });
        } else {
            H.ico(f, 1.6 * s, pick(gc), 0, 4.2 * s, 0);
            H.ico(f, 1.2 * s, pick(gc), 0.9 * s, 3.7 * s, 0.4 * s);
            H.ico(f, 1.1 * s, pick(gc), -0.8 * s, 3.8 * s, -0.5 * s);
        }
        if (sw) sw.push({ g: f, ph: rnd(0, 6) });
        return g;
    }

    function lamp(p, x, z, ry) {
        const g = grp(p, x, 0, z, ry);
        H.cyl(g, 0.06, 0.08, 5, '#3c4048', 0, 2.5, 0, { seg: 8 });
        H.box(g, 0.9, 0.06, 0.06, '#3c4048', 0.4, 5, 0);
        H.box(g, 0.4, 0.1, 0.22, '#fff3c4', 0.8, 4.95, 0, { emissive: '#fff3c4', ei: 0.7 });
        return g;
    }

    function bench(p, x, z, ry) {
        const g = grp(p, x, 0, z, ry);
        H.box(g, 1.7, 0.06, 0.5, '#8a5a2b', 0, 0.46, 0);
        H.box(g, 1.7, 0.4, 0.05, '#8a5a2b', 0, 0.75, -0.22, { rx: -0.12 });
        [-0.75, 0.75].forEach(a => H.box(g, 0.06, 0.46, 0.46, '#33363b', a, 0.23, 0));
        return g;
    }

    function car(p, color, x, z, ry) {
        const g = grp(p, x, 0, z, ry);
        H.box(g, 4.3, 0.7, 1.8, color, 0, 0.62, 0, { rough: 0.35, metal: 0.4 });
        H.box(g, 2.3, 0.6, 1.6, color, -0.2, 1.25, 0, { rough: 0.35, metal: 0.4 });
        H.box(g, 2.34, 0.46, 1.64, '#1d2a33', -0.2, 1.27, 0, { rough: 0.1, metal: 0.6 });
        [[1.4, 0.9], [1.4, -0.9], [-1.4, 0.9], [-1.4, -0.9]].forEach(q => H.cyl(g, 0.34, 0.34, 0.26, '#151515', q[0], 0.34, q[1], { rx: PI / 2, seg: 12 }));
        H.box(g, 0.06, 0.16, 0.3, '#fff6c8', 2.16, 0.7, 0.6, { emissive: '#fff6c8' });
        H.box(g, 0.06, 0.16, 0.3, '#fff6c8', 2.16, 0.7, -0.6, { emissive: '#fff6c8' });
        return g;
    }

    function dog(p, x, z, ry) {
        const g = grp(p, x, 0, z, ry);
        const c = '#c98b4f', d = '#9a6633';
        H.box(g, 0.7, 0.3, 0.28, c, 0, 0.5, 0, { rough: 0.95 });
        [[0.26, 0.1], [0.26, -0.1], [-0.26, 0.1], [-0.26, -0.1]].forEach(q => H.box(g, 0.08, 0.36, 0.08, c, q[0], 0.18, q[1], { rough: 0.95 }));
        const head = grp(g, 0.42, 0.66, 0);
        H.sph(head, 0.14, c, 0, 0, 0, { rough: 0.95 });
        H.box(head, 0.14, 0.09, 0.11, '#e6c9a0', 0.14, -0.04, 0);
        H.sph(head, 0.025, '#111', 0.21, -0.01, 0);
        H.box(head, 0.07, 0.14, 0.04, d, -0.02, 0.1, 0.11, { rz: 0.4 });
        H.box(head, 0.07, 0.14, 0.04, d, -0.02, 0.1, -0.11, { rz: 0.4 });
        H.sph(head, 0.018, '#111', 0.08, 0.04, 0.07); H.sph(head, 0.018, '#111', 0.08, 0.04, -0.07);
        const tail = grp(g, -0.37, 0.58, 0);
        H.box(tail, 0.3, 0.05, 0.05, d, -0.15, 0, 0);
        H.onUpdate((dt, t) => { tail.rotation.y = Math.sin(t * 11) * 0.55; head.rotation.z = Math.sin(t * 1.3) * 0.08; head.rotation.y = Math.sin(t * 0.7) * 0.25; });
        return g;
    }

    function woodTex() {
        return H.tex(512, 512, (g, W, Hh) => {
            g.fillStyle = '#a8723f'; g.fillRect(0, 0, W, Hh);
            for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) {
                g.fillStyle = 'hsl(28,' + rnd(36, 50) + '%,' + rnd(34, 46) + '%)';
                g.fillRect(i * 64 + 1, j * 128 + 1 + (i % 2) * 40, 62, 124);
            }
        }, [3, 2.5]);
    }

    function tileTex(a, b, n) {
        return H.tex(256, 256, (g, W, Hh) => {
            const s = W / n;
            for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? a : b; g.fillRect(i * s, j * s, s, s); }
        }, [5, 4]);
    }

    function screenTex() {
        return H.tex(128, 80, (g, W, Hh) => {
            g.fillStyle = '#e9f1ff'; g.fillRect(0, 0, W, Hh);
            g.fillStyle = '#2563eb'; g.fillRect(0, 0, W, 12);
            for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#9fb7e6' : '#c6d6f5'; g.fillRect(8, 20 + i * 10, rnd(40, 110), 5); }
        });
    }

    /* Habitació interior: terra, parets (sense ombra) i sostre */
    function room(g, w, d, h, floorMat, wallCol, trim) {
        H.pln(g, w, d, floorMat, 0, 0.002, 0, { rx: -PI / 2, cast: false });
        H.box(g, w, h, 0.2, wallCol, 0, h / 2, -d / 2, { cast: false });
        H.box(g, 0.2, h, d, wallCol, -w / 2, h / 2, 0, { cast: false });
        H.box(g, 0.2, h, d, wallCol, w / 2, h / 2, 0, { cast: false });
        H.box(g, w, h, 0.2, wallCol, 0, h / 2, d / 2, { cast: false });
        H.box(g, w, 0.2, d, '#f4f1ea', 0, h + 0.1, 0, { cast: false });
        if (trim) {
            H.box(g, w, 0.18, 0.06, trim, 0, 0.09, -d / 2 + 0.12, { cast: false });
            H.box(g, 0.06, 0.18, d, trim, -w / 2 + 0.12, 0.09, 0, { cast: false });
            H.box(g, 0.06, 0.18, d, trim, w / 2 - 0.12, 0.09, 0, { cast: false });
        }
    }

    function pendant(g, x, y, z, color, light) {
        H.cyl(g, 0.01, 0.01, 3.6 - y, '#222', x, (3.6 + y) / 2, z, { seg: 4, cast: false });
        H.cone(g, 0.28, 0.26, color, x, y, z, { seg: 16 });
        H.sph(g, 0.08, '#fff2c8', x, y - 0.1, z, { emissive: '#ffe9a8', ei: 1.4, cast: false });
        if (light) {
            const pl = new T.PointLight(H.col('#ffd9a0'), light, 9, 1.4);
            pl.position.set(x, y - 0.3, z);
            g.add(pl);
        }
    }

    /* ============================================================
       CARRER (exterior de dia)
       ============================================================ */
    World.sets.street = function (g, H) {
        H.setAtmosphere(g, '#4f9de8', '#d6eafa', '#d6eafa', 45, 190, '#9db7c9');
        H.daylight(g, { center: [30, 0, 4], shadowSize: 50, dir: [10, 32, -24] });
        H.sunGlow(g, 120, 150, -170, 'rgba(255,236,190,0.7)', 130);
        H.clouds(g, 9, 150, 60);
        const sw = [];

        // Terra: base, calçada, asfalt i marques
        H.box(g, 280, 0.1, 130, '#8b8f94', 30, -0.06, 0, { cast: false });
        H.box(g, 240, 0.12, 7.4, '#3a3c41', 30, 0, -1.3, { rough: 0.95, cast: false });
        H.box(g, 240, 0.16, 5.8, '#cbc7bf', 30, 0.04, 5.1, { rough: 0.95 });
        H.box(g, 240, 0.16, 6, '#cbc7bf', 30, 0.04, -8.2, { rough: 0.95 });
        H.box(g, 240, 0.2, 0.18, '#a9a59d', 30, 0.06, 2.3, { cast: false });
        H.box(g, 240, 0.2, 0.18, '#a9a59d', 30, 0.06, -5.1, { cast: false });
        for (let x = -20; x < 100; x += 4) H.box(g, 2, 0.02, 0.15, '#f2f2f2', x, 0.065, -1.3, { cast: false });
        for (let i = 0; i < 8; i++) H.box(g, 0.5, 0.02, 6.6, '#f4f4f4', 23.5 + i * 0.9, 0.07, -1.3, { cast: false });

        // Edificis (costat de les botigues) i façanes
        const widths = [9, 10, 9, 10, 9, 10, 9, 10, 9, 10, 9, 10];
        const cols = ['#e8c9a0', '#d9b8a8', '#cfd8c0', '#e6d3b3', '#c8d6e0', '#e7c3b8', '#d8cfa9', '#c9c9d6', '#e3c5a6', '#bfd3c9'];
        let x0 = -14;
        widths.forEach((w, i) => {
            const h = 12.6 + (i % 3) * 0.9, d = 9;
            const base = pick(cols);
            const isBakery = i === 5, isPharm = i === 7;
            const facade = H.facade(base, 3, 3, { awning: (isBakery || isPharm) ? null : pick(['#c0392b', '#2e86c1', '#27ae60', '#d68910']), shutters: i % 2 ? '#6b8e7a' : null, door: isBakery ? '#8a5a2b' : undefined });
            const side = H.mat(base, { rough: 0.95 });
            const b = new T.Mesh(H.G.box(w, h, d), [side, side, side, side, side, facade]);
            b.position.set(x0 + w / 2, h / 2, 8 + d / 2);
            b.castShadow = true; b.receiveShadow = true;
            g.add(b);
            H.box(g, w + 0.4, 0.35, d + 0.4, '#9c8f84', x0 + w / 2, h + 0.17, 8 + d / 2);
            if (isBakery) H.signPlane(g, 4.2, 1.0, { text: 'Forn de pa', emoji: '🥖', bg: '#7a4a21', fg: '#fff3d0', border: '#f5d76e' }, x0 + w * 0.36, h * 0.27 - 0.1, 7.92, { ry: PI, cast: false });
            if (isPharm) H.signPlane(g, 4.2, 1.0, { text: 'Farmàcia', emoji: '💊', bg: '#1e8e3e', fg: '#ffffff', border: '#ffffff' }, x0 + w * 0.36, h * 0.27 - 0.1, 7.92, { ry: PI, cast: false });
            x0 += w;
        });
        // Edificis de l'altra banda
        let fx = -20;
        for (let i = 0; i < 10; i++) {
            const w = 10, h = 11 + (i % 4), d = 9;
            const facade = H.facade(pick(cols), 3, 3, { awning: pick(['#c0392b', '#2e86c1', '#27ae60']) });
            const side = H.mat('#d8cdb8', { rough: 0.95 });
            const b = new T.Mesh(H.G.box(w, h, d), [side, side, side, side, facade, side]);
            b.position.set(fx + w / 2, h / 2, -11.2 - d / 2);
            b.castShadow = true; b.receiveShadow = true;
            g.add(b);
            fx += w + 0.2;
        }

        // Arbres, fanals, bancs
        [0, 10, 20, 31, 41, 62, 72].forEach((x, i) => tree(g, x, 3.0, 0.9 + (i % 3) * 0.1, i % 3 === 2 ? 'pine' : 'round', sw));
        [4, 16, 30, 44, 58, 72].forEach((x, i) => tree(g, x, -6.5, 1 + (i % 2) * 0.15, 'round', sw));
        [5, 15, 27, 38, 56, 67].forEach(x => lamp(g, x, 2.75, 0));
        bench(g, 29, 7.5, PI);
        bench(g, 64, 7.5, PI);
        H.box(g, 0.5, 0.9, 0.5, '#3f6b4d', 12, 0.5, 7.4);

        // Parada d'autobús i autobús aparcat
        const sh = grp(g, 49, 0, 3.9);
        [[-1.6, -0.6], [1.6, -0.6], [-1.6, 0.6], [1.6, 0.6]].forEach(q => H.cyl(sh, 0.05, 0.05, 2.6, '#4a4f57', q[0], 1.3, q[1], { seg: 8 }));
        H.box(sh, 3.6, 0.1, 1.5, '#2b5f9e', 0, 2.62, 0);
        H.box(sh, 3.2, 1.7, 0.04, '#bfe3ff', 0, 1.4, -0.62, { opacity: 0.35 });
        H.box(sh, 2.2, 0.08, 0.4, '#8a5a2b', 0, 0.5, -0.38);
        H.signPlane(sh, 0.7, 0.7, { emoji: '🚌', bg: '#2b5f9e', border: '#ffffff' }, 1.9, 2.0, 0.7, { cast: false });
        const bus = grp(g, 60, 0, 1.2);
        H.box(bus, 11, 2.7, 2.5, '#f1f3f5', 0, 1.8, 0, { rough: 0.4 });
        H.box(bus, 11.02, 0.5, 2.52, '#2b5f9e', 0, 0.85, 0, { rough: 0.4 });
        H.box(bus, 10.4, 0.9, 2.54, '#22303c', 0, 2.1, 0, { rough: 0.1, metal: 0.5 });
        [[3.4, 1.2], [3.4, -1.2], [-3.4, 1.2], [-3.4, -1.2]].forEach(q => H.cyl(bus, 0.5, 0.5, 0.35, '#151515', q[0], 0.5, q[1], { rx: PI / 2, seg: 14 }));
        H.signPlane(bus, 1.6, 0.5, { text: 'L7 Centre', bg: '#101820', fg: '#ffcc00' }, 5.2, 2.9, 0, { ry: -PI / 2, cast: false });

        // Cotxes aparcats i en moviment
        car(g, '#c0392b', 13, 1.2, 0);
        car(g, '#2e86c1', 37, 1.2, 0);
        const c1 = car(g, '#f1c40f', -30, -1.7, 0), c2 = car(g, '#ecf0f1', 100, -4.0, PI);
        H.onUpdate((dt, t) => {
            c1.position.x += dt * 7; if (c1.position.x > 110) c1.position.x = -40;
            c2.position.x -= dt * 6; if (c2.position.x < -40) c2.position.x = 110;
            sw.forEach(s => { s.g.rotation.z = Math.sin(t * 0.8 + s.ph) * 0.015; });
        });

        // Semàfor
        const tl = grp(g, 22, 0, 2.6);
        H.cyl(tl, 0.06, 0.06, 3.2, '#2f3338', 0, 1.6, 0, { seg: 8 });
        H.box(tl, 0.34, 0.9, 0.3, '#1b1d20', 0, 3.2, 0);
        const red = H.sph(tl, 0.1, '#ff3b30', 0, 3.4, -0.17, { emissive: '#ff3b30', ei: 1.5, cast: false });
        const grn = H.sph(tl, 0.1, '#30d158', 0, 3.0, -0.17, { emissive: '#30d158', ei: 0.1, cast: false });
        H.onUpdate((dt, t) => { const r = Math.floor(t / 7) % 2 === 0; red.material = H.mat('#ff3b30', { emissive: '#ff3b30', ei: r ? 1.6 : 0.08 }); grn.material = H.mat('#30d158', { emissive: '#30d158', ei: r ? 0.08 : 1.6 }); });

        // Vianants de fons
        walker(g, [-10, 6.5], [75, 6.5], 1.3);
        walker(g, [70, 3.7], [-8, 3.7], 1.1, 'scarf');
        walker(g, [-8, -7], [70, -7], 1.4);
        walker(g, [60, -8.5], [0, -8.5], 1.2);

        return {
            ambience: 'street',
            spots: {
                neighbor: { pos: [8, 0, 4.9], face: -PI / 2, from: [7, 0.6], dist: 2.8 },
                crossing: { pos: [20, 0, 4.6], face: -PI / 2, from: [7, 0.3], dist: 2.8 },
                bakery: { pos: [39.5, 0, 5.2], face: -PI / 2, from: [3, 3], dist: 2.8 },
                busstop: { pos: [46, 0, 4.7], face: -PI / 2, from: [7, 0], dist: 2.8 },
                end: { pos: [66, 0, 5.0], face: -PI / 2, from: [7, 0], dist: 2.8 }
            },
            intro: { from: { pos: [-11, 1.7, 5.2], look: [8, 1.5, 5] }, to: { pos: [0, 1.7, 5.2], look: [14, 1.5, 4.7] }, dur: 4.8 }
        };
    };

    /* ============================================================
       CAFETERIA
       ============================================================ */
    World.sets.cafe = function (g, H) {
        H.setAtmosphere(g, '#9cc8f2', '#f3e9dc', '#2b241f', 14, 40);
        g.add(new T.HemisphereLight(H.col('#ffeedd'), H.col('#7a5a3a'), 0.55));
        const sun = new T.DirectionalLight(H.col('#fff0d2'), 1.0);
        sun.position.set(12, 8, 1); sun.target.position.set(0, 0, 0);
        H.setShadow(sun, 9, 40, 1024);
        g.add(sun); g.add(sun.target);

        room(g, 13, 10.5, 3.6, H.texMat(woodTex(), { rough: 0.55 }), '#efe3d0', '#6b4a2f');
        // Finestrals amb llum exterior
        const skyTex = H.tex(256, 256, (c, W, Hh) => {
            const gr = c.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, '#8ec5f5'); gr.addColorStop(1, '#f6fbff');
            c.fillStyle = gr; c.fillRect(0, 0, W, Hh);
            c.fillStyle = '#c8d6e3'; for (let i = 0; i < 5; i++) c.fillRect(i * 52, Hh - rnd(60, 130), 46, 200);
        });
        [-2.8, 0, 2.8].forEach(z => {
            H.pln(g, 2.4, 2.3, H.texMat(skyTex, { glow: 1.1 }), 6.38, 1.9, z, { ry: -PI / 2, cast: false });
            H.box(g, 0.1, 2.4, 0.08, '#3a2a1c', 6.34, 1.9, z - 1.2, { cast: false }); H.box(g, 0.1, 2.4, 0.08, '#3a2a1c', 6.34, 1.9, z + 1.2, { cast: false });
            H.box(g, 0.1, 0.08, 2.4, '#3a2a1c', 6.34, 3.05, z, { cast: false }); H.box(g, 0.1, 0.08, 2.4, '#3a2a1c', 6.34, 0.75, z, { cast: false });
            H.box(g, 0.1, 2.3, 0.05, '#3a2a1c', 6.34, 1.9, z, { cast: false });
        });

        // Taulell, màquina de cafè i vitrina
        H.box(g, 6.2, 1.05, 0.8, '#5b3b24', 1.5, 0.525, -3.6);
        H.box(g, 6.5, 0.07, 1.0, '#f1ede6', 1.5, 1.08, -3.6, { rough: 0.25 });
        H.box(g, 0.8, 0.5, 0.5, '#c9ced4', -0.3, 1.37, -3.7, { metal: 0.8, rough: 0.25 });
        H.cyl(g, 0.05, 0.05, 0.16, '#222', -0.45, 1.05, -3.45, { seg: 8 }); H.cyl(g, 0.05, 0.05, 0.16, '#222', -0.15, 1.05, -3.45, { seg: 8 });
        H.box(g, 1.6, 0.5, 0.6, '#cfe8ff', 3.6, 1.38, -3.6, { opacity: 0.35 });
        ['#e8a0a0', '#f5d76e', '#c8a07a', '#9ad0a0'].forEach((c, i) => H.cyl(g, 0.12, 0.12, 0.08, c, 3.05 + i * 0.35, 1.2, -3.6, { seg: 10 }));
        // Prestatgeries amb pots
        [1.8, 2.35].forEach(y => {
            H.box(g, 4.2, 0.05, 0.3, '#6b4a2f', -2.6, y, -4.82);
            for (let i = 0; i < 9; i++) H.cyl(g, 0.09, 0.09, 0.2, pick(['#e8d2a8', '#b78b5a', '#9ad0a0', '#e8a0a0']), -4.5 + i * 0.45, y + 0.13, -4.82, { seg: 10 });
        });
        // Carta amb pictogrames
        const menu = H.tex(768, 320, (c, W, Hh) => {
            c.fillStyle = '#2b2f33'; c.fillRect(0, 0, W, Hh);
            c.strokeStyle = '#caa46a'; c.lineWidth = 10; c.strokeRect(8, 8, W - 16, Hh - 16);
            c.fillStyle = '#f3e3c3'; c.font = 'bold 42px Arial'; c.textAlign = 'center'; c.fillText('CARTA', W / 2, 62);
            [['☕', 'Cafè', '1,80 €'], ['🥐', 'Croissant', '1,50 €'], ['🥛', 'Llet', '1,20 €'], ['🧃', 'Suc', '2,00 €'], ['🍰', 'Pastís', '2,50 €']].forEach((it, i) => {
                const col = i % 3, row = Math.floor(i / 3), x = 140 + col * 245, y = 150 + row * 110;
                c.font = '58px ' + H.EMOJI_FONT; c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText(it[0], x - 70, y);
                c.textAlign = 'left'; c.font = 'bold 30px Arial'; c.fillStyle = '#f3e3c3'; c.fillText(it[1], x - 30, y - 6);
                c.font = '24px Arial'; c.fillStyle = '#e8c36a'; c.fillText(it[2], x - 30, y + 26);
            });
        });
        H.pln(g, 4.6, 1.92, H.texMat(menu, { glow: 0.35, rough: 0.7 }), 1.5, 2.65, -4.86, { cast: false });

        // Taules, cadires, plantes i làmpades
        [[-4.6, -1.0], [-4.6, 2.8], [0.2, 1.6], [3.0, 3.2], [4.2, -0.4]].forEach((p, i) => {
            table(g, p[0], p[1]);
            chair(g, p[0] - 0.65, p[1], PI / 2, '#8a5a3a'); chair(g, p[0] + 0.65, p[1], -PI / 2, '#8a5a3a');
            H.cyl(g, 0.05, 0.04, 0.09, '#ffffff', p[0] + 0.1, 0.83, p[1] + 0.1, { seg: 8 });
        });
        plant(g, -6.0, -4.5, 1.2); plant(g, 6.0, 4.8, 1.1); plant(g, -6.0, 4.8, 0.9);
        pendant(g, -2.4, 2.5, 0.8, '#d9a066', 0.8); pendant(g, 1.5, 2.5, -1.4, '#d9a066', 0.9); pendant(g, 3.6, 2.5, 2.6, '#d9a066', 0.7);
        H.signPlane(g, 1.6, 0.9, { emoji: '☕', text: 'Bon dia', bg: '#f5e6cc', fg: '#5b3b24', border: '#8a5a2b' }, -6.38, 2.2, -1, { ry: PI / 2, cast: false });
        H.signPlane(g, 1.0, 1.4, { emoji: '🌿', bg: '#e9f2e4', border: '#3d7a4a' }, -6.38, 2.0, 2.4, { ry: PI / 2, cast: false });

        // Vapor de cafè
        const steam = [];
        const sm = new T.MeshBasicMaterial({ color: H.col('#ffffff'), transparent: true, opacity: 0.35, depthWrite: false });
        [[0.3, 1.7], [4.3, -0.3]].forEach(p => { for (let i = 0; i < 5; i++) { const s = new T.Mesh(H.G.sph(0.05, 8, 6), sm); s.userData = { x: p[0], z: p[1], y0: 0.86 + (p[0] < 1 ? 0 : 0), k: i / 5 }; g.add(s); steam.push(s); } });
        H.onUpdate(dt => steam.forEach(s => { s.userData.k = (s.userData.k + dt * 0.35) % 1; const k = s.userData.k; s.position.set(s.userData.x + Math.sin(k * 9) * 0.03, s.userData.y0 + k * 0.45, s.userData.z); s.scale.setScalar(0.6 + k * 1.2); }));

        // Clients
        idler(g, -4.6, -2.0, PI / 2).setExpression('happy');
        idler(g, 4.2, -1.5, PI, pick(LOOKS));
        walker(g, [-2.5, 5.0], [-2.5, -1.2], 1.0);

        return {
            ambience: 'cafe',
            spots: {
                counter: { pos: [1.5, 0, -4.35], face: 0, dist: 2.7 },
                table: { pos: [-3.3, 0, 0.9], face: PI / 2, from: [0, 5], dist: 2.6 },
                window: { pos: [4.3, 0, 1.2], face: -PI / 2, from: [0, 5], dist: 2.6 }
            },
            intro: { from: { pos: [0, 1.65, 5.1], look: [0, 1.5, -2] }, to: { pos: [0.3, 1.6, 2.3], look: [1.2, 1.4, -4] }, dur: 4 }
        };
    };

    /* ============================================================
       FARMÀCIA
       ============================================================ */
    World.sets.pharmacy = function (g, H) {
        H.setAtmosphere(g, '#bcd9f2', '#eef6fb', '#1c2a33', 14, 40);
        g.add(new T.HemisphereLight(H.col('#eef6ff'), H.col('#9fb0b8'), 0.85));
        const sun = new T.DirectionalLight(H.col('#ffffff'), 0.7);
        sun.position.set(-3, 9, 8); sun.target.position.set(0, 0, 0);
        H.setShadow(sun, 8, 30, 1024);
        g.add(sun); g.add(sun.target);

        room(g, 10, 10, 3.4, H.texMat(tileTex('#e6eaee', '#cfd6dc', 8), { rough: 0.35 }), '#f6f8f9', '#9fb8c4');
        [[-2.5, 3.2, 0], [2.5, 3.2, 0], [0, 3.2, -3]].forEach(p => {
            H.box(g, 1.4, 0.05, 0.6, '#ffffff', p[0], p[1], p[2], { emissive: '#ffffff', ei: 1.2, cast: false });
            const pl = new T.PointLight(H.col('#f4fbff'), 0.8, 10, 1.3); pl.position.set(p[0], 2.9, p[2]); g.add(pl);
        });

        // Mostrador i caixa
        H.box(g, 5, 1.05, 0.8, '#f1f4f6', 0.8, 0.525, -2.6, { rough: 0.35 });
        H.box(g, 5.2, 0.06, 0.95, '#2e9d5b', 0.8, 1.08, -2.6, { rough: 0.3 });
        H.box(g, 0.5, 0.3, 0.4, '#2d3238', 2.3, 1.26, -2.6);
        H.box(g, 0.4, 0.22, 0.04, '#7fb4ff', 2.3, 1.42, -2.8, { emissive: '#7fb4ff', ei: 0.6, rx: -0.3, cast: false });
        H.cyl(g, 0.07, 0.07, 0.2, '#e6f3ff', -0.6, 1.2, -2.5, { seg: 10 });

        // Prestatgeries amb caixes de medicaments (paret del fons i lateral)
        const boxCols = ['#ffffff', '#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6', '#ecf0f1', '#ff9f43'];
        for (let r = 0; r < 5; r++) {
            const y = 0.55 + r * 0.5;
            H.box(g, 8.6, 0.04, 0.4, '#9fb0b8', 0, y - 0.05, -4.7);
            for (let i = 0; i < 24; i++) H.box(g, 0.28, rnd(0.25, 0.4), 0.2, pick(boxCols), -4.1 + i * 0.36, y + 0.15, -4.7, { cast: false });
            H.box(g, 0.4, 0.04, 8, '#9fb0b8', -4.7, y - 0.05, 0);
            for (let i = 0; i < 20; i++) H.box(g, 0.2, rnd(0.25, 0.4), 0.28, pick(boxCols), -4.7, y + 0.15, -3.7 + i * 0.37, { cast: false });
        }
        // Creu verda
        const cross = grp(g, 0.8, 2.9, -4.84);
        H.box(cross, 0.9, 0.3, 0.06, '#22c55e', 0, 0, 0, { emissive: '#22c55e', ei: 1.2, cast: false });
        H.box(cross, 0.3, 0.9, 0.06, '#22c55e', 0, 0, 0, { emissive: '#22c55e', ei: 1.2, cast: false });
        // Pòsters amb pictogrames (a la paret dreta)
        [['🤧', 'Refredat'], ['🌡️', 'Febre'], ['🩹', 'Tiretes'], ['💊', 'Pastilles']].forEach((p, i) => {
            H.signPlane(g, 1.6, 0.95, { emoji: p[0], text: p[1], bg: '#ffffff', fg: '#1f4d5c', border: '#2e9d5b' }, 4.88, 2.4 - (i % 2) * 1.15, -2.2 + Math.floor(i / 2) * 1.9, { ry: -PI / 2, cast: false });
        });
        // Seients d'espera, bàscula i plantes
        for (let i = 0; i < 3; i++) chair(g, 4.0, 1.6 + i * 0.6, -PI / 2, '#3f7f9e');
        H.cyl(g, 0.28, 0.3, 0.1, '#cfd6dc', 3.9, 0.05, 4.1, { seg: 16 });
        H.cyl(g, 0.03, 0.03, 1.0, '#cfd6dc', 3.9, 0.55, 4.3, { seg: 6 });
        plant(g, -4.2, 4.6, 1.2); plant(g, 4.3, -3.9, 1.0);

        idler(g, 3.6, 3.0, -PI / 2).setExpression('worried');

        return {
            ambience: 'pharmacy',
            spots: {
                counter: { pos: [0.8, 0, -3.45], face: 0, dist: 2.6 },
                shelf: { pos: [-2.6, 0, 0.6], face: PI / 2, from: [0, 5], dist: 2.6 }
            },
            intro: { from: { pos: [0, 1.65, 5.2], look: [0, 1.5, -3] }, to: { pos: [0.2, 1.6, 2.0], look: [0.6, 1.4, -3.5] }, dur: 3.8 }
        };
    };

    /* ============================================================
       PARC
       ============================================================ */
    World.sets.park = function (g, H) {
        H.setAtmosphere(g, '#3f90e6', '#d4ecff', '#cfe8f8', 50, 210, '#88b27a');
        H.daylight(g, { center: [30, 0, 0], shadowSize: 50, dir: [16, 34, -20], intensity: 1.8 });
        H.sunGlow(g, 130, 140, -150, 'rgba(255,244,200,0.75)', 140);
        H.clouds(g, 10, 160, 62);
        const sw = [];

        const grass = H.tex(256, 256, (c, W, Hh) => {
            c.fillStyle = '#5da84a'; c.fillRect(0, 0, W, Hh);
            for (let i = 0; i < 900; i++) { c.fillStyle = 'hsla(' + rnd(95, 125) + ',45%,' + rnd(30, 48) + '%,0.35)'; c.fillRect(rnd(0, W), rnd(0, Hh), 2, rnd(3, 8)); }
        }, [60, 60]);
        H.pln(g, 420, 420, H.texMat(grass, { rough: 1 }), 30, 0, 0, { rx: -PI / 2, cast: false });
        H.box(g, 220, 0.06, 3.4, '#dccaa6', 30, 0.03, 0, { rough: 1, cast: false });
        H.box(g, 220, 0.1, 0.18, '#b9a98c', 30, 0.05, 1.8, { cast: false });
        H.box(g, 220, 0.1, 0.18, '#b9a98c', 30, 0.05, -1.8, { cast: false });
        H.box(g, 3.4, 0.06, 12, '#dccaa6', 40, 0.03, 7.5, { rough: 1, cast: false });

        // Estany amb ànecs
        H.cyl(g, 7, 7, 0.08, '#3f9ad8', 40, 0.05, 14, { rough: 0.1, metal: 0.3, seg: 40, cast: false });
        for (let i = 0; i < 28; i++) { const a = (i / 28) * TAU; H.sph(g, 0.34, '#9a9a94', 40 + Math.cos(a) * 7.1, 0.12, 14 + Math.sin(a) * 7.1, { sy: 0.6 }); }
        const ducks = [];
        for (let i = 0; i < 3; i++) {
            const d = grp(g, 0, 0.12, 0);
            H.sph(d, 0.2, '#fafafa', 0, 0.08, 0, { sx: 1.4, sy: 0.8 });
            H.sph(d, 0.1, '#2e7d32', 0.24, 0.3, 0);
            H.box(d, 0.12, 0.03, 0.08, '#ff9f1c', 0.36, 0.28, 0);
            ducks.push({ g: d, r: 2 + i * 1.3, a: i * 2.1, s: 0.25 + i * 0.07 });
        }

        // Arbres, arbustos i flors
        const keep = (x, z) => Math.abs(z) < 3.6 || Math.hypot(x - 40, z - 14) < 9.5 || (Math.abs(x - 40) < 2.6 && z > 0 && z < 14);
        let placed = 0, guard = 0;
        while (placed < 46 && guard++ < 400) {
            const x = rnd(-22, 100), z = rnd(-34, 34);
            if (keep(x, z)) continue;
            tree(g, x, z, rnd(0.8, 1.4), Math.random() < 0.28 ? 'pine' : 'round', sw);
            placed++;
        }
        for (let i = 0; i < 26; i++) { const x = rnd(-12, 90), z = (Math.random() < 0.5 ? -1 : 1) * rnd(2.8, 4.2); H.ico(g, rnd(0.4, 0.7), pick(['#3a8f4a', '#2f7d3f', '#4aa35a']), x, 0.35, z, { detail: 1 }); }
        for (let i = 0; i < 16; i++) {
            const cx = rnd(-8, 90), cz = (Math.random() < 0.5 ? -1 : 1) * rnd(4.2, 9), c = pick(['#ff5a8a', '#ffd23f', '#ffffff', '#c77dff', '#ff8c42']);
            for (let k = 0; k < 7; k++) H.sph(g, 0.07, c, cx + rnd(-0.6, 0.6), 0.14, cz + rnd(-0.6, 0.6), { cast: false });
        }
        [6, 22, 38, 54, 70].forEach(x => lamp(g, x, -2.3, PI));
        bench(g, 22, 2.5, PI); bench(g, 56, -2.5, 0); bench(g, 12, -2.5, 0);
        const rd = dog(g, 9.3, 1.0, -PI / 2);

        // Ocells volant
        const birds = [];
        for (let i = 0; i < 5; i++) {
            const b = grp(g, 0, 0, 0);
            const w1 = grp(b, 0, 0, 0), w2 = grp(b, 0, 0, 0);
            H.box(w1, 0.5, 0.02, 0.14, '#33363b', 0.25, 0, 0, { cast: false }); H.box(w2, 0.5, 0.02, 0.14, '#33363b', -0.25, 0, 0, { cast: false });
            birds.push({ b, w1, w2, a: i * 1.3, r: 14 + i * 4, h: 12 + i * 1.5, s: 0.25 + i * 0.03 });
        }
        H.onUpdate((dt, t) => {
            sw.forEach(s => { s.g.rotation.z = Math.sin(t * 0.8 + s.ph) * 0.02; });
            ducks.forEach(d => { d.a += dt * d.s; d.g.position.set(40 + Math.cos(d.a) * d.r, 0.12 + Math.sin(t * 2 + d.a) * 0.02, 14 + Math.sin(d.a) * d.r); d.g.rotation.y = -d.a; });
            birds.forEach(o => { o.a += dt * o.s; o.b.position.set(20 + Math.cos(o.a) * o.r * 2, o.h, Math.sin(o.a) * o.r); o.b.rotation.y = -o.a; o.w1.rotation.z = Math.sin(t * 9 + o.a) * 0.6; o.w2.rotation.z = -Math.sin(t * 9 + o.a) * 0.6; });
        });

        walker(g, [-12, 0.8], [90, 0.8], 2.4, 'scarf');
        walker(g, [80, -0.8], [-10, -0.8], 1.2);

        return {
            ambience: 'park',
            spots: {
                path: { pos: [8, 0, 0.4], face: -PI / 2, from: [7, 0], dist: 2.9 },
                bench: { pos: [22, 0, 0.5], face: -PI / 2, from: [7, 0], dist: 2.9 },
                pond: { pos: [36, 0, 3.0], face: -PI / 2, from: [7, 0], dist: 2.9 }
            },
            intro: { from: { pos: [-12, 1.7, 0.6], look: [6, 1.5, 0.2] }, to: { pos: [-2, 1.7, 0.5], look: [12, 1.4, 0.2] }, dur: 4.8 }
        };
    };

    /* ============================================================
       OFICINA
       ============================================================ */
    World.sets.office = function (g, H) {
        H.setAtmosphere(g, '#a7cff2', '#eaf4fc', '#1d2430', 18, 60);
        g.add(new T.HemisphereLight(H.col('#f1f6ff'), H.col('#8f98a8'), 0.8));
        const sun = new T.DirectionalLight(H.col('#fff6e6'), 0.9);
        sun.position.set(4, 10, -14); sun.target.position.set(0, 0, 0);
        H.setShadow(sun, 12, 40, 2048);
        g.add(sun); g.add(sun.target);

        const carpet = H.tex(256, 256, (c, W, Hh) => { c.fillStyle = '#6f7684'; c.fillRect(0, 0, W, Hh); for (let i = 0; i < 1400; i++) { c.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '255,255,255' : '0,0,0') + ',0.06)'; c.fillRect(rnd(0, W), rnd(0, Hh), 2, 2); } }, [8, 6]);
        room(g, 18, 14, 3.6, H.texMat(carpet, { rough: 1 }), '#f1f3f6', '#cfd4dc');
        for (let x = -6; x <= 6; x += 6) for (let z = -4; z <= 4; z += 4) {
            H.box(g, 1.4, 0.04, 0.7, '#ffffff', x, 3.55, z, { emissive: '#ffffff', ei: 1.1, cast: false });
            if (z === 0 || (x === 0 && z === -4)) { const pl = new T.PointLight(H.col('#f4f8ff'), 0.55, 11, 1.2); pl.position.set(x, 3.2, z); g.add(pl); }
        }
        // Finestral amb skyline
        const sky = H.tex(1024, 256, (c, W, Hh) => {
            const gr = c.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, '#8ec5f5'); gr.addColorStop(1, '#eaf6ff'); c.fillStyle = gr; c.fillRect(0, 0, W, Hh);
            for (let i = 0; i < 22; i++) { const w = rnd(40, 90), h = rnd(70, 200), x = i * 48 + rnd(-10, 10); c.fillStyle = i % 2 ? '#8da4ba' : '#a9bccd'; c.fillRect(x, Hh - h, w, h); c.fillStyle = 'rgba(255,255,255,0.45)'; for (let k = 0; k < 8; k++) c.fillRect(x + rnd(4, w - 10), Hh - h + rnd(6, h - 14), 6, 8); }
        });
        H.pln(g, 16, 2.6, H.texMat(sky, { glow: 1.1 }), 0, 2.1, -6.86, { cast: false });
        for (let x = -8; x <= 8; x += 4) H.box(g, 0.1, 2.7, 0.1, '#cfd4dc', x, 2.1, -6.82, { cast: false });
        H.box(g, 16.2, 0.08, 0.1, '#cfd4dc', 0, 3.42, -6.82, { cast: false }); H.box(g, 16.2, 0.08, 0.1, '#cfd4dc', 0, 0.78, -6.82, { cast: false });

        // Recepció amb logotip
        H.box(g, 5, 1.1, 0.5, '#b88a5a', 0, 0.55, -0.5);
        H.box(g, 5.2, 0.06, 0.9, '#f4f1ea', 0, 1.13, -0.55, { rough: 0.3 });
        H.box(g, 0.5, 0.32, 0.04, '#222', 1.2, 1.4, -0.7); H.box(g, 0.46, 0.28, 0.02, '#7fb4ff', 1.2, 1.4, -0.67, { emissive: '#7fb4ff', ei: 0.6, cast: false });
        H.box(g, 7, 3, 0.12, '#2563eb', 0, 1.5, -2.6);
        H.signPlane(g, 5.2, 1.3, { text: 'Ona Digital', emoji: '🌐', bg: '#ffffff', fg: '#1e3a8a', border: '#93b4ff' }, 0, 2.0, -2.52, { cast: false });
        plant(g, -3.4, -0.8, 1.3); plant(g, 3.4, -0.8, 1.3);

        // Zona d'escriptoris
        const scr = screenTex();
        const desk = (x, z, ry) => {
            const d = grp(g, x, 0, z, ry);
            H.box(d, 1.7, 0.05, 0.85, '#d8c3a5', 0, 0.74, 0);
            [[-0.8, -0.38], [0.8, -0.38], [-0.8, 0.38], [0.8, 0.38]].forEach(q => H.box(d, 0.05, 0.72, 0.05, '#4a4f57', q[0], 0.36, q[1]));
            H.box(d, 0.52, 0.32, 0.03, '#1b1d20', 0, 1.06, -0.25);
            H.pln(d, 0.48, 0.28, H.texMat(scr, { glow: 0.8, rough: 0.4 }), 0, 1.06, -0.232, { cast: false });
            H.box(d, 0.08, 0.14, 0.08, '#1b1d20', 0, 0.84, -0.25);
            chair(d, 0, 0.7, PI, '#3b4a63');
        };
        [-8, -6.4, -4.8].forEach(x => { desk(x, -3.6, 0); desk(x, -0.6, PI); });
        desk(-7.2, 3.6, 0); desk(-5.6, 3.6, 0);
        H.box(g, 0.06, 1.5, 7, '#9fb0b8', -3.8, 0.75, -2.1, { opacity: 0.25 });

        // Sala de reunions de vidre
        const mr = grp(g, 5.9, 0, -3.6);
        H.box(mr, 5.4, 3.0, 0.06, '#bfe3ff', 0, 1.5, -2.2, { opacity: 0.2 });
        H.box(mr, 0.06, 3.0, 4.4, '#bfe3ff', -2.7, 1.5, 0, { opacity: 0.2 });
        H.box(mr, 0.06, 3.0, 4.4, '#bfe3ff', 2.7, 1.5, 0, { opacity: 0.2 });
        H.box(mr, 3.6, 0.07, 1.5, '#7a5a3a', 0, 0.76, 0.2); H.cyl(mr, 0.08, 0.08, 0.72, '#33363b', 0, 0.38, 0.2);
        for (let i = 0; i < 3; i++) { chair(mr, -1.2 + i * 1.2, 1.35, PI, '#e2574c'); chair(mr, -1.2 + i * 1.2, -0.95, 0, '#e2574c'); }
        H.box(mr, 2.4, 1.2, 0.05, '#ffffff', 0, 1.9, -2.12, { rough: 0.3 });
        H.signPlane(mr, 2.2, 1.0, { text: 'Objectius', emoji: '📈', bg: '#ffffff', fg: '#1e3a8a' }, 0, 1.9, -2.08, { cast: false });

        // Cuina / cafè
        const kt = grp(g, 8.3, 0, 4.2);
        H.box(kt, 0.7, 0.95, 3.6, '#e9ecef', 0, 0.475, 0);
        H.box(kt, 0.8, 0.05, 3.7, '#6b7280', 0, 0.97, 0);
        H.box(kt, 0.4, 0.5, 0.45, '#2d2d2d', 0, 1.25, -0.7, { metal: 0.5 });
        H.cyl(kt, 0.05, 0.05, 0.1, '#ffffff', -0.1, 1.02, 0.5, { seg: 8 });
        H.box(kt, 0.7, 1.7, 0.8, '#dfe3e8', 0, 0.85, 1.4);
        H.cyl(kt, 0.2, 0.2, 0.7, '#7fb4ff', 0, 1.35, -1.4, { opacity: 0.55, seg: 14 });
        plant(g, 8.2, 6.2, 1.1);
        H.signPlane(g, 1.3, 0.8, { emoji: '☕', text: 'Cafè', bg: '#fff7e6', fg: '#5b3b24', border: '#b88a5a' }, 8.86, 2.3, 4.2, { ry: -PI / 2, cast: false });

        // Pissarra
        const wb = H.tex(512, 256, (c, W, Hh) => { c.fillStyle = '#fbfbfb'; c.fillRect(0, 0, W, Hh); c.strokeStyle = '#2563eb'; c.lineWidth = 6; c.beginPath(); c.moveTo(40, 200); c.lineTo(140, 140); c.lineTo(230, 160); c.lineTo(330, 80); c.lineTo(450, 50); c.stroke(); c.fillStyle = '#e2574c'; c.font = 'bold 34px Arial'; c.fillText('Q4 ↗', 40, 60); });
        H.pln(g, 2.4, 1.2, H.texMat(wb, { rough: 0.4 }), -8.86, 1.9, 5.5, { ry: PI / 2, cast: false });

        walker(g, [-2, 4.5], [4, 2.5], 1.1, 'badge');
        walker(g, [-3, 0.8], [6, 1.5], 1.0, 'tie');

        return {
            ambience: 'office',
            spots: {
                reception: { pos: [0, 0, -1.35], face: 0, dist: 2.7 },
                desk: { pos: [-4.4, 0, 2.2], face: PI / 2, from: [0, 4], dist: 2.8 },
                meeting: { pos: [5.9, 0, -3.1], face: 0, dist: 3.2 },
                kitchen: { pos: [6.6, 0, 4.2], face: -PI / 2, from: [0, 3], dist: 2.6 }
            },
            intro: { from: { pos: [0, 1.65, 6.5], look: [0, 1.5, -3] }, to: { pos: [0.3, 1.65, 2.9], look: [0, 1.4, -2] }, dur: 4.4 }
        };
    };
})();