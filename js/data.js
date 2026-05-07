// ============================================================
//  data.js — Catálogo estático de Dioses y Tropas
// ============================================================

const GODS = {
  tlaloc: {
    id: 'tlaloc',
    name: 'Tláloc',
    title: 'Señor de la Lluvia y el Rayo',
    emoji: '⚡',
    color: '#29b6f6',
    glowColor: 'rgba(41,182,246,0.55)',
    templeColors: ['#0d3b6e', '#1565c0', '#1e88e5'],
    description: 'Maestro del control de área. Sus lluvias y rayos dominan el campo de batalla.',
    powers: [
      {
        id: 'lluvia_tlaloc',
        name: 'Lluvia de Tláloc',
        emoji: '🌧️',
        cost: 4,
        type: 'zone_dot',
        damage: 18,
        tickRate: 0.6,
        radius: 110,
        duration: 3.5,
        slowFactor: 0.5,
        color: '#29b6f6',
        description: 'Nube que daña y ralentiza en área por 3.5s'
      },
      {
        id: 'xonecuilli',
        name: 'Xonecuilli',
        emoji: '⚡',
        cost: 5,
        type: 'chain_lightning',
        damage: 85,
        chainDamage: 42,
        chainRange: 150,
        color: '#e3f2fd',
        description: 'Rayo masivo que encadena a 1 enemigo cercano'
      }
    ]
  },

  quetzalcoatl: {
    id: 'quetzalcoatl',
    name: 'Quetzalcóatl',
    title: 'La Serpiente Emplumada',
    emoji: '🐍',
    color: '#66bb6a',
    glowColor: 'rgba(102,187,106,0.55)',
    templeColors: ['#1b4332', '#2d6a4f', '#40916c'],
    description: 'Veloz y penetrante. Sus vientos y plumas barren grupos de enemigos.',
    powers: [
      {
        id: 'ehecatl',
        name: 'Ehecatl',
        emoji: '🌬️',
        cost: 3,
        type: 'push_projectile',
        damage: 25,
        speed: 500,
        pushForce: 600,
        slowFactor: 0.65,
        slowDuration: 2.0,
        piercing: true,
        color: '#a5d6a7',
        description: 'Torbellino que atraviesa y empuja toda la línea enemiga hacia atrás'
      },
      {
        id: 'lluvia_plumas',
        name: 'Lluvia de Plumas',
        emoji: '🪶',
        cost: 4,
        type: 'rain_strike',
        count: 5,
        damage: 30,
        speed: 420,
        spreadX: 180,
        color: '#d4a017',
        description: 'Cinco plumas doradas caen desde arriba sobre la formación enemiga'
      }
    ]
  },

  huitzilopochtli: {
    id: 'huitzilopochtli',
    name: 'Huitzilopochtli',
    title: 'Dios del Sol y la Guerra',
    emoji: '☀️',
    color: '#ffa726',
    glowColor: 'rgba(255,167,38,0.55)',
    templeColors: ['#7f1d1d', '#9b2335', '#b91c1c'],
    description: 'Daño puro e implacable. El destructor más agresivo del panteón.',
    powers: [
      {
        id: 'xiuhcoatl',
        name: 'Dardo de Xiuhcóatl',
        emoji: '🔥',
        cost: 4,
        type: 'single_fast',
        damage: 90,
        speed: 720,
        color: '#ff6d00',
        description: 'Lanza solar ultrarrápida de alto daño a un objetivo'
      },
      {
        id: 'nova_solar',
        name: 'Explosión del Quinto Sol',
        emoji: '💥',
        cost: 6,
        type: 'aoe_explosion',
        damage: 175,
        radius: 155,
        fuseTime: 0.9,
        color: '#ffee58',
        description: 'Explosión solar masiva en el campo enemigo'
      }
    ]
  },

  tezcatlipoca: {
    id: 'tezcatlipoca',
    name: 'Tezcatlipoca',
    title: 'Señor del Espejo Humeante',
    emoji: '🌑',
    color: '#ab47bc',
    glowColor: 'rgba(171,71,188,0.55)',
    templeColors: ['#1a0a2e', '#3d1a78', '#6a1b9a'],
    description: 'Engaño y corrupción. Paraliza y debilita al ejército rival.',
    powers: [
      {
        id: 'tezcatl',
        name: 'Tezcatl',
        emoji: '🪞',
        cost: 3,
        type: 'stun_projectile',
        damage: 25,
        speed: 350,
        stunDuration: 4.0,
        splashRadius: 55,
        color: '#ce93d8',
        description: 'Maldición que paraliza a la tropa objetivo (4s) y aturde vecinos cercanos (1s)'
      },
      {
        id: 'navaja_nocturna',
        name: 'Navaja Nocturna',
        emoji: '💀',
        cost: 4,
        type: 'rain_strike',
        count: 3,
        damage: 15,
        speed: 400,
        spreadX: 120,
        debuffOnHit: true,
        debuffDuration: 4.5,
        damageFactor: 0.6,
        color: '#7b1fa2',
        description: 'Tres fragmentos de obsidiana caen sobre la formación enemiga (-40% daño, 4.5s)'
      }
    ]
  }
};

