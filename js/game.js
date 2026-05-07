// ============================================================
//  game.js — Motor de batalla (Canvas + Game Loop)
// ============================================================

class GameEngine {
  constructor(canvas, p1Config, p2Config, onVictory) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onVictory = onVictory;
    this.running = false;
    this.lastTime = 0;

    // Resize canvas to window
    this._resize();
    window.addEventListener('resize', () => this._resize());

    const W = this.canvas.width;
    const H = this.canvas.height;
    const groundY = H - 145;
    const unitY = groundY - 20;

    // Monuments
    this.monument1 = new Monument(85, groundY, GODS[p1Config.godId], 1);
    this.monument2 = new Monument(W - 85, groundY, GODS[p2Config.godId], 2);

    // Decks
    this.deck1 = new DeckManager(buildDeck(p1Config.deckTroopIds, p1Config.godId));
    this.deck2 = new DeckManager(buildDeck(p2Config.deckTroopIds, p2Config.godId));

    // Mana
    this.mana1 = 5;
    this.mana2 = 5;
    this.maxMana = 10;
    this.manaRegen = 0.5; // per second

    // Units
    this.units1 = []; // player 1 units
    this.units2 = []; // player 2 units
    this.projectiles = [];

    // Spawn positions
    this.spawnX1 = 160;
    this.spawnX2 = W - 160;
    this.unitY = unitY;

    // Background particles
    this.bgParticles = this._initBgParticles(W, H);

    // Game timer
    this.elapsed = 0;

    // Victory flag
    this.gameOver = false;

    // Turret single references removed (now supports multiple up to 5)

