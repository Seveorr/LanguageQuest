/* ============================================================
   REAL LIFE · audio.js
   · SFX    : efectes sonors i so ambient sintetitzats amb WebAudio
              (no cal cap fitxer d'àudio)
   · Voice  : síntesi de veu (els personatges parlen) i
              reconeixement de veu (proves de parla)
   ============================================================ */

const SFX = (function () {
    'use strict';
    let ctx = null, master = null, muted = false, amb = null, noiseBuf = null;
    const rnd = (a, b) => a + Math.random() * (b - a);

    function init() {
        if (ctx) return;
        try {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            master = ctx.createGain();
            master.gain.value = muted ? 0 : 0.85;
            master.connect(ctx.destination);
        } catch (e) { ctx = null; }
    }
    function resume() { init(); if (ctx && ctx.state === 'suspended') ctx.resume(); }

    function tone(f0, t0, dur, type, vol, f1) {
        if (!ctx) return;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type || 'sine';
        o.frequency.setValueAtTime(f0, t0);
        if (f1) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(vol || 0.15, t0 + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g); g.connect(master);
        o.start(t0); o.stop(t0 + dur + 0.05);
    }

    function noise() {
        if (noiseBuf) return noiseBuf;
        const len = ctx.sampleRate * 2, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
        let last = 0;
        for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
        noiseBuf = b;
        return b;
    }

    function noiseBurst(t0, dur, f0, f1, vol, q) {
        if (!ctx) return;
        const s = ctx.createBufferSource(); s.buffer = noise();
        const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = q || 1.2;
        f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        s.connect(f); f.connect(g); g.connect(master);
        s.start(t0, Math.random()); s.stop(t0 + dur + 0.05);
    }

    // Ambients: soroll de fons filtrat + petits esdeveniments aleatoris
    const AMB = {
        street: { lp: 520, vol: 0.5, ev: () => noiseBurst(ctx.currentTime, 2.2, 300, 900, 0.22, 0.8), gap: [5, 11] },
        cafe: { lp: 1100, vol: 0.3, ev: () => { tone(2600, ctx.currentTime, 0.12, 'sine', 0.05, 2200); }, gap: [3, 8] },
        park: { lp: 700, vol: 0.28, ev: () => { const t = ctx.currentTime, b = rnd(2400, 3400); tone(b, t, 0.1, 'sine', 0.05, b * 1.3); tone(b * 1.1, t + 0.14, 0.1, 'sine', 0.05, b * 1.4); if (Math.random() < 0.5) tone(b * 0.9, t + 0.3, 0.12, 'sine', 0.04, b * 1.2); }, gap: [1.2, 3.5] },
        pharmacy: { lp: 380, vol: 0.18, ev: () => tone(880, ctx.currentTime, 0.4, 'sine', 0.025), gap: [8, 16] },
        office: { lp: 600, vol: 0.2, ev: () => { for (let i = 0; i < 4; i++) noiseBurst(ctx.currentTime + i * 0.07, 0.04, 3000, 2500, 0.05, 2); }, gap: [1.2, 4] }
    };

    const api = {
        unlock: resume,
        isMuted: () => muted,
        setMuted(m) {
            muted = !!m;
            if (master) master.gain.value = muted ? 0 : 0.85;
            if (muted && window.speechSynthesis) window.speechSynthesis.cancel();
        },
        click() { resume(); if (ctx) tone(520, ctx.currentTime, 0.05, 'square', 0.04); },
        correct() { resume(); if (!ctx) return; const t = ctx.currentTime; tone(660, t, 0.12, 'sine', 0.16); tone(880, t + 0.1, 0.12, 'sine', 0.16); tone(1320, t + 0.2, 0.3, 'sine', 0.14); },
        wrong() { resume(); if (!ctx) return; const t = ctx.currentTime; tone(260, t, 0.28, 'triangle', 0.16, 150); tone(200, t + 0.12, 0.3, 'triangle', 0.12, 110); },
        whoosh() { resume(); if (ctx) noiseBurst(ctx.currentTime, 1.4, 250, 1800, 0.18, 0.7); },
        chapter() { resume(); if (!ctx) return; const t = ctx.currentTime; [392, 494, 587].forEach((f, i) => tone(f, t + i * 0.12, 1.4, 'sine', 0.07)); },
        fanfare() { resume(); if (!ctx) return; const t = ctx.currentTime; [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, t + i * 0.13, 0.35, 'triangle', 0.13)); },
        stopAmbience() {
            if (!amb) return;
            clearTimeout(amb.timer);
            const a = amb; amb = null;
            try { a.gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.6); setTimeout(() => { try { a.src.stop(); } catch (e) { } }, 700); } catch (e) { }
        },
        ambience(kind) {
            api.stopAmbience();
            resume();
            const cfg = AMB[kind];
            if (!ctx || !cfg) return;
            const src = ctx.createBufferSource(); src.buffer = noise(); src.loop = true;
            const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cfg.lp;
            const g = ctx.createGain(); g.gain.value = 0.0001;
            src.connect(f); f.connect(g); g.connect(master);
            src.start();
            g.gain.linearRampToValueAtTime(cfg.vol * 0.12, ctx.currentTime + 1.8);
            const me = { src, gain: g, kind, timer: null };
            amb = me;
            const loop = () => {
                if (amb !== me) return;
                try { cfg.ev(); } catch (e) { }
                me.timer = setTimeout(loop, rnd(cfg.gap[0], cfg.gap[1]) * 1000);
            };
            me.timer = setTimeout(loop, rnd(1000, 3000));
        }
    };
    return api;
})();

