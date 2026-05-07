// ============================================================
//  main.js — Controlador de pantallas y estado de la app
// ============================================================

const AppState = {
  screen: 'menu',
  player1: { godId: null, deckTroopIds: [] },
  player2: { godId: null, deckTroopIds: [] },
  engine: null
};

// ─── Screen navigation ────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
  AppState.screen = id;
}

// ─── MENU ─────────────────────────────────────────────────────
function initMenu() {
  document.getElementById('btn-new-game').addEventListener('click', () => {
    showScreen('screen-select-god-p1');
    renderGodSelection(1);
  });

  // ── Back buttons ─────────────────────────────────────────────
  // God P1 → Menú
  document.getElementById('back-god-p1').addEventListener('click', () => {
    showScreen('screen-menu');
  });

  // God P2 → God P1 (J1 re-elige su dios)
  document.getElementById('back-god-p2').addEventListener('click', () => {
    showScreen('screen-select-god-p1');
    renderGodSelection(1);
  });

  // Deck P1 → God P2 (J2 re-elige su dios)
  document.getElementById('back-deck-p1').addEventListener('click', () => {
    showScreen('screen-select-god-p2');
    renderGodSelection(2);
  });

  // Deck P2 → Deck P1 (J1 reconstruye su mazo)
  document.getElementById('back-deck-p2').addEventListener('click', () => {
    AppState.player1.deckTroopIds = [];
    showScreen('screen-deck-p1');
    renderDeckBuilder(1);
  });
}

// ─── GOD SELECTION ────────────────────────────────────────────
function renderGodSelection(player) {
  const container = document.getElementById(`god-grid-p${player}`);
  const title = document.getElementById(`god-select-title-p${player}`);
  const godIds = Object.keys(GODS);

  title.innerHTML = `
    <span class="player-badge p${player}">JUGADOR ${player}</span>
    <br/>Elige tu Dios Patrón
  `;

  container.innerHTML = '';
  godIds.forEach(id => {
    const god = GODS[id];
    const card = document.createElement('div');
    card.className = 'god-card';
    card.style.setProperty('--god-color', god.color);
    card.style.setProperty('--god-glow', god.glowColor);
    card.innerHTML = `
      <div class="god-emoji">${god.emoji}</div>
      <div class="god-name">${god.name}</div>
      <div class="god-title">${god.title}</div>
      <div class="god-desc">${god.description}</div>
      <div class="god-powers">
        <div class="power-pill">${god.powers[0].emoji} ${god.powers[0].name}</div>
        <div class="power-pill">${god.powers[1].emoji} ${god.powers[1].name}</div>
      </div>
    `;
    card.addEventListener('click', () => selectGod(player, id));
    container.appendChild(card);
  });
}

function selectGod(player, godId) {
  if (player === 1) {
    AppState.player1.godId = godId;
    AppState.player1.deckTroopIds = [];
    showScreen('screen-select-god-p2');
    renderGodSelection(2);
  } else {
    AppState.player2.godId = godId;
    AppState.player2.deckTroopIds = [];
    showScreen('screen-deck-p1');
    renderDeckBuilder(1);
  }
}

// ─── POWER TYPE HELPER ───────────────────────────────────────
// Devuelve { icon, label } según el tipo de poder divino
function powerAttackLabel(type) {
  const map = {
    zone_dot:          { icon: '🌀', label: 'Área DoT'        },
    chain_lightning:   { icon: '⚡', label: 'Cadena'          },
    push_projectile:   { icon: '🌬️', label: 'Proyectil'       },
    rain_strike:       { icon: '🌧️', label: 'Lluvia'          },
    single_fast:       { icon: '🎯', label: 'Proyectil'       },
    aoe_explosion:     { icon: '💥', label: 'Explosión Área'  },
    stun_projectile:   { icon: '🎯', label: 'Proyectil'       },
    debuff_projectile: { icon: '🎯', label: 'Proyectil'       },
  };
  return map[type] || { icon: '✨', label: type };
}