    // Key bindings: ZXCV for P1, 1234 for P2
    this._keyHandler = (e) => this._onKey(e);
    window.addEventListener('keydown', this._keyHandler);
  }

  _resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  _initBgParticles(W, H) {
    const particles = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.65,
        r: 0.5 + Math.random() * 1.5,
        alpha: 0.2 + Math.random() * 0.5,
        speed: 5 + Math.random() * 10
      });
    }
    return particles;
  }

  _onKey(e) {
    if (this.gameOver) return;
    const keyMap1 = { 'z': 0, 'x': 1, 'c': 2, 'v': 3 };
    const keyMap2 = { '1': 0, '2': 1, '3': 2, '4': 3 };
    const key = e.key.toLowerCase();
    if (keyMap1[key] !== undefined) this._playCard(1, keyMap1[key]);
    if (keyMap2[key] !== undefined) this._playCard(2, keyMap2[key]);
  }

  _playCard(player, handIndex) {
    const deck = player === 1 ? this.deck1 : this.deck2;
    const hand = deck.getHand();
    if (handIndex >= hand.length) return;
    const card = hand[handIndex];
    const mana = player === 1 ? this.mana1 : this.mana2;
    if (mana < card.cost) return; // Not enough mana

    // Deduct mana
    if (player === 1) this.mana1 -= card.cost;
    else this.mana2 -= card.cost;

    // Pop card from deck
    deck.playCard(handIndex);

    // Determine if it's a troop or power
    const isTroop = !!card.type && ['melee','ranged','healer','turret'].includes(card.type);
    if (isTroop) {
      this._spawnUnit(card, player);
    } else {
      this._castPower(card, player);
    }
  }

  _spawnUnit(data, player) {
    let x = player === 1 ? this.spawnX1 : this.spawnX2;

    if (data.type === 'turret') {
      const activeTurrets = (player === 1 ? this.units1 : this.units2).filter(u => u.type === 'turret' && u.state !== 'dead');
      if (activeTurrets.length >= 5) return; // Limite de 5 torres

      const dir = player === 1 ? 1 : -1;
      // Distancia mayor para exponerlas más, ajustada dinámicamente para no cruzar la mitad
      const spacing = Math.min(85, (this.canvas.width / 2 - 180) / 5); 
      const baseSpawnX = player === 1 ? this.spawnX1 : this.spawnX2;
      const occupiedSlots = activeTurrets.map(t => Math.round(Math.abs(t.x - baseSpawnX) / spacing));
      
      let slot = 0;
      while (occupiedSlots.includes(slot)) {
        slot++;
      }
      x += slot * spacing * dir; // Se desplaza hacia el frente
    }

    const unit = new Unit(data, player, x, this.unitY);

    if (player === 1) {
      this.units1.push(unit);
    } else {
      this.units2.push(unit);
    }
  }

  _castPower(power, player) {
    const W = this.canvas.width;
    // Source position (near own monument)
    const sx = player === 1 ? this.spawnX1 + 20 : this.spawnX2 - 20;
    const sy = this.unitY - 40;

    // Target: nearest enemy unit or midfield
    const enemies = player === 1 ? this.units2 : this.units1;
    const enemyMon = player === 1 ? this.monument2 : this.monument1;
    const dir = player === 1 ? 1 : -1;

    let targetUnit = null;
    let minDist = Infinity;
    for (const u of enemies) {
      if (u.state === 'dead') continue;
      const d = Math.abs(u.x - sx);
      if (d < minDist) { minDist = d; targetUnit = u; }
    }

    const tx = targetUnit ? targetUnit.x : (player === 1 ? W * 0.65 : W * 0.35);
    const ty = targetUnit ? targetUnit.y : this.unitY;

    if (power.type === 'zone_dot') {
      // Place zone at enemy midfield
      const zx = player === 1 ? W * 0.62 : W * 0.38;
      this.projectiles.push(new Projectile({
        type: 'zone_dot',
        x: zx, y: this.unitY,
        color: power.color,
        radius: power.radius,
        zoneDuration: power.duration,
        zoneLife: power.duration,
        zoneDamage: power.damage,
        zoneTickRate: power.tickRate,
        zoneSlow: power.slowFactor,
        owner: player
      }));
    } else if (power.type === 'chain_lightning') {
      // Instant: hit nearest enemy unit
      if (targetUnit) {
        targetUnit.takeDamage(power.damage);
        // Chain to 1 neighbor
        let chainTarget = null;
        let minD2 = power.chainRange;
        for (const u of enemies) {
          if (u === targetUnit || u.state === 'dead') continue;
          const d = Math.sqrt((u.x - targetUnit.x) ** 2 + (u.y - targetUnit.y) ** 2);
          if (d < minD2) { minD2 = d; chainTarget = u; }
        }
        if (chainTarget) chainTarget.takeDamage(power.chainDamage);
        // Visual bolt
        this.projectiles.push(new Projectile({
          type: 'chain_lightning_vfx',
          x: sx, y: sy,
          tx: targetUnit.x, ty: targetUnit.y,
          speed: 9999,
          damage: 0,
          color: power.color,
          owner: player,
          chainTo: chainTarget ? { x: chainTarget.x, y: chainTarget.y } : null
        }));
      } else {
        // Hit monument directly
        enemyMon.takeDamage(power.damage);
      }
    } else if (power.type === 'rain_strike') {
      if (power.id === 'lluvia_plumas') {
        // ── Lluvia de Plumas: diagonal desde el monumento aliado hacia la base enemiga
        const count = power.count || 5;
        const spawnX = player === 1 ? 85 : W - 85; 
        const spawnY = -150; // bien alto sobre el monumento
        const startX = player === 1 ? 300 : W - 300;
        const endX = player === 1 ? (W - 85) : 85; 
        const landY = this.unitY + 40; 

        for (let i = 0; i < count; i++) {
          const t = count === 1 ? 1 : i / (count - 1);
          const px = startX + (endX - startX) * t;

          this.projectiles.push(new Projectile({
            type: 'rain_strike',
            x: spawnX, y: spawnY,
            tx: px, ty: landY,
            speed: power.speed,
            damage: power.damage,
            color: power.color,
            owner: player,
            debuffOnHit:    power.debuffOnHit    || false,
            debuffDuration: power.debuffDuration || 0,
            damageFactor:   power.damageFactor   || 1,
            slowFactor:     power.slowFactor     || 1,
            slowDuration:   power.slowDuration   || 0,
            piercing:       power.piercing       || false,
          }));
        }
      } else {
        // ── Otras lluvias (Navaja Nocturna): caída vertical sobre la formación
        const formationCenterX = targetUnit
          ? targetUnit.x
          : (player === 1 ? W * 0.65 : W * 0.35);
        const count   = power.count   || 5;
        const spreadX = power.spreadX || 160;
        const spawnY  = -60;             
        const landY   = this.unitY + 60; 

        for (let i = 0; i < count; i++) {
          const offset = count === 1
            ? 0
            : (-spreadX / 2) + (spreadX / (count - 1)) * i;
          const px = formationCenterX + offset;
          this.projectiles.push(new Projectile({
            type: 'rain_strike',
            x: px, y: spawnY,
            tx: px, ty: landY,  // puramente vertical
            speed: power.speed,
            damage: power.damage,
            color: power.color,
            owner: player,
            debuffOnHit:    power.debuffOnHit    || false,
            debuffDuration: power.debuffDuration || 0,
            damageFactor:   power.damageFactor   || 1,
            slowFactor:     power.slowFactor     || 1,
            slowDuration:   power.slowDuration   || 0,
            piercing:       power.piercing       || false,
          }));
        }
      }
    } else if (power.type === 'aoe_explosion') {
      const zx = player === 1 ? W * 0.60 : W * 0.40;
      this.projectiles.push(new Projectile({
        type: 'aoe_explosion',
        x: zx, y: this.unitY - 10,
        damage: power.damage,
        radius: power.radius,
        fuseTime: power.fuseTime,
        color: power.color,
        owner: player
      }));
    } else {
      // single_fast, push_projectile, stun_projectile, debuff_projectile
      this.projectiles.push(new Projectile({
        type: power.type,
        x: sx, y: sy,
        tx, ty,
        speed: power.speed,
        damage: power.damage,
        color: power.color,
        owner: player,
        pushForce:      power.pushForce      || 0,
        stunDuration:   power.stunDuration   || 0,
        damageFactor:   power.damageFactor   || 0.5,
        debuffDuration: power.debuffDuration || 0,
        slowFactor:     power.slowFactor     || 1,
        slowDuration:   power.slowDuration   || 0,
        splashRadius:   power.splashRadius   || 0,
        piercing:       power.piercing       || false,
        size: 10
      }));
    }
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this._loop(t));
  }

  stop() {
    this.running = false;
    window.removeEventListener('keydown', this._keyHandler);
  }

  _loop(timestamp) {
    if (!this.running) return;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;
    this.elapsed += dt;
    this._update(dt);
    this._render();
    requestAnimationFrame((t) => this._loop(t));
  }

  _update(dt) {
    if (this.gameOver) return;

    // Mana regen
    this.mana1 = Math.min(this.maxMana, this.mana1 + this.manaRegen * dt);
    this.mana2 = Math.min(this.maxMana, this.mana2 + this.manaRegen * dt);

    // Update monuments
    this.monument1.update(dt);
    this.monument2.update(dt);

    // Update units
    const alive1 = this.units1.filter(u => u.state !== 'dead');
    const alive2 = this.units2.filter(u => u.state !== 'dead');

    for (const u of alive1) {
      u.update(dt, alive1, alive2, this.monument2, this.projectiles);
    }
    for (const u of alive2) {
      u.update(dt, alive2, alive1, this.monument1, this.projectiles);
    }

    // Remove dead units
    this.units1 = this.units1.filter(u => u.state !== 'dead');
    this.units2 = this.units2.filter(u => u.state !== 'dead');

    // Update projectiles
    for (const p of this.projectiles) {
      const isP1Proj = p.owner === 1;
      const enemyUnits = isP1Proj ? this.units2 : this.units1;
      const enemyMon = isP1Proj ? this.monument2 : this.monument1;
      p.update(dt, enemyUnits, enemyMon);
    }
    this.projectiles = this.projectiles.filter(p => p.alive);

    // Turret mana generation for ALL active turrets
    for (const u of alive1) {
      if (u.type === 'turret' && u.data.manaGenInterval) {
        u.manaGenTimer += dt;
        if (u.manaGenTimer >= u.data.manaGenInterval) {
          u.manaGenTimer = 0;
          this.mana1 = Math.min(this.maxMana, this.mana1 + u.data.manaGen);
          u.manaGenFlash = 0.6;
        }
      }
    }
    for (const u of alive2) {
      if (u.type === 'turret' && u.data.manaGenInterval) {
        u.manaGenTimer += dt;
        if (u.manaGenTimer >= u.data.manaGenInterval) {
          u.manaGenTimer = 0;
          this.mana2 = Math.min(this.maxMana, this.mana2 + u.data.manaGen);
          u.manaGenFlash = 0.6;
        }
      }
    }

    // Check victory
    if (this.monument1.destroyed && !this.gameOver) {
      this.gameOver = true;
      setTimeout(() => this.onVictory(2), 1200);
    } else if (this.monument2.destroyed && !this.gameOver) {
      this.gameOver = true;
      setTimeout(() => this.onVictory(1), 1200);
    }
  }

  _render() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const groundY = H - 145;

    // ── Background ──────────────────────────────────────────
    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, '#050210');
    skyGrad.addColorStop(0.6, '#0e0520');
    skyGrad.addColorStop(1, '#1a0a2e');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Stars
    for (const p of this.bgParticles) {
      ctx.globalAlpha = p.alpha * (0.7 + 0.3 * Math.sin(this.elapsed * p.speed * 0.2));
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ── Ground ──────────────────────────────────────────────
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, H);
    groundGrad.addColorStop(0, '#2d1a00');
    groundGrad.addColorStop(0.3, '#3d2200');
    groundGrad.addColorStop(1, '#1a0d00');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, W, H - groundY);

    // Ground line decoration
    ctx.strokeStyle = '#d4a017';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(W, groundY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Aztec ground pattern (subtle)
    ctx.strokeStyle = 'rgba(212,160,23,0.12)';
    ctx.lineWidth = 1;
    const step = 60;
    for (let x = 0; x < W; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x, H);
      ctx.stroke();
    }

    // ── Center dividing line ─────────────────────────────────
    ctx.strokeStyle = 'rgba(212,160,23,0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 10]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, groundY);
    ctx.stroke();
    ctx.setLineDash([]);

    // ── Monuments ──────────────────────────────────────────
    this.monument1.draw(ctx);
    this.monument2.draw(ctx);

    // ── Units ─────────────────────────────────────────────
    for (const u of this.units1) u.draw(ctx);
    for (const u of this.units2) u.draw(ctx);

    // ── Projectiles ─────────────────────────────────────────
    for (const p of this.projectiles) p.draw(ctx);

    // ── HUD overlay ─────────────────────────────────────────
    this._drawHUD(ctx, W, H);
  }

  _drawHUD(ctx, W, H) {
    const hand1 = this.deck1.getHand();
    const hand2 = this.deck2.getHand();
    const keys1 = ['Z','X','C','V'];
    const keys2 = ['1','2','3','4'];
    const cardW = 70, cardH = 90, gap = 8;
    const hudY = H - cardH - 12;

    // ── Player 1 HUD (left) ─────────────────────────────────
    this._drawPlayerHUD(ctx, hand1, keys1, 12, hudY, cardW, cardH, gap,
      this.mana1, this.maxMana, GODS[this.deck1.fullDeck.find(c => c.type && !['melee','ranged','healer','turret'].includes(c.type))?.type] || GODS.tlaloc,
      1, this.monument1.god);

    // ── Player 2 HUD (right) ─────────────────────────────────
    const totalW = 4 * cardW + 3 * gap;
    this._drawPlayerHUD(ctx, hand2, keys2, W - totalW - 12, hudY, cardW, cardH, gap,
      this.mana2, this.maxMana, null, 2, this.monument2.god);

    // ── Timer (center top) ──────────────────────────────────
    const mins = Math.floor(this.elapsed / 60);
    const secs = Math.floor(this.elapsed % 60).toString().padStart(2, '0');
    ctx.fillStyle = 'rgba(10,6,18,0.7)';
    ctx.beginPath();
    ctx.roundRect(W/2 - 40, 10, 80, 28, 8);
    ctx.fill();
    ctx.fillStyle = '#d4a017';
    ctx.font = 'bold 16px "Cinzel", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${mins}:${secs}`, W/2, 24);
  }

  _drawPlayerHUD(ctx, hand, keys, startX, y, cW, cH, gap, mana, maxMana, _unused, player, god) {
    const totalW = 4 * cW + 3 * gap;
    const panelPad = 10;

    // Background panel
    ctx.fillStyle = 'rgba(10,6,18,0.82)';
    ctx.strokeStyle = god.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(startX - panelPad, y - panelPad - 22, totalW + panelPad * 2, cH + panelPad * 2 + 22, 10);
    ctx.fill();
    ctx.stroke();

    // Player label
    ctx.fillStyle = god.color;
    ctx.font = `bold 11px "Cinzel", serif`;
    ctx.textAlign = player === 1 ? 'left' : 'right';
    ctx.textBaseline = 'top';
    const labelX = player === 1 ? startX : startX + totalW;
    ctx.fillText(`${god.emoji} J${player} — ${god.name}`, labelX, y - panelPad - 18);

    // Mana bar
    const manaBarW = totalW;
    const manaBarH = 8;
    const manaY = y - 14;
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.roundRect(startX, manaY, manaBarW, manaBarH, 4);
    ctx.fill();
    const manaFill = (mana / maxMana) * manaBarW;
    const manaGrad = ctx.createLinearGradient(startX, 0, startX + manaFill, 0);
    manaGrad.addColorStop(0, '#1565c0');
    manaGrad.addColorStop(1, '#42a5f5');
    ctx.fillStyle = manaGrad;
    ctx.beginPath();
    ctx.roundRect(startX, manaY, manaFill, manaBarH, 4);
    ctx.fill();
    // Mana text
    ctx.fillStyle = '#90caf9';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`⚡ ${Math.floor(mana)}/${maxMana}`, startX + manaBarW / 2, manaY + manaBarH / 2);

    // Cards
    for (let i = 0; i < 4; i++) {
      const cx = startX + i * (cW + gap);
      const card = hand[i];

      if (!card) {
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.beginPath();
        ctx.roundRect(cx, y, cW, cH, 6);
        ctx.fill();
        continue;
      }

      const isTroop = ['melee','ranged','healer','turret'].includes(card.type);
      const canAfford = mana >= card.cost;

      // Card background
      ctx.fillStyle = canAfford ? 'rgba(25,15,45,0.95)' : 'rgba(15,8,25,0.8)';
      ctx.beginPath();
      ctx.roundRect(cx, y, cW, cH, 6);
      ctx.fill();

      // Border: gold if affordable, dim if not
      ctx.strokeStyle = canAfford
        ? (isTroop ? '#d4a017' : god.color)
        : 'rgba(100,80,50,0.4)';
      ctx.lineWidth = canAfford ? 2 : 1;
      ctx.beginPath();
      ctx.roundRect(cx, y, cW, cH, 6);
      ctx.stroke();

      // Key badge (Top Right)
      const keyBg = canAfford ? 'rgba(212,160,23,0.9)' : '#444';
      ctx.fillStyle = keyBg;
      ctx.beginPath();
      ctx.arc(cx + cW - 12, y + 12, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = canAfford ? '#0a0612' : '#888';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(keys[i], cx + cW - 12, y + 12);

      // Emoji icon
      ctx.font = '22px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = canAfford ? 1 : 0.45;
      ctx.fillText(card.emoji || '❓', cx + cW / 2, y + 40);
      ctx.globalAlpha = 1;

      // Card name
      ctx.fillStyle = canAfford ? '#f0e6cc' : '#666';
      ctx.font = `bold ${card.name.length > 8 ? '8' : '9'}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(card.name, cx + cW / 2, y + 58);

      // Energy cost (Bottom)
      const costColor = canAfford ? '#42a5f5' : '#555';
      ctx.fillStyle = costColor;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`⚡ ${card.cost}`, cx + cW / 2, y + cH - 12);

      // Not-enough-mana overlay
      if (!canAfford) {
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.roundRect(cx, y, cW, cH, 6);
        ctx.fill();
      }
    }
  }
}