const Voice = (function () {
    'use strict';

    /* ---------- Síntesi de veu (els personatges parlen) ---------- */
    const ttsOK = 'speechSynthesis' in window;
    let voices = [];
    function loadVoices() { try { voices = window.speechSynthesis.getVoices(); } catch (e) { voices = []; } }
    if (ttsOK) { loadVoices(); window.speechSynthesis.onvoiceschanged = loadVoices; }
    const catalan = () => voices.find(v => /^ca/i.test(v.lang)) || null;

    function say(text, opts) {
        opts = opts || {};
        return new Promise(resolve => {
            if (!ttsOK || SFX.isMuted()) { resolve(); return; }
            let done = false;
            const fin = () => { if (!done) { done = true; resolve(); } };
            try {
                window.speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance(text);
                u.lang = 'ca-ES';
                const v = catalan(); if (v) u.voice = v;
                u.pitch = opts.pitch || 1; u.rate = opts.rate || 1;
                u.onend = fin; u.onerror = fin;
                setTimeout(() => { try { window.speechSynthesis.speak(u); } catch (e) { fin(); } }, 60);
                setTimeout(fin, 14000);
            } catch (e) { fin(); }
        });
    }
    function stopSpeaking() { if (ttsOK) { try { window.speechSynthesis.cancel(); } catch (e) { } } }

    /* ---------- Reconeixement de veu ---------- */
    const API = window.SpeechRecognition || window.webkitSpeechRecognition;
    const ua = navigator.userAgent || '';
    // Opera i Brave exposen l'API però no porten el servei de veu de Google
    const badBrowser = /OPR\//.test(ua) || !!navigator.brave;
    const sttOK = !!API && !badBrowser;
    const sttReason = !API ? 'Aquest navegador no admet el reconeixement de veu.' :
        (badBrowser ? 'Aquest navegador no inclou el servei de veu de Google.' : '');

    function normalize(t) {
        return (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    }
    function levenshtein(a, b) {
        const m = a.length, n = b.length;
        const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;
        for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
        return dp[m][n];
    }
    function isCloseMatch(said, target) {
        const a = normalize(said), b = normalize(target);
        if (!a) return false;
        if (a === b || a.includes(b) || b.includes(a)) return true;
        return levenshtein(a, b) <= Math.max(2, Math.round(b.length * 0.25));
    }

    // opts: { target: () => text|null, onInterim(text), onEnd({text, matched, error}) }
    function listen(opts) {
        if (!sttOK) { opts.onEnd({ text: '', matched: false, error: 'unsupported' }); return { stop() { } }; }
        const rec = new API();
        rec.lang = 'ca-ES'; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 3;
        let finalT = '', matched = false, error = null, ended = false;
        rec.onresult = e => {
            let interim = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const tr = e.results[i][0].transcript;
                if (e.results[i].isFinal) finalT += tr + ' '; else interim += tr;
            }
            const cur = (finalT + interim).trim();
            if (opts.onInterim) opts.onInterim(cur);
            const target = opts.target && opts.target();
            if (target && !matched && isCloseMatch(cur, target)) {
                matched = true; finalT = cur;
                try { rec.stop(); } catch (_) { }
            }
        };
        rec.onerror = e => { if (e.error === 'no-speech' || e.error === 'aborted') return; error = e.error; };
        rec.onend = () => { if (ended) return; ended = true; opts.onEnd({ text: finalT.trim(), matched, error }); };
        try { rec.start(); } catch (e) { ended = true; opts.onEnd({ text: '', matched: false, error: 'start' }); }
        return { stop() { try { rec.stop(); } catch (_) { } } };
    }

    return { say, stopSpeaking, listen, isCloseMatch, normalize, sttOK, sttReason, ttsOK };
})();