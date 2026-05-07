// ============================================================
//  entities.js — Clases: Unit, Projectile, Monument
// ============================================================

// ─── MONUMENT ────────────────────────────────────────────────
class Monument {
  constructor(x, groundY, godData, owner) {
    this.x = x;
    this.groundY = groundY;
    this.god = godData;
    this.owner = owner; // 1 or 2
    this.maxHp = 1000;
    this.hp = 1000;
    this.alive = true;
    // Shake effect on hit
    this.shakeTimer = 0;
    this.shakeX = 0;
    // Particles
    this.particles = [];
    this.particleTimer = 0;
    // Destruction
    this.destroyed = false;
    this.destructionPieces = [];
  }

  takeDamage(amount) {
    if (this.destroyed) return;
    this.hp = Math.max(0, this.hp - amount);
    this.shakeTimer = 0.18;
    // Spawn hit particles
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: this.x + (Math.random() - 0.5) * 60,
        y: this.groundY - 60 + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 120,
        vy: -Math.random() * 80,
        life: 0.7,
        maxLife: 0.7,
        color: this.god.color
      });
    }
    if (this.hp <= 0) this._triggerDestruction();
  }

  _triggerDestruction() {
    this.destroyed = true;
    // Create explosion pieces
    for (let i = 0; i < 20; i++) {
      this.destructionPieces.push({
        x: this.x + (Math.random() - 0.5) * 70,
        y: this.groundY - 40 - Math.random() * 60,
        vx: (Math.random() - 0.5) * 250,
        vy: -Math.random() * 300 - 100,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 8,
        w: 8 + Math.random() * 18,
        h: 8 + Math.random() * 18,
        color: this.god.templeColors[Math.floor(Math.random() * this.god.templeColors.length)],
        life: 1.5 + Math.random(),
        maxLife: 1.5 + Math.random()
      });
    }
  }

  update(dt) {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      this.shakeX = this.shakeTimer > 0 ? (Math.random() - 0.5) * 6 : 0;
    }
    // Update particles
    this.particleTimer += dt;
    if (this.particleTimer > 0.4 && !this.destroyed) {
      this.particleTimer = 0;
      const hpPct = this.hp / this.maxHp;
      const count = Math.floor((1 - hpPct) * 3);
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: this.x + (Math.random() - 0.5) * 50,
          y: this.groundY - 70 - Math.random() * 30,
          vx: (Math.random() - 0.5) * 30,
          vy: -40 - Math.random() * 20,
          life: 1.2, maxLife: 1.2,
          color: '#555'
        });
      }
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 60 * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    // Update destruction pieces
    for (let i = this.destructionPieces.length - 1; i >= 0; i--) {
      const p = this.destructionPieces[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 400 * dt;
      p.rot += p.rotSpeed * dt;
      p.life -= dt;
      if (p.life <= 0) this.destructionPieces.splice(i, 1);
    }
  }

  draw(ctx) {
    const dx = this.x + this.shakeX;
    const gy = this.groundY;
    const cols = this.god.templeColors;
    const hpPct = this.hp / this.maxHp;

    // Draw particles first (behind temple)
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha * 0.8;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (this.destroyed) {
      // Draw destruction pieces
      for (const p of this.destructionPieces) {
        const alpha = Math.min(1, p.life / p.maxLife);
        ctx.globalAlpha = alpha;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      return;
    }

    // Aura glow (diminishes with HP)
    const glowAlpha = 0.15 + hpPct * 0.35;
    ctx.save();
    const gradient = ctx.createRadialGradient(dx, gy - 55, 5, dx, gy - 55, 70);
    gradient.addColorStop(0, this.god.glowColor.replace('0.55', String(glowAlpha * 2)));
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(dx, gy - 55, 70, 55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Pyramid levels (3 steps)
    const levels = 3;
    const baseW = 90;
    const stepW = 22;
    const stepH = 28;

    for (let i = 0; i < levels; i++) {
      const lw = baseW - i * stepW;
      const lx = dx - lw / 2;
      const ly = gy - (i + 1) * stepH;

      // Main block
      ctx.fillStyle = cols[Math.min(i, cols.length - 1)];
      ctx.fillRect(lx, ly, lw, stepH);

      // Gold border
      ctx.strokeStyle = '#d4a017';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(lx, ly, lw, stepH);

      // Aztec detail line on each step
      ctx.strokeStyle = 'rgba(212,160,23,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lx + 4, ly + stepH / 2);
      ctx.lineTo(lx + lw - 4, ly + stepH / 2);
      ctx.stroke();
    }

    // Top altar flame / god icon
    const topY = gy - levels * stepH - 4;
    ctx.font = '22px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.god.emoji, dx, topY - 12);

    // Crack overlay based on damage
    if (hpPct < 0.6) {
      ctx.strokeStyle = `rgba(0,0,0,${0.6 - hpPct})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(dx - 10, gy - stepH);
      ctx.lineTo(dx + 5, gy - stepH * 2);
      ctx.lineTo(dx - 5, gy - stepH * 3);
      ctx.stroke();
    }

    // HP Bar
    const barW = 90;
    const barX = dx - barW / 2;
    const barY = gy - levels * stepH - 36;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(barX, barY, barW, 7);
    const hpColor = hpPct > 0.5 ? '#4caf50' : hpPct > 0.25 ? '#ff9800' : '#f44336';
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barW * hpPct, 7);
    ctx.strokeStyle = '#d4a017';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, 7);

    // God name
    ctx.fillStyle = '#d4a017';
    ctx.font = 'bold 10px "Cinzel", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(this.god.name.toUpperCase(), dx, barY - 2);

    // Player label
    ctx.fillStyle = 'rgba(240,230,204,0.6)';
    ctx.font = '9px sans-serif';
    ctx.fillText(`J${this.owner}`, dx, barY - 12);
  }
}

// ─── UNIT ─────────────────────────────────────────────────────
class Unit {
  constructor(data, owner, x, y) {
    this.id = Math.random();
    this.data = data;
    this.type = data.type;
    this.owner = owner; // 1 or 2
    this.x = x;
    this.y = y;
    this.maxHp = data.hp;
    this.hp = data.hp;
    this.damage = data.damage;
    this.speed = data.speed;
    this.range = data.range;
    this.attackSpeed = data.attackSpeed;
    this.attackTimer = 0;
    this.color = data.color;
    this.emoji = data.emoji;
    this.state = 'walking'; // walking | fighting | dead
    this.target = null;
    // Status effects
    this.stunTimer = 0;
    this.damageFactor = 1.0;
    this.debuffTimer = 0;
    this.slowFactor = 1.0;
    this.slowTimer = 0;
    // Visual
    this.hitFlash = 0;
    this.w = 28;
    this.h = 34;
    // Projectiles spawned by ranged/turret
    this.spawnedProjectiles = [];
    // Turret: ensure only 1 active per player
    this.isTurret = data.type === 'turret';
    // Shield (Sacerdote)
    this.shieldCharges = data.shieldCharges || 0;
    this.shieldMaxCharges = data.shieldMaxCharges || 0;
    this.shieldRegenCooldown = data.shieldRegenCooldown || 0;
    this.shieldRegenTimer = 0;
    // Turret mana generation
    this.manaGenTimer = 0;
    this.manaGenFlash = 0; // gold glow when mana is generated
  }

  takeDamage(amount) {
    const dmg = amount;
    this.hp -= dmg;
    this.hitFlash = 0.18;
    if (this.hp <= 0) {
      this.hp = 0;
      this.state = 'dead';
    }
  }

  applyStun(duration) {
    this.stunTimer = Math.max(this.stunTimer, duration);
  }

  applyDamagDebuff(factor, duration) {
    this.damageFactor = factor;
    this.debuffTimer = duration;
  }

  applySlow(factor, duration) {
    this.slowFactor = factor;
    this.slowTimer = duration;
  }

  _getEffectiveSpeed() {
    if (this.slowTimer > 0) return this.speed * this.slowFactor;
    return this.speed;
  }

  _getEffectiveDamage() {
    if (this.debuffTimer > 0) return this.damage * this.damageFactor;
    return this.damage;
  }

  update(dt, friendlyUnits, enemyUnits, enemyMonument, projectilePool) {
    if (this.state === 'dead') return;

    // Timers
    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.manaGenFlash > 0) this.manaGenFlash -= dt;
    if (this.stunTimer > 0) { this.stunTimer -= dt; return; }
    if (this.debuffTimer > 0) this.debuffTimer -= dt;
    if (this.slowTimer > 0) this.slowTimer -= dt;

    // Shield regen (Sacerdote)
    if (this.shieldMaxCharges > 0 && this.shieldCharges < this.shieldMaxCharges && this.shieldRegenTimer > 0) {
      this.shieldRegenTimer -= dt;
      if (this.shieldRegenTimer <= 0) this.shieldCharges = this.shieldMaxCharges;
    }

    const dir = this.owner === 1 ? 1 : -1;

    // Healer logic
    if (this.type === 'healer') {
      this.attackTimer += dt;
      if (this.attackTimer >= 1 / this.attackSpeed) {
        this.attackTimer = 0;
        // Heal nearest friendly below max HP
        let nearest = null;
        let minDist = this.range;
        for (const u of friendlyUnits) {
          if (u === this || u.state === 'dead') continue;
          if (u.hp >= u.maxHp) continue;
          const d = Math.abs(u.x - this.x);
          if (d < minDist) { minDist = d; nearest = u; }
        }
        if (nearest) {
          nearest.hp = Math.min(nearest.maxHp, nearest.hp + this.data.healAmount);
          projectilePool.push(new Projectile({
            type: 'heal_orb', x: this.x, y: this.y,
            tx: nearest.x, ty: nearest.y,
            speed: 200, damage: 0, color: '#ce93d8',
            owner: this.owner
          }));
        }
      }
      // Walk forward only if no enemy unit or enemy monument is blocking the path
      if (this.type !== 'turret') {
        let blockedByEnemy = false;
        for (const u of enemyUnits) {
          if (u.state === 'dead') continue;
          if (Math.abs(u.x - this.x) <= this.range) { blockedByEnemy = true; break; }
        }
        if (!blockedByEnemy && Math.abs(this.x - enemyMonument.x) <= this.range) {
          blockedByEnemy = true;
        }
        if (!blockedByEnemy) this.x += this._getEffectiveSpeed() * dir * dt;
      }
      return;
    }

    // Find nearest enemy unit
    let nearest = null;
    let minDist = Infinity;
    const isEagle = this.data.id === 'guerrero_aguila';
    for (const u of enemyUnits) {
      if (u.state === 'dead') continue;
      if (isEagle && !u.isTurret) continue; // Águila ignora tropas, solo Tzompantli o monumento
      const d = Math.abs(u.x - this.x);
      if (d < minDist) { minDist = d; nearest = u; }
    }

    const monDist = Math.abs(this.x - enemyMonument.x);
    const effectiveTarget = nearest && minDist < monDist ? nearest : null;
    const targetDist = effectiveTarget ? minDist : monDist;
    const inRange = targetDist <= this.range;

    if (inRange) {
      this.state = 'fighting';
      this.attackTimer += dt;
      if (this.attackTimer >= 1 / this.attackSpeed) {
        this.attackTimer = 0;
        const tgt = effectiveTarget || enemyMonument;
        const actualDamage = this._getEffectiveDamage();

        if (this.type === 'ranged' || this.type === 'turret') {
          const tx = tgt instanceof Monument ? tgt.x : tgt.x;
          const ty = tgt instanceof Monument ? tgt.groundY - 50 : tgt.y;
          projectilePool.push(new Projectile({
            type: 'arrow',
            x: this.x, y: this.y - 5,
            tx, ty,
            speed: this.data.projectileSpeed || 300,
            damage: actualDamage,
            color: this.color,
            owner: this.owner,
            targetRef: tgt
          }));
        } else {
          tgt.takeDamage(actualDamage);
        }
      }
    } else {
      this.state = 'walking';
      if (this.type !== 'turret') {
        this.x += this._getEffectiveSpeed() * dir * dt;
      }
    }
  }

  draw(ctx) {
    if (this.state === 'dead') return;
    const x = this.x, y = this.y;
    const hw = this.w / 2, hh = this.h / 2;

    // Turret mana gen glow
    if (this.manaGenFlash > 0) {
      const gAlpha = this.manaGenFlash / 0.6;
      ctx.save();
      ctx.globalAlpha = gAlpha * 0.8;
      ctx.strokeStyle = '#d4a017';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#f0c040';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.roundRect(x - this.w / 2 - 4, y - this.h / 2 - 4, this.w + 8, this.h + 8, 6);
      ctx.stroke();
      ctx.restore();
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y + hh + 2, hw + 2, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    let bodyColor = this.color;
    if (this.hitFlash > 0) bodyColor = '#ffffff';
    if (this.stunTimer > 0) bodyColor = '#ce93d8';
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(x - hw, y - hh, this.w, this.h, 4);
    ctx.fill();

    // Owner tint border
    ctx.strokeStyle = this.owner === 1 ? '#29b6f6' : '#ff7043';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - hw, y - hh, this.w, this.h, 4);
    ctx.stroke();

    // Emoji icon
    ctx.font = '14px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.emoji, x, y);

    // HP bar
    const barW = 30;
    const hpPct = this.hp / this.maxHp;
    ctx.fillStyle = '#111';
    ctx.fillRect(x - 15, y - hh - 7, barW, 4);
    ctx.fillStyle = hpPct > 0.5 ? '#4caf50' : hpPct > 0.25 ? '#ff9800' : '#f44336';
    ctx.fillRect(x - 15, y - hh - 7, barW * hpPct, 4);

    // Stun star
    if (this.stunTimer > 0) {
      ctx.font = '11px serif';
      ctx.textAlign = 'center';
      ctx.fillText('★', x, y - hh - 13);
    }

    // Debuff skull
    if (this.debuffTimer > 0) {
      ctx.font = '10px serif';
      ctx.textAlign = 'center';
      ctx.fillText('💀', x + 10, y - hh - 13);
    }

    // Shield visual (Sacerdote)
    if (this.shieldMaxCharges > 0) {
      if (this.shieldCharges > 0) {
        const pulse = 0.5 + 0.2 * Math.sin(Date.now() * 0.005);
        ctx.save();
        if (this.shieldCharges >= 2) {
          ctx.globalAlpha = pulse * 0.35;
          ctx.strokeStyle = '#ce93d8';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x, y - 2, 26, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = pulse;
        ctx.strokeStyle = '#e040fb';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#ce93d8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x, y - 2, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (this.shieldRegenTimer > 0) {
        const pct = 1 - (this.shieldRegenTimer / this.shieldRegenCooldown);
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = '#9c27b0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y - 2, 20, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}

// ─── PROJECTILE ───────────────────────────────────────────────
class Projectile {
  constructor(cfg) {
    this.type = cfg.type;
    this.x = cfg.x;
    this.y = cfg.y;
    this.tx = cfg.tx || cfg.x;
    this.ty = cfg.ty || cfg.y;
    this.speed = cfg.speed || 300;
    this.damage = cfg.damage || 0;
    this.color = cfg.color || '#fff';
    this.owner = cfg.owner; // 1 or 2
    this.alive = true;
    this.targetRef = cfg.targetRef || null;
    // Compute direction
    const dx = this.tx - this.x;
    const dy = this.ty - this.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    this.vx = (dx / len) * this.speed;
    this.vy = (dy / len) * this.speed;
    // Type-specific
    this.radius = cfg.radius || 0;
    this.pushForce = cfg.pushForce || 0;
    this.stunDuration = cfg.stunDuration || 0;
    this.damageFactor = cfg.damageFactor || 0.5;
    this.debuffDuration = cfg.debuffDuration || 0;
    this.slowFactor = cfg.slowFactor || 0.5;
    this.slowDuration = cfg.slowDuration || 0;
    this.chainDamage = cfg.chainDamage || 0;
    this.chainRange = cfg.chainRange || 0;
    // Zone dot
    this.zoneDuration = cfg.zoneDuration || 0;
    this.zoneLife = cfg.zoneDuration || 0;
    this.zoneDamage = cfg.zoneDamage || 0;
    this.zoneTickRate = cfg.zoneTickRate || 0.6;
    this.zoneTickTimer = 0;
    this.zoneSlow = cfg.zoneSlow || 1;
    // Nova fuse
    this.fuseTime = cfg.fuseTime || 0;
    this.fused = false;
    // Pierce & splash & debuff-on-hit
    this.piercing     = cfg.piercing     || false;
    this.splashRadius = cfg.splashRadius || 0;
    this.debuffOnHit  = cfg.debuffOnHit  || false;
    this.pierced      = new Set(); // IDs de unidades ya golpeadas (para pierce)
    // Heal orb
    this.visual = { trail: [] };
    // Tamaño dinámico basado en daño (mínimo 4px, máximo 80px radio para bolas masivas)
    this.size = this.type === 'heal_orb'
      ? 5
      : Math.max(4, Math.min(80, 3 + Math.sqrt(Math.max(0, this.damage)) * 1.1));
  }

  update(dt, enemyUnits, enemyMonument) {
    if (!this.alive) return;

    if (this.type === 'zone_dot') {
      this.zoneLife -= dt;
      if (this.zoneLife <= 0) { this.alive = false; return; }
      this.zoneTickTimer += dt;
      if (this.zoneTickTimer >= this.zoneTickRate) {
        this.zoneTickTimer = 0;
        for (const u of enemyUnits) {
          if (u.state === 'dead') continue;
          const dist = Math.sqrt((u.x - this.x) ** 2 + (u.y - this.y) ** 2);
          if (dist <= this.radius) {
            u.takeDamage(this.zoneDamage);
            u.applySlow(this.zoneSlow, this.zoneTickRate + 0.1);
          }
        }
      }
      return;
    }

    if (this.type === 'aoe_explosion' && !this.fused) {
      this.fuseTime -= dt;
      if (this.fuseTime <= 0) {
        this.fused = true;
        // Explode
        for (const u of enemyUnits) {
          if (u.state === 'dead') continue;
          const dist = Math.sqrt((u.x - this.x) ** 2 + (u.y - this.y) ** 2);
          if (dist <= this.radius) u.takeDamage(this.damage);
        }
        const monDist = Math.sqrt((enemyMonument.x - this.x) ** 2 + (enemyMonument.groundY - 60 - this.y) ** 2);
        if (monDist <= this.radius) enemyMonument.takeDamage(this.damage * 0.5);
        this.explodeTimer = 0.4;
      }
      return;
    }

    if (this.type === 'aoe_explosion' && this.fused) {
      this.explodeTimer -= dt;
      if (this.explodeTimer <= 0) this.alive = false;
      return;
    }

    // Trail
    this.visual.trail.push({ x: this.x, y: this.y });
    if (this.visual.trail.length > 8) this.visual.trail.shift();

    // Move
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // rain_strike: muere al llegar al suelo
    if (this.type === 'rain_strike' && this.y >= enemyMonument.groundY) {
      this.alive = false;
      return;
    }

    // Check hit on enemy units
    const hitRadius = Math.max(20, this.size * 0.6);
    for (const u of enemyUnits) {
      if (u.state === 'dead') continue;
      if (this.piercing && this.pierced.has(u.id)) continue; // ya golpeado
      const distX = Math.abs(u.x - this.x);
      const distY = Math.abs(u.y - this.y);
      if (distX < hitRadius && distY < 80) {
        const reflected = this._onHitUnit(u, enemyUnits);
        if (reflected) return;
        if (!this.alive) return;    // destruido (no piercing)
        if (!this.piercing) break;  // no-pierce: solo 1 golpe por frame
        // piercing: continuar al siguiente enemigo
      }
    }

    // Check hit on monument
    const monHitRadius = Math.max(45, this.size * 0.6 + 20);
    const mdist = Math.abs(enemyMonument.x - this.x);
    if (mdist < monHitRadius) {
      enemyMonument.takeDamage(this.damage);
      this.alive = false;
    }

    // Out of bounds
    if (this.x < -50 || this.x > 2000 || this.y < -200 || this.y > 1000) {
      this.alive = false;
    }
  }

  _onHitUnit(unit, allEnemies) {
    // ── Priest shield reflection ──────────────────────────────
    const isReflectable = !['zone_dot','aoe_explosion','heal_orb','chain_lightning_vfx','rain_strike'].includes(this.type);
    if (unit.type === 'healer' && unit.shieldCharges > 0 && isReflectable) {
      this.damage = Math.ceil(this.damage * 1.5); // +50% acumulativo
      // Actualizar el tamaño para que crezca exponencialmente con el daño
      this.size = Math.max(4, Math.min(80, 3 + Math.sqrt(this.damage) * 1.1));
      this.owner = this.owner === 1 ? 2 : 1;      // cambia propietario
      this.vx *= -1;                               // rebota horizontalmente
      this.vy = 0;                                 // estabiliza altura para evitar desvío
      this.y = unit.y - 15;                        // centra en el escudo
      unit.shieldCharges -= 1;
      if (unit.shieldCharges <= 0 && unit.shieldRegenCooldown > 0) {
        unit.shieldRegenTimer = unit.shieldRegenCooldown;
      }
      unit.hitFlash = 0.15;
      return true; // fue reflejado, mantener vivo
    }
    const hpBefore = unit.hp; // capturar HP antes del golpe para calcular overkill
    unit.takeDamage(this.damage);
    if (this.type === 'stun_projectile') unit.applyStun(this.stunDuration);
    if (this.type === 'debuff_projectile') unit.applyDamagDebuff(this.damageFactor, this.debuffDuration);
    if (this.type === 'push_projectile') {
      const dir = this.owner === 1 ? -1 : 1;
      unit.x += dir * this.pushForce * 0.08;
    }
    // Slow on hit (Ehecatl)
    if (this.slowDuration > 0) unit.applySlow(this.slowFactor, this.slowDuration);
    // Debuff on hit (Navaja Nocturna rain_strike)
    if (this.debuffOnHit) unit.applyDamagDebuff(this.damageFactor, this.debuffDuration);
    // Splash stun (Tezcatl)
    if (this.splashRadius > 0) {
      for (const u2 of allEnemies) {
        if (u2 === unit || u2.state === 'dead') continue;
        const d = Math.sqrt((u2.x - unit.x) ** 2 + (u2.y - unit.y) ** 2);
        if (d <= this.splashRadius) {
          u2.takeDamage(Math.round(this.damage * 0.4));
          u2.applyStun(1.0);
        }
      }
    }
    if (this.type === 'chain_lightning') {
      let chainTarget = null;
      let minD = this.chainRange;
      for (const u2 of allEnemies) {
        if (u2 === unit || u2.state === 'dead') continue;
        const d = Math.sqrt((u2.x - unit.x) ** 2 + (u2.y - unit.y) ** 2);
        if (d < minD) { minD = d; chainTarget = u2; }
      }
      if (chainTarget) chainTarget.takeDamage(this.chainDamage);
    }
    // True pierce: mantener proyectil vivo, marcar unidad como golpeada
    if (this.piercing) {
      this.pierced.add(unit.id);
      return false;
    }
    // ── Overkill pierce ───────────────────────────────────────────
    const noPierce = ['zone_dot','aoe_explosion','heal_orb','chain_lightning_vfx','chain_lightning'];
    if (!noPierce.includes(this.type) && unit.state === 'dead' && this.damage > hpBefore) {
      const overkill = this.damage - hpBefore;
      this.damage = overkill;
      this.size = Math.max(4, Math.min(80, 3 + Math.sqrt(overkill) * 1.1));
      return false; // sigue vivo (pierce), this.alive no cambia
    }
    this.alive = false;
    return false; // no fue reflejado
  }

  draw(ctx) {
    if (!this.alive) return;

    if (this.type === 'zone_dot') {
      const alpha = Math.min(1, this.zoneLife / (this.zoneDuration || 3.5));
      ctx.save();
      ctx.globalAlpha = 0.22 * alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, this.radius, this.radius * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.55 * alpha;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, this.radius, this.radius * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      // Rain drops
      ctx.fillStyle = this.color;
      ctx.globalAlpha = 0.7 * alpha;
      for (let i = 0; i < 5; i++) {
        const rx = this.x + (Math.random() - 0.5) * this.radius * 2;
        const ry = this.y + (Math.random() - 0.5) * this.radius * 0.8;
        ctx.fillRect(rx, ry, 2, 7);
      }
      ctx.globalAlpha = 1;
      return;
    }

    if (this.type === 'aoe_explosion') {
      if (this.fused) {
        const t = Math.max(0, this.explodeTimer / 0.4);
        ctx.save();
        ctx.globalAlpha = t;
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * (1.2 - t * 0.3));
        g.addColorStop(0, '#fff9c4');
        g.addColorStop(0.3, this.color);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * (1.2 - t * 0.3), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        // Fuse indicator (pulsing ball)
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 12 + Math.sin(Date.now() * 0.01) * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      return;
    }

    // rain_strike: proyectil cayendo (diagonal o vertical según su vx/vy)
    if (this.type === 'rain_strike') {
      const angle = Math.atan2(this.vy, this.vx);
      
      // Estela
      for (let i = 0; i < this.visual.trail.length; i++) {
        const t = this.visual.trail[i];
        const alpha = (i / this.visual.trail.length) * 0.45;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.rotate(angle);
        ctx.fillRect(-4, -2, 8, 4); // Dibujado horizontalmente (luego rotado)
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      
      // Cuerpo principal
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(angle);
      
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      // Dibujar como una barra alargada en el eje X
      ctx.roundRect(-12, -3, 20, 6, 3);
      ctx.fill();
      
      // Punta brillante adelante
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.arc(6, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      return;
    }

    // Trail (horizontal / otros proyectiles)
    for (let i = 0; i < this.visual.trail.length; i++) {
      const t = this.visual.trail[i];
      const alpha = (i / this.visual.trail.length) * 0.5;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(t.x, t.y, (this.size * i) / this.visual.trail.length, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Main orb
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}