// ─── DECK BUILDER ─────────────────────────────────────────────
function renderDeckBuilder(player) {
  const pState = player === 1 ? AppState.player1 : AppState.player2;
  const god = GODS[pState.godId];
  const titleEl = document.getElementById(`deck-title-p${player}`);
  const troopsEl = document.getElementById(`deck-troops-p${player}`);
  const slotsEl = document.getElementById(`deck-slots-p${player}`);
  const powersEl = document.getElementById(`deck-powers-p${player}`);
  const btnEl = document.getElementById(`deck-confirm-p${player}`);

  titleEl.innerHTML = `
    <span class="player-badge p${player}">JUGADOR ${player}</span>
    &nbsp;${god.emoji} ${god.name} — Construye tu Mazo
  `;

  // Show divine powers (locked) — with rich stats
  powersEl.innerHTML = god.powers.map(p => {
    const atk = powerAttackLabel(p.type);
    // Damage display: some powers show per-tick, some total
    let dmgHtml = '';
    if (p.damage > 0) {
      const dmgLabel = p.type === 'zone_dot' ? `${p.damage}/tick` : `${p.damage}`;
      dmgHtml = `<div class="power-stat" title="Daño">🗡️ <span>${dmgLabel}</span></div>`;
    }
    // Chain damage
    const chainHtml = p.chainDamage
      ? `<div class="power-stat" title="Daño en cadena">🔗 <span>${p.chainDamage}</span></div>`
      : '';
    // Radius / duration extra stats
    const radiusHtml = p.radius
      ? `<div class="power-stat" title="Radio">⭕ <span>${p.radius}px</span></div>`
      : '';
    const durationHtml = p.duration
      ? `<div class="power-stat" title="Duración">⏱️ <span>${p.duration}s</span></div>`
      : '';
    const countHtml = p.count
      ? `<div class="power-stat" title="Proyectiles">✕ <span>${p.count}</span></div>`
      : '';
    const stunHtml = p.stunDuration
      ? `<div class="power-stat" title="Stun">💤 <span>${p.stunDuration}s</span></div>`
      : '';
    const splashHtml = p.splashRadius
      ? `<div class="power-stat" title="Radio splash">💥 <span>r=${p.splashRadius}</span></div>`
      : '';
    const debuffHtml = p.debuffDuration
      ? `<div class="power-stat" title="Debuff">🩸 <span>-${Math.round((1-p.damageFactor)*100)}% / ${p.debuffDuration}s</span></div>`
      : '';
    const slowHtml = p.slowDuration
      ? `<div class="power-stat" title="Ralentización">🐢 <span>${Math.round((1-p.slowFactor)*100)}% / ${p.slowDuration}s</span></div>`
      : '';
    const pierceHtml = p.piercing
      ? `<div class="power-stat" title="Atraviesa unidades">🔀 <span>Pierce</span></div>`
      : '';

    return `
    <div class="deck-power-card locked">
      <div class="power-card-header">
        <div class="power-emoji">${p.emoji}</div>
        <div class="power-header-text">
          <div class="power-name">${p.name}</div>
          <div class="power-type-badge">${atk.icon} ${atk.label}</div>
        </div>
        <div class="power-card-right">
          <div class="power-cost">⚡ ${p.cost}</div>
          <div class="power-locked-label">INCLUIDO</div>
        </div>
      </div>
      <div class="power-stats-row">
        ${dmgHtml}${chainHtml}${radiusHtml}${durationHtml}${countHtml}${stunHtml}${splashHtml}${debuffHtml}${slowHtml}${pierceHtml}
      </div>
      <div class="power-desc">${p.description}</div>
    </div>
    `;
  }).join('');

  // Render troop pool
  function refresh() {
    const selected = pState.deckTroopIds;
    troopsEl.innerHTML = TROOPS.map(troop => {
      const count = selected.filter(id => id === troop.id).length;
      const maxed = count >= 2;
      return `
        <div class="troop-card ${maxed ? 'maxed' : ''}" data-id="${troop.id}">
          <div class="troop-emoji">${troop.emoji}</div>
          <div class="troop-name">${troop.name}</div>
          <div class="troop-cost">⚡ ${troop.cost}</div>
          <div class="troop-stats">
            <div title="Puntos de Vida">❤️ ${troop.hp}</div>
            ${troop.damage > 0 ? `<div title="Daño">🗡️ ${troop.damage}</div>` : ''}
            ${troop.healAmount ? `<div title="Curación">💚 ${troop.healAmount}</div>` : ''}
            <div title="Velocidad">🏃 ${troop.speed}</div>
            <div title="Rango">🎯 ${troop.range}</div>
            <div title="Velocidad de Ataque">⏱️ ${troop.attackSpeed}s</div>
            ${troop.shieldCharges ? `<div title="Escudos">🛡️ ${troop.shieldCharges}</div>` : ''}
          </div>
          <div class="troop-desc">${troop.description}</div>
          ${count > 0 ? `<div class="troop-count">×${count}</div>` : ''}
        </div>
      `;
    }).join('');

    // Deck slots (6 slots)
    slotsEl.innerHTML = Array.from({ length: 6 }, (_, i) => {
      const tid = selected[i];
      if (tid) {
        const t = TROOPS.find(t => t.id === tid);
        return `
          <div class="deck-slot filled" data-index="${i}">
            <span class="slot-emoji">${t.emoji}</span>
            <span class="slot-name">${t.name}</span>
            <button class="slot-remove" data-index="${i}">✕</button>
          </div>
        `;
      }
      return `<div class="deck-slot empty"><span>vacío</span></div>`;
    }).join('');

    const count = document.getElementById(`deck-count-p${player}`);
    if (count) count.textContent = `${selected.length}/6 tropas`;

    btnEl.disabled = selected.length < 6;
    btnEl.classList.toggle('ready', selected.length >= 6);

    // Attach events
    troopsEl.querySelectorAll('.troop-card:not(.maxed)').forEach(el => {
      el.addEventListener('click', () => {
        if (pState.deckTroopIds.length >= 6) return;
        pState.deckTroopIds.push(el.dataset.id);
        refresh();
      });
    });

    slotsEl.querySelectorAll('.slot-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.index);
        pState.deckTroopIds.splice(idx, 1);
        refresh();
      });
    });
  }

  refresh();

  // Confirm button
  btnEl.onclick = () => {
    if (player === 1) {
      showScreen('screen-deck-p2');
      renderDeckBuilder(2);
    } else {
      startBattle();
    }
  };
}

