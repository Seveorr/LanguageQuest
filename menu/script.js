let isWelcomePlaying = false;

document.addEventListener('DOMContentLoaded', () => {
    const welcome = document.getElementById('welcome-screen');
    const welcomeCards = [document.getElementById('acc-yes'), document.getElementById('acc-no')];
    const btnConfig = document.getElementById('btn-accessibility');

    // Funció que intenta reproduir i gestiona el bloqueig del navegador
    const safePlay = (key, callback = null) => {
        if (typeof playAudio !== 'function') return;
        
        // Intentem reproduir immediatament
        playAudio(key, callback);
        
        // Si el navegador bloqueja, afegim un listener d'emergència
        // Perquè en el moment que l'usuari faci clic, soni el que estava pendent
        document.addEventListener('click', () => {
            playAudio(key, callback);
        }, { once: true });
    };

    // --- 1. Lògica de Sessió ---
    if (sessionStorage.getItem('ja_vist') === 'true') {
        welcome.style.display = 'none';
        if (localStorage.getItem('accessibility') === 'true') {
            activarAccessibilitat();
        }
    } else {
        // --- 2. Lògica d'entrada ---
        welcome.style.display = 'flex';
        
        const esManual = localStorage.getItem('inici') === 'false';
        const clau = esManual ? 'accessibilitat' : 'benvinguda_accessibilitat';
        
        isWelcomePlaying = true;
        
        // Intentem reproduir (si bloqueja, el safePlay posarà el listener)
        safePlay(clau, () => {
            isWelcomePlaying = false;
            welcomeCards[0].focus();
            safePlay(welcomeCards[0].getAttribute('data-audio'));
        });

        localStorage.removeItem('inici');
    }

    // --- 3. Listeners ---
    welcomeCards.forEach(card => {
        card.addEventListener('focus', () => {
            if (!isWelcomePlaying && document.activeElement === card) {
                safePlay(card.getAttribute('data-audio'));
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (welcome.style.display === 'none') return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            const next = document.activeElement === welcomeCards[0] ? welcomeCards[1] : welcomeCards[0];
            next.focus();
        } else if (e.key === 'Enter') {
            welcome.style.display = 'none';
            sessionStorage.setItem('ja_vist', 'true');
            localStorage.setItem('accessibility', document.activeElement.id === 'acc-yes' ? 'true' : 'false');
            if (localStorage.getItem('accessibility') === 'true') activarAccessibilitat();
        }
    });

    if (btnConfig) {
        btnConfig.addEventListener('click', () => {
            localStorage.setItem('inici', 'false');
            sessionStorage.removeItem('ja_vist');
            location.reload();
        });
    }
});

// --- Funció d'Accessibilitat ---
function activarAccessibilitat() {
    const selectors = ['.title-link', 'a[href*="joc1"]', 'a[href*="joc2"]', 'a[href*="joc3"]', '#btn-accessibility'];
    const elements = selectors.map(s => document.querySelector(s)).filter(e => e !== null);
    let index = 0;

    if (elements.length > 0) {
        elements[index].focus();
        // Aquest àudio sonaria en entrar al menú principal
        if (typeof playAudio === 'function') {
            playAudio('menú-principal', () => {
                playAudio(elements[index].getAttribute('data-audio'));
            });
        }
    }

    // ... (Resta dels listeners igual que abans)
    document.addEventListener('keydown', (e) => {
        if (document.getElementById('welcome-screen').style.display !== 'none') return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            index = (e.key === 'ArrowRight') ? index + 1 : index - 1;
            if (index < 0) index = elements.length - 1;
            if (index >= elements.length) index = 0;
            elements[index].focus();
            playAudio(elements[index].getAttribute('data-audio'));
        } else if (e.key === 'Enter') {
            elements[index].click();
        }
    });
}