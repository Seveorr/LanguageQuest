/* ============================================================
   REAL LIFE · game.js  (LÒGICA DEL JOC)
   Orquestra: menú d'escenaris → capítols → personatges → proves
   (Pictomatcher / Moodfinder / Dialogues / Talker) → resultats.
   Depèn de: data.js (contingut), audio.js, world.js, sets.js
   ============================================================ */
(function () {
    'use strict';

    const MENU_URL = '../index.html';     // ← canvia-ho si el teu menú és en una altra ruta

    const $ = id => document.getElementById(id);
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const shuffle = a => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = r[i]; r[i] = r[j]; r[j] = t; } return r; };
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const wordCount = t => (t || '').trim() ? t.trim().split(/\s+/).length : 0;

    const CAT_ICON = { 'Vocabulari': '🖼️', 'Emocions': '😄', 'Converses': '🗣️', 'Parla': '🎤' };
    const CAT_ORDER = ['Vocabulari', 'Emocions', 'Converses', 'Parla'];
    const catOf = q => q.type === 'match' || q.type === 'build' ? 'Vocabulari'
        : q.type === 'emotion' ? 'Emocions'
            : q.type === 'choice' ? (q.speaker === 'npc' ? 'Converses' : 'Emocions') : 'Parla';

    const S = {
        sc: null, plan: [], total: 0, qi: 0, results: [], streak: 0, best: 0,
        inMenu: true, running: false, npc: null, typeJob: 0, mic: null, enter: null, curText: '', curVoice: null
    };
    window.RealLife = { S };

    /* ---------------- Utilitats d'interfície ---------------- */
    function fadeTo(a, ms) {
        const f = $('fade');
        f.style.transition = 'opacity ' + ms + 'ms ease';
        f.style.opacity = a;
        return sleep(ms);
    }
    const bars = on => $('bars').classList.toggle('on', !!on);
    const showPanel = () => $('panel').classList.add('show');
    const hidePanel = () => $('panel').classList.remove('show');
    function resetPanel() {
        $('panel').classList.remove('answered');
        $('pBody').innerHTML = '';
        $('pFeedback').className = 'pfeedback hidden';
        $('pFeedback').innerHTML = '';
        $('pNext').classList.add('hidden');
        $('pText').textContent = '';
    }
    function showError(msg) {
        $('loading').classList.add('hidden');
        $('errText').textContent = msg;
        $('errorBox').classList.remove('hidden');
    }
    function lock() { $('pBody').querySelectorAll('button').forEach(b => { b.disabled = true; }); }
    function stopMic() { if (S.mic) { S.mic.stop(); S.mic = null; } }

    function typeText(el, text, cps) {
        const job = ++S.typeJob;
        el.textContent = '';
        return new Promise(res => {
            let i = 0;
            const step = () => {
                if (job !== S.typeJob) { el.textContent = text; res(); return; }
                i += Math.max(1, Math.round(cps / 30));
                el.textContent = text.slice(0, i);
                if (i >= text.length) { res(); return; }
                setTimeout(step, 33);
            };
            step();
        });
    }

    function showNameTag(def) {
        $('ntName').textContent = def.name;
        $('ntRole').textContent = def.role || '';
        $('nameTag').classList.remove('hidden');
    }
    const hideNameTag = () => $('nameTag').classList.add('hidden');

    function showPraise(text) {
        const p = $('praise');
        p.textContent = text;
        p.classList.remove('go'); void p.offsetWidth; p.classList.add('go');
    }

    /* ---------------- HUD i progrés ---------------- */
    function buildProgress(n) {
        const box = $('progress');
        box.innerHTML = '';
        for (let i = 0; i < n; i++) { const s = document.createElement('span'); s.className = 'seg'; box.appendChild(s); }
    }
    function markSeg(i, cls) {
        const segs = $('progress').children;
        for (let k = 0; k < segs.length; k++) if (segs[k].classList.contains('current')) segs[k].classList.remove('current');
        if (segs[i]) segs[i].className = 'seg ' + cls;
    }
    function updateHUD() {
        $('hudCount').textContent = S.results.length + '/' + S.total;
        const st = $('hudStreak');
        if (S.streak >= 2) { st.textContent = '🔥 x' + S.streak; st.classList.remove('hidden'); } else st.classList.add('hidden');
    }

    /* ---------------- Millors resultats (localStorage) ---------------- */
    function getBest(id) { try { return (JSON.parse(localStorage.getItem('lq_reallife_best')) || {})[id] || null; } catch (e) { return null; } }
    function saveBest(id, pct) {
        try {
            const all = JSON.parse(localStorage.getItem('lq_reallife_best')) || {};
            const prev = all[id];
            const isNew = !prev || pct > prev.pct;
            if (isNew) { all[id] = { pct, date: Date.now() }; localStorage.setItem('lq_reallife_best', JSON.stringify(all)); }
            return { isNew, prev: prev ? prev.pct : null };
        } catch (e) { return { isNew: false, prev: null }; }
    }
    const starsFor = pct => pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 40 ? 1 : 0;

    /* ---------------- Menú d'escenaris ---------------- */
    const DIFF = { 1: 'Fàcil', 2: 'Mitjà', 3: 'Difícil' };
    function buildMenu() {
        const list = $('scList');
        list.innerHTML = '';
        SCENARIOS.forEach(sc => {
            const best = getBest(sc.id);
            const el = document.createElement('button');
            el.type = 'button';
            el.className = 'sc-card';
            el.style.setProperty('--accent', sc.color || '#2196F3');
            el.innerHTML =
                '<div class="sc-emoji">' + sc.emoji + '</div>' +
                '<div class="sc-info"><h3>' + esc(sc.title) + '</h3><p>' + esc(sc.description) + '</p>' +
                '<div class="sc-meta"><span>📍 ' + sc.chapters.length + ' capítols</span><span>❓ ' + sc.totalQuestions + ' proves</span><span>🎚️ ' + (DIFF[sc.difficulty] || 'Mitjà') + '</span></div></div>' +
                '<div class="sc-side">' + (best ? '<div class="sc-best">' + '⭐'.repeat(Math.max(1, starsFor(best.pct))) + '<b>' + best.pct + '%</b><small>Millor</small></div>' : '<div class="sc-best new">Nou</div>') +
                '<div class="sc-go">Començar ▶</div></div>';
            el.onclick = () => startScenario(sc);
            list.appendChild(el);
        });
        if (!Voice.sttOK) {
            $('menuNotice').innerHTML = '🎤 ' + esc(Voice.sttReason) + ' Les proves de parla s\'ometran. Per jugar-hi, obre el Real Life amb <b>Google Chrome</b>.';
            $('menuNotice').classList.remove('hidden');
        }
    }

    /* ---------------- Flux principal ---------------- */
    async function startScenario(sc) {
        if (S.running) return;
        S.running = true; S.inMenu = false;
        SFX.unlock(); SFX.click();
        S.sc = sc; S.results = []; S.streak = 0; S.best = 0; S.qi = 0; S.npc = null;
        const speechOK = q => Voice.sttOK || (q.type !== 'speak' && q.type !== 'talk');
        S.plan = sc.chapters.map(ch => ({
            ch,
            beats: ch.beats.map(b => ({ b, qs: b.questions.filter(speechOK) })).filter(x => x.qs.length)
        })).filter(p => p.beats.length);
        S.total = S.plan.reduce((a, p) => a + p.beats.reduce((x, y) => x + y.qs.length, 0), 0);
        $('screenMenu').classList.add('hidden');
        $('hudScenario').textContent = sc.title;
        buildProgress(S.total); updateHUD();
        $('hud').classList.remove('hidden');
        try { await playPlan(); }
        catch (e) { console.error('[RealLife] error durant la partida:', e); showError('Ha passat un error inesperat durant la partida.'); }
    }

    async function playPlan() {
        const n = S.plan.length;
        for (let ci = 0; ci < n; ci++) {
            const p = S.plan[ci];
            await chapterIntro(p.ch, ci, n);
            for (const bt of p.beats) await playBeat(bt.b, bt.qs);
        }
        await showEnd();
    }

    async function chapterIntro(ch, idx, n) {
        hidePanel(); hideNameTag(); bars(false);
        $('hudChapter').textContent = 'Capítol ' + (idx + 1) + '/' + n + ' · ' + ch.title;
        await fadeTo(1, idx === 0 ? 600 : 800);
        World.loadSet(ch.set);
        SFX.ambience(World.current.ambience);
        SFX.chapter();
        $('ccKicker').textContent = 'Capítol ' + (idx + 1) + ' de ' + n;
        $('ccTitle').textContent = ch.title;
        $('ccSub').textContent = ch.subtitle || '';
        $('ccIntro').textContent = ch.intro || '';
        const card = $('chapterCard');
        card.classList.remove('hidden');
        requestAnimationFrame(() => card.classList.add('in'));
        await sleep(3200);
        const it = World.current.intro;
        if (it) World.camSnap(it.from.pos, it.from.look);
        card.classList.remove('in');
        await sleep(450);
        card.classList.add('hidden');
        bars(true);
        await fadeTo(0, 900);
        SFX.whoosh();
        await World.introShot();
    }

    async function playBeat(b, qs) {
        const def = Object.assign({}, CHARACTERS[b.npc] || CHARACTERS.rosa);
        const npc = World.spawnNPC(def, b.spot);
        S.npc = npc;
        bars(true);
        const sh = World.shotFor(npc, 'medium');
        const dist = World.camPos.distanceTo(sh.pos);
        await Promise.all([World.camTo(sh.pos, sh.look, clamp(dist / 2.8, 3.2, 7), { walk: true }), npc.arrived]);
        bars(false);
        npc.play('wave', 1.5);
        showNameTag(npc.def);
        await sleep(700);
        for (const q of qs) await askQuestion(q, npc);
        hidePanel(); hideNameTag(); Voice.stopSpeaking();
        npc.play('wave', 1.2);
        await sleep(800);
        const s = npc.spot;
        if (s && s.from) World.removeNPC(npc, [s.from[0], s.from[1]]);
        S.npc = null;
    }

    function chipFor(q) {
        if (q.type === 'match') return ['🖼️', 'Pictomatcher', 'c-blue'];
        if (q.type === 'build') return ['🧩', 'Pictomatcher', 'c-blue'];
        if (q.type === 'emotion') return ['😄', 'Moodfinder', 'c-orange'];
        if (q.type === 'choice') return q.speaker === 'npc' ? ['🗣️', 'Dialogues', 'c-purple'] : ['😄', 'Moodfinder', 'c-orange'];
        return ['🎤', 'Talker', 'c-red'];
    }

    async function askQuestion(q, npc) {
        S.qi++;
        if ($('panel').classList.contains('show')) { hidePanel(); await sleep(260); }
        resetPanel();
        markSeg(S.qi - 1, 'current');

        const def = npc.def;
        const isNpcLine = q.type === 'choice' && q.speaker === 'npc';
        const chip = chipFor(q);
        $('pChip').className = 'chip ' + chip[2];
        $('pChip').textContent = chip[0] + ' ' + chip[1];
        $('pSpeaker').textContent = isNpcLine ? def.name + ' diu:' : (q.type === 'choice' ? 'Què faràs?' : '');
        S.curText = q.type === 'choice' ? q.say : q.prompt;
        S.curVoice = isNpcLine ? def.voice : null;

        npc.setExpression(q.type === 'emotion' ? EMOTIONS[q.emotion].face : (q.expr || 'neutral'));
        const shot = q.type === 'emotion' ? 'face' : 'medium';
        World.camToNPC(npc, shot, shot === 'face' ? 1.5 : 1.1);
        if (q.sign) World.showSign(q.sign, npc);
        bars(false);
        showPanel();

        const textEl = $('pText');
        if (isNpcLine) {
            npc.setTalking(true);
            Voice.say(q.say, def.voice);
            await typeText(textEl, q.say, 34);
            await sleep(150);
            npc.setTalking(false);
        } else {
            await typeText(textEl, S.curText, 70);
        }

        const res = await RENDER[q.type](q, npc);
        await settle(q, npc, res);
    }

    function waitContinue(autoMs) {
        return new Promise(res => {
            const b = $('pNext');
            b.classList.remove('hidden');
            let done = false, t = null;
            const fin = () => { if (done) return; done = true; b.onclick = null; S.enter = null; if (t) clearTimeout(t); res(); };
            b.onclick = () => { SFX.click(); fin(); };
            S.enter = fin;
            if (autoMs) t = setTimeout(fin, autoMs);
        });
    }

    function showFeedback(kind, title, lines, tip) {
        const f = $('pFeedback');
        $('panel').classList.add('answered');
        const icon = kind === 'ok' ? '✅' : kind === 'bad' ? '💡' : '⏭️';
        f.className = 'pfeedback ' + kind;
        f.innerHTML = '<span class="fb-icon">' + icon + '</span><div class="fb-body"><div class="fb-title">' + esc(title) + '</div>' +
            lines.filter(Boolean).map(l => '<div class="fb-text">' + l + '</div>').join('') +
            (tip ? '<div class="fb-tip">💡 ' + esc(tip) + '</div>' : '') + '</div>';
    }

    function buildFeedback(q, res, ok, npc) {
        const nm = npc.def.name;
        const lines = [];
        let title;
        if (ok) {
            title = pick(['Molt bé!', 'Perfecte!', 'Exacte!', 'Genial!']);
            if (q.type === 'choice') lines.push(esc(res.outcome || 'Una molt bona resposta.'));
            else if (q.type === 'match') lines.push('«' + esc(res.correctText) + '» és la resposta correcta.');
            else if (q.type === 'emotion') lines.push(esc(nm) + ' es sent ' + esc(EMOTIONS[q.emotion].label) + ' ' + EMOTIONS[q.emotion].emoji + '.');
            else if (q.type === 'build') lines.push('La frase és correcta.');
            else if (q.type === 'speak') lines.push('Ho has dit molt bé!');
            else lines.push('Has desenvolupat una bona resposta (' + res.words + ' paraules).');
        } else {
            title = pick(['Gairebé!', 'Quasi!', 'Segueix practicant']);
            if (q.type === 'choice') {
                if (res.outcome) lines.push(esc(res.outcome));
                const right = q.options.find(o => o.correct);
                lines.push('Millor opció: «' + esc(right.text) + '»');
            } else if (q.type === 'match') lines.push('La resposta correcta era «' + esc(res.correctText) + '».');
            else if (q.type === 'emotion') lines.push('En realitat es sentia ' + esc(EMOTIONS[q.emotion].label) + ' ' + EMOTIONS[q.emotion].emoji + '.');
            else if (q.type === 'build') lines.push('L\'ordre correcte era: ' + q.order.join(' '));
            else if (q.type === 'speak') lines.push('Havies de dir: «' + esc(q.phrase) + '».');
            else lines.push('Intenta explicar-te una mica més (mínim ' + q.minWords + ' paraules; n\'has dit ' + res.words + ').');
        }
        return { title, lines, tip: !ok && q.tip ? q.tip : null };
    }

    async function settle(q, npc, res) {
        Voice.stopSpeaking(); stopMic();
        World.hideSign();
        lock();
        const cat = catOf(q);

        if (res.skipped) {
            S.results.push({ cat, skipped: true });
            markSeg(S.qi - 1, 'skip');
            updateHUD();
            showFeedback('skip', 'Prova omesa', ['Cap problema! Continuem.'], null);
            npc.play('nod', 1);
            await waitContinue(1600);
            return;
        }

        const ok = !!res.correct;
        S.results.push({ cat, ok });
        markSeg(S.qi - 1, ok ? 'ok' : 'bad');
        S.streak = ok ? S.streak + 1 : 0;
        S.best = Math.max(S.best, S.streak);
        updateHUD();

        const head = World.headPos(npc);
        if (ok) {
            SFX.correct();
            npc.setExpression('happy');
            npc.play(pick(['cheer', 'thumbs', 'nod']), 1.5);
            World.burst(head, ['#4CAF50', '#FFD740', '#ffffff'], 32, 2.4);
            const praises = { 3: '🔥 Ratxa de 3!', 5: '⚡ Imparable!', 8: '🏆 Increïble!', 12: '👑 Llegendari!' };
            if (praises[S.streak]) showPraise(praises[S.streak]);
        } else {
            SFX.wrong();
            npc.setExpression(q.type === 'choice' && res.outcome ? 'sad' : 'worried');
            npc.play(q.type === 'choice' ? 'sad' : 'confused', 1.6);
            World.burst(head, ['#ef5350', '#9e9e9e'], 14, 1.6, 6, 1.0);
        }

        const fb = buildFeedback(q, res, ok, npc);
        showFeedback(ok ? 'ok' : 'bad', fb.title, fb.lines, fb.tip);
        await waitContinue(ok ? 2400 : 0);
    }

    /* ============================================================
       RENDERITZADORS DE PROVES
       ============================================================ */
    const RENDER = {};
    const div = cls => { const d = document.createElement('div'); d.className = cls; return d; };
    function mkBtn(cls, html, onclick) {
        const b = document.createElement('button');
        b.type = 'button'; b.className = cls; b.innerHTML = html;
        if (onclick) b.onclick = onclick;
        return b;
    }
    function revealRight(grid, val) {
        grid.querySelectorAll('button').forEach(b => { if (b.dataset.val === val) b.classList.add('right'); });
    }

    RENDER.match = q => new Promise(resolve => {
        const body = $('pBody');
        const show = div('big-show' + (q.dir === 'word2pic' ? ' is-word' : ''));
        show.textContent = q.show;
        body.appendChild(show);
        const grid = div('opts' + (q.dir === 'word2pic' ? ' emoji-opts' : ''));
        body.appendChild(grid);
        const correct = q.options.find(o => o.correct);
        shuffle(q.options).forEach((o, i) => {
            const b = mkBtn('opt', '<span class="key">' + (i + 1) + '</span><span class="otext">' + esc(o.text) + '</span>', () => {
                SFX.click(); lock();
                b.classList.add(o.correct ? 'right' : 'wrong');
                if (!o.correct) revealRight(grid, correct.text);
                resolve({ correct: o.correct, correctText: correct.text });
            });
            b.dataset.val = o.text;
            grid.appendChild(b);
        });
    });

    RENDER.emotion = q => new Promise(resolve => {
        const body = $('pBody');
        const grid = div('opts emo');
        body.appendChild(grid);
        const others = shuffle(Object.keys(EMOTIONS).filter(k => k !== q.emotion)).slice(0, 3);
        shuffle([q.emotion].concat(others)).forEach((k, i) => {
            const e = EMOTIONS[k];
            const b = mkBtn('opt', '<span class="key">' + (i + 1) + '</span><span class="oemoji">' + e.emoji + '</span><span class="otext">' + esc(e.label) + '</span>', () => {
                SFX.click(); lock();
                const ok = k === q.emotion;
                b.classList.add(ok ? 'right' : 'wrong');
                if (!ok) revealRight(grid, q.emotion);
                resolve({ correct: ok });
            });
            b.dataset.val = k;
            grid.appendChild(b);
        });
    });

    RENDER.choice = q => new Promise(resolve => {
        const body = $('pBody');
        const grid = div('opts list');
        body.appendChild(grid);
        const right = q.options.find(o => o.correct);
        shuffle(q.options).forEach((o, i) => {
            const b = mkBtn('opt', '<span class="key">' + (i + 1) + '</span><span class="otext">' + esc(o.text) + '</span>', () => {
                SFX.click(); Voice.stopSpeaking(); lock();
                b.classList.add(o.correct ? 'right' : 'wrong');
                if (!o.correct) revealRight(grid, right.text);
                resolve({ correct: o.correct, outcome: o.outcome });
            });
            b.dataset.val = o.text;
            grid.appendChild(b);
        });
    });

    RENDER.build = q => new Promise(resolve => {
        const body = $('pBody');
        const sent = div('build-sentence'); sent.textContent = '«' + q.sentence + '»';
        const slots = div('slots'), pool = div('pool'), actions = div('actions');
        body.appendChild(sent); body.appendChild(slots); body.appendChild(pool); body.appendChild(actions);
        const items = shuffle(q.order.concat(q.extras));
        let chosen = [];
        const clear = mkBtn('btn ghost', 'Esborra', () => { chosen = []; render(); });
        const check = mkBtn('btn primary', 'Comprova ✔', () => {
            lock();
            const ok = chosen.every((ci, i) => items[ci] === q.order[i]);
            resolve({ correct: ok });
        });
        function render() {
            slots.innerHTML = '';
            for (let i = 0; i < q.order.length; i++) {
                const has = chosen[i] !== undefined;
                slots.appendChild(mkBtn('slot' + (has ? ' filled' : ''), has ? items[chosen[i]] : '', () => { if (chosen[i] !== undefined) { chosen.splice(i, 1); render(); } }));
            }
            pool.querySelectorAll('.pic').forEach((b, idx) => { const used = chosen.indexOf(idx) >= 0; b.disabled = used; b.classList.toggle('used', used); });
            check.disabled = chosen.length !== q.order.length;
        }
        items.forEach((em, idx) => {
            pool.appendChild(mkBtn('pic', em, () => { if (chosen.length < q.order.length && chosen.indexOf(idx) < 0) { SFX.click(); chosen.push(idx); render(); } }));
        });
        actions.appendChild(clear); actions.appendChild(check);
        render();
    });

    function micError(code) {
        if (code === 'not-allowed' || code === 'service-not-allowed') return 'No tinc permís per usar el micròfon. Permet-lo al navegador o omet la prova.';
        if (code === 'audio-capture') return 'No es troba cap micròfon. Pots ometre la prova.';
        if (code === 'network') return 'Cal connexió a internet per al reconeixement de veu.';
        if (code === 'unsupported') return 'Aquest navegador no admet el reconeixement de veu. Omet la prova.';
        return 'Hi ha hagut un error amb el micròfon. Torna-ho a provar o omet la prova.';
    }

    function wireMic(mic, tr, cfg) {
        const label = mic.textContent;
        let active = false;
        mic.onclick = () => {
            if (active) { if (S.mic) S.mic.stop(); return; }
            SFX.click();
            tr.textContent = 'Escoltant...';
            tr.className = 'transcript live';
            active = true; mic.classList.add('listening'); mic.textContent = '🛑 Atura\'t';
            S.mic = Voice.listen({
                target: cfg.target || null,
                onInterim: t => { tr.textContent = cfg.interim ? cfg.interim(t) : 'Escoltant: ' + t; },
                onEnd: r => {
                    active = false; S.mic = null;
                    mic.classList.remove('listening'); mic.textContent = label; tr.className = 'transcript';
                    if (r.error) { tr.textContent = micError(r.error); return; }
                    if (!r.text) { tr.textContent = 'No he sentit res. Prem el micròfon i torna-ho a provar.'; return; }
                    tr.textContent = 'Has dit: «' + r.text + '»';
                    cfg.onDone(r);
                }
            });
        };
    }

    RENDER.speak = q => new Promise(resolve => {
        const body = $('pBody');
        const ph = div('big-phrase'); ph.textContent = '«' + q.phrase + '»';
        const mic = mkBtn('mic-btn', '🎤 Gravar');
        const tr = div('transcript'); tr.textContent = 'Prem el micròfon i digues la frase. S\'aturarà sola quan la reconegui.';
        const skip = mkBtn('btn ghost small', 'Ometre aquesta prova', () => { stopMic(); resolve({ skipped: true }); });
        body.appendChild(ph); body.appendChild(mic); body.appendChild(tr); body.appendChild(skip);
        wireMic(mic, tr, {
            target: () => q.phrase,
            onDone: r => resolve({ correct: r.matched || Voice.isCloseMatch(r.text, q.phrase), text: r.text })
        });
    });

    RENDER.talk = q => new Promise(resolve => {
        const body = $('pBody');
        const mic = mkBtn('mic-btn', '🎤 Gravar resposta');
        const cnt = div('word-count'); cnt.textContent = '0 / ' + q.minWords + ' paraules';
        const tr = div('transcript'); tr.textContent = 'Prem el micròfon, respon en veu alta i torna a prémer per aturar quan acabis.';
        const skip = mkBtn('btn ghost small', 'Ometre aquesta prova', () => { stopMic(); resolve({ skipped: true }); });
        body.appendChild(mic); body.appendChild(cnt); body.appendChild(tr); body.appendChild(skip);
        wireMic(mic, tr, {
            interim: t => { const n = wordCount(t); cnt.textContent = n + ' / ' + q.minWords + ' paraules'; cnt.classList.toggle('done', n >= q.minWords); return 'Escoltant: ' + t; },
            onDone: r => { const n = wordCount(r.text); resolve({ correct: n >= q.minWords, text: r.text, words: n }); }
        });
    });

    /* ============================================================
       PANTALLA FINAL
       ============================================================ */
    async function showEnd() {
        hidePanel(); hideNameTag(); bars(false);
        $('hud').classList.add('hidden');
        $('praise').classList.remove('go');
        Voice.stopSpeaking();
        const done = S.results.filter(r => !r.skipped);
        const skipped = S.results.length - done.length;
        const ok = done.filter(r => r.ok).length, tot = done.length;
        const pct = tot ? Math.round(ok / tot * 100) : 0;
        const stars = starsFor(pct);
        const rec = saveBest(S.sc.id, pct);

        $('endScenario').textContent = S.sc.emoji + ' ' + S.sc.title;
        const pe = $('endPct');
        pe.textContent = pct + '%';
        pe.className = 'end-pct ' + (pct >= 70 ? 'good' : pct >= 40 ? 'mid' : 'low');
        $('endFrac').textContent = ok + '/' + tot + ' encerts' + (skipped ? ' · ' + skipped + (skipped === 1 ? ' prova omesa' : ' proves omeses') : '');
        $('endStars').innerHTML = [0, 1, 2].map(i => '<span class="star' + (i < stars ? ' on' : '') + '" style="animation-delay:' + (0.4 + i * 0.25) + 's">★</span>').join('');
        $('endBadge').innerHTML = rec.isNew && tot ? '🏅 Nou rècord!' + (rec.prev !== null ? ' <small>(abans: ' + rec.prev + '%)</small>' : '') : '';
        $('endMsg').textContent = pct >= 90 ? 'Increïble! Comuniques amb una gran seguretat.' : pct >= 70 ? 'Molt bé! Ja et defenses de meravella.' : pct >= 40 ? 'Bon intent! Cada partida et fa millorar.' : 'No passa res: practicar és la clau. Torna-ho a provar!';
        $('endStreak').textContent = S.best >= 3 ? '🔥 Millor ratxa: ' + S.best + ' encerts seguits' : '';

        const sk = $('endSkills');
        sk.innerHTML = '';
        CAT_ORDER.forEach(c => {
            const items = done.filter(r => r.cat === c);
            if (!items.length) return;
            const good = items.filter(r => r.ok).length, p = Math.round(good / items.length * 100);
            const row = div('skill');
            row.innerHTML = '<span class="sk-name">' + CAT_ICON[c] + ' ' + c + '</span><span class="sk-bar"><i style="width:' + p + '%"></i></span><span class="sk-val">' + good + '/' + items.length + '</span>';
            sk.appendChild(row);
        });

        SFX.stopAmbience();
        $('screenEnd').classList.remove('hidden');
        requestAnimationFrame(() => $('screenEnd').classList.add('in'));
        if (pct >= 40) SFX.fanfare();
        if (pct >= 70) { World.confetti(); setTimeout(() => World.confetti(), 900); setTimeout(() => World.confetti(), 1900); }
        S.running = false;
    }

    async function backToMenu() {
        $('screenEnd').classList.remove('in');
        await fadeTo(1, 500);
        $('screenEnd').classList.add('hidden');
        World.loadSet('street');
        S.inMenu = true;
        buildMenu();
        $('screenMenu').classList.remove('hidden');
        await fadeTo(0, 700);
    }

    async function replay() {
        $('screenEnd').classList.remove('in');
        await sleep(250);
        $('screenEnd').classList.add('hidden');
        S.running = false;
        startScenario(S.sc);
    }

    /* ============================================================
       INICI
       ============================================================ */
    function onFrame() {
        if (S.inMenu && World.current) {
            const t = World.t, x = 24 + Math.sin(t * 0.07) * 20;
            World.camPos.set(x, 3.6 + Math.sin(t * 0.11) * 0.4, -8.5);
            World.camLook.set(x + 6 * Math.sin(t * 0.05), 3.4, 8);
        }
        const nt = $('nameTag');
        if (S.npc && !nt.classList.contains('hidden')) {
            const p = World.project(World.headPos(S.npc));
            if (p.visible) { nt.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px) translate(-50%,-100%)'; nt.style.opacity = 1; }
            else nt.style.opacity = 0;
        }
    }

    function wireUI() {
        $('btnExit').onclick = () => $('exitModal').classList.add('open');
        $('btnExitNo').onclick = () => $('exitModal').classList.remove('open');
        $('btnExitYes').onclick = () => { window.location.href = MENU_URL; };
        $('menuBack').onclick = () => { window.location.href = MENU_URL; };
        $('btnMenu').onclick = () => { window.location.href = MENU_URL; };
        $('errMenu').onclick = () => { window.location.href = MENU_URL; };
        $('btnReplay').onclick = replay;
        $('btnOthers').onclick = backToMenu;
        $('btnMute').onclick = () => {
            SFX.unlock();
            SFX.setMuted(!SFX.isMuted());
            $('btnMute').textContent = SFX.isMuted() ? '🔇' : '🔊';
        };
        $('pSpeak').onclick = () => { SFX.unlock(); Voice.say(S.curText, S.curVoice || {}); };
        $('pText').onclick = () => { S.typeJob++; };
        document.addEventListener('keydown', e => {
            const modalOpen = $('exitModal').classList.contains('open');
            if (e.key === 'Escape') { $('exitModal').classList.toggle('open'); return; }
            if (modalOpen) return;
            if ((e.key === 'Enter' || e.key === ' ') && S.enter) { e.preventDefault(); S.enter(); return; }
            if (/^[1-9]$/.test(e.key)) {
                const btn = document.querySelectorAll('#pBody .opts .opt')[parseInt(e.key, 10) - 1];
                if (btn && !btn.disabled) btn.click();
            }
        });
    }

    function boot() {
        wireUI();
        if (typeof THREE === 'undefined' || !window.World) {
            showError('No s\'ha pogut carregar el motor 3D (three.js). Cal connexió a internet per descarregar-lo. Comprova-ho i recarrega la pàgina.');
            return;
        }
        if (typeof SCENARIOS === 'undefined' || !SCENARIOS.length) {
            showError('No s\'han pogut carregar els escenaris (data.js).');
            return;
        }
        try { World.init($('stage')); }
        catch (e) { console.error(e); showError('El teu navegador o dispositiu no admet gràfics 3D (WebGL). Prova amb Google Chrome.'); return; }
        World.onFrame = onFrame;
        World.loadSet('street');
        buildMenu();
        $('loading').classList.add('hidden');
        $('screenMenu').classList.remove('hidden');
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();