// ─── BATTLE ───────────────────────────────────────────────────
function startBattle() {
  showScreen('screen-battle');
  const canvas = document.getElementById('battle-canvas');

  if (AppState.engine) {
    AppState.engine.stop();
    AppState.engine = null;
  }

  AppState.engine = new GameEngine(
    canvas,
    AppState.player1,
    AppState.player2,
    (winner) => showVictory(winner)
  );
  AppState.engine.start();
}

// ─── VICTORY ─────────────────────────────────────────────────
function showVictory(winnerPlayer) {
  if (AppState.engine) AppState.engine.stop();
  showScreen('screen-victory');

  const pState = winnerPlayer === 1 ? AppState.player1 : AppState.player2;
  const god = GODS[pState.godId];

  const msgEl = document.getElementById('victory-msg');
  const godEl = document.getElementById('victory-god');

  msgEl.textContent = `¡JUGADOR ${winnerPlayer} VICTORIOSO!`;
  godEl.innerHTML = `
    <div class="victory-emoji" style="color:${god.color}">${god.emoji}</div>
    <div class="victory-god-name" style="color:${god.color}">${god.name}</div>
    <div class="victory-god-title">${god.title}</div>
  `;

  document.getElementById('btn-rematch').onclick = () => startBattle();
  document.getElementById('btn-menu').onclick = () => {
    if (AppState.engine) { AppState.engine.stop(); AppState.engine = null; }
    showScreen('screen-menu');
  };
}

// ─── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initMenu();
  showScreen('screen-menu');
});