const TROOPS = [
  {
    id: 'macehual',
    name: 'Macehual',
    emoji: '⚔️',
    type: 'melee',
    cost: 1,
    hp: 85,
    damage: 12,
    speed: 65,
    range: 38,
    attackSpeed: 1.0,
    color: '#8d6e63',
    description: 'Guerrero rápido y económico'
  },
  {
    id: 'guerrero_jaguar',
    name: 'G. Jaguar',
    emoji: '🐆',
    type: 'melee',
    cost: 3,
    hp: 260,
    damage: 38,
    speed: 34,
    range: 42,
    attackSpeed: 0.65,
    color: '#f9a825',
    description: 'Tanque de primera línea'
  },
  {
    id: 'guerrero_aguila',
    name: 'G. Águila',
    emoji: '🦅',
    type: 'melee',
    cost: 2,
    hp: 120,
    damage: 22,
    speed: 95,
    range: 38,
    attackSpeed: 1.2,
    color: '#90caf9',
    description: 'Atacante veloz que golpea al frente'
  },
  {
    id: 'arquero',
    name: 'Arquero',
    emoji: '🏹',
    type: 'ranged',
    cost: 2,
    hp: 70,
    damage: 20,
    speed: 38,
    range: 195,
    attackSpeed: 0.9,
    projectileSpeed: 310,
    color: '#a5d6a7',
    description: 'Ataca desde lejos con proyectiles'
  },
  {
    id: 'sacerdote',
    name: 'Sacerdote',
    emoji: '🪄',
    type: 'healer',
    cost: 3,
    hp: 110,
    damage: 0,
    healAmount: 18,
    speed: 40,
    range: 110,
    attackSpeed: 1.0,
    shieldCharges: 2,
    shieldMaxCharges: 2,
    shieldRegenCooldown: 10,
    color: '#ce93d8',
    description: 'Cura tropas aliadas y refleja proyectiles (escudo ×2)'
  },
  {
    id: 'tzompantli',
    name: 'Tzompantli',
    emoji: '💀',
    type: 'turret',
    cost: 4,
    hp: 380,
    damage: 30,
    speed: 0,
    range: 185,
    attackSpeed: 0.6,
    projectileSpeed: 260,
    manaGen: 1,
    manaGenInterval: 5,
    color: '#5d4037',
    description: 'Torreta fija. Genera +1⚡ cada 5s. Máx 5 activas en línea'
  }
];

// Palette de colores para el tema azteca
const THEME = {
  bg:        '#0a0612',
  bgAlt:     '#110920',
  gold:      '#d4a017',
  goldLight: '#f0c040',
  parchment: '#f0e6cc',
  red:       '#8b1a1a',
  surface:   'rgba(20,10,35,0.88)',
  border:    'rgba(212,160,23,0.35)'
};
