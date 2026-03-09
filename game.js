const canvas = document.getElementById("game");
const dropItemButton = document.getElementById("drop-item-button");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const COLORS = {
  floorA: "#1a1d23",
  floorB: "#20242c",
  floorC: "#1f2328",
  floorD: "#252129",
  wall: "#343841",
  wallEdge: "#575d68",
  prop: "#5b4d40",
  propEdge: "#8d7561",
  crate: "#6a513a",
  crateEdge: "#aa8363",
  crateBand: "#3b2e22",
  door: "#6e8578",
  doorLocked: "#7f4b4b",
  heal: "#7ed38c",
  mixedHeal: "#8fe6b0",
  ammoPickup: "#d8c48f",
  grenade: "#89d4c3",
  key: "#d5c06f",
  player: "#d4d8e0",
  playerAccent: "#8ed0ff",
  zombie: "#8aa16b",
  zombieDark: "#5d7048",
  bullet: "#ffcb6b",
  uiPanel: "rgba(8, 9, 12, 0.84)",
  uiBorder: "rgba(191, 53, 53, 0.6)",
  health: "#b93d3d",
  healthBack: "#331919",
  ammo: "#d9d7c8",
  warning: "rgba(180, 26, 26, 0.18)",
  shadow: "rgba(0, 0, 0, 0.35)",
  textDim: "#b7bcc6",
  selected: "#d8d2a2",
  explosion: "rgba(255, 183, 77, 0.45)"
};

const PLAYER_SPEED = 175;
const PLAYER_RADIUS = 15;
const PLAYER_MAX_HEALTH = 100;
const STARTING_AMMO = 24;
const BULLET_SPEED = 520;
const BULLET_LIFE = 0.22;
const FIRE_COOLDOWN = 0.26;
const INVENTORY_LIMIT = 3;
const TRANSITION_TIME = 0.32;
const VISION_RADIUS = 220;

const HEALING_VALUES = {
  greenHerb: 35,
  mixedHerbs: 65
};

const GRENADE_DAMAGE = 3;
const GRENADE_RADIUS = 120;
const GRENADE_THROW_DISTANCE = 72;
const EXPLOSION_TIME = 0.18;

const ZOMBIE_SPEED = 62;
const ZOMBIE_RADIUS = 18;
const ZOMBIE_HEALTH = 3;
const ZOMBIE_DETECTION_RANGE = 2000;
const ZOMBIE_ATTACK_RANGE = 24;
const ZOMBIE_ATTACK_DAMAGE = 10;
const ZOMBIE_ATTACK_COOLDOWN = 1.05;

const ICON_PATHS = {
  key: "assets/icons/Brass_Key.png",
  "green-herb": "assets/icons/green-herb.svg?v=20260309b",
  "mixed-herbs": "assets/icons/mixed-herbs.svg?v=20260309b",
  grenade: "assets/icons/Grenade.png",
  ammo: "assets/icons/Ammo.png",
  pistol: "assets/icons/pistol.svg?v=20260309b",
  zombie: "assets/icons/zombie.svg?v=20260309b",
  player: "assets/icons/player.png"
};

const iconImages = {};

function preloadIcons() {
  for (const [key, src] of Object.entries(ICON_PATHS)) {
    const image = new Image();
    image.src = src;
    iconImages[key] = image;
  }
}
const LOOT_TABLE = [
  {
    type: "healing",
    itemId: "green-herb",
    label: "Green Herb",
    amount: HEALING_VALUES.greenHerb,
    weight: 5
  },
  {
    type: "healing",
    itemId: "mixed-herbs",
    label: "Mixed Herbs",
    amount: HEALING_VALUES.mixedHerbs,
    weight: 3
  },
  {
    type: "ammo",
    itemId: "handgun-ammo",
    label: "Handgun Ammo",
    amount: 6,
    weight: 2
  }
];

const ROOMS = {
  foyer: {
    name: "Service Foyer",
    theme: "foyer",
    floorColors: [COLORS.floorA, COLORS.floorB],
    walls: [
      { x: 0, y: 0, w: WIDTH, h: 26 },
      { x: 0, y: HEIGHT - 26, w: WIDTH, h: 26 },
      { x: 0, y: 0, w: 26, h: HEIGHT },
      { x: WIDTH - 26, y: 0, w: 26, h: HEIGHT },
      { x: 250, y: 120, w: 160, h: 30 },
      { x: 250, y: 120, w: 30, h: 150 },
      { x: 620, y: 90, w: 180, h: 30 },
      { x: 770, y: 90, w: 30, h: 180 },
      { x: 420, y: 360, w: 210, h: 30 }
    ],
    props: [
      { x: 120, y: 100, w: 90, h: 60 },
      { x: 125, y: 320, w: 120, h: 70 },
      { x: 700, y: 340, w: 110, h: 90 }
    ],
    doors: [
      {
        id: "foyer-med-door",
        x: WIDTH - 36,
        y: 230,
        w: 10,
        h: 84,
        targetRoom: "treatmentWing",
        targetSpawn: { x: 76, y: 270 },
        locked: true,
        keyId: "brass-key",
        prompt: "Press E to open the treatment wing"
      }
    ],
    items: [
      {
        id: "brass-key",
        type: "key",
        itemId: "brass-key",
        label: "Brass Key",
        x: 184,
        y: 266,
        radius: 12,
        picked: false
      }
    ],
    crates: [
      {
        id: "foyer-crate-1",
        x: 560,
        y: 270,
        w: 38,
        h: 38,
        opened: false,
        forcedLoot: {
          type: "ammo",
          itemId: "handgun-ammo",
          label: "Handgun Ammo",
          amount: 6
        }
      }
    ],
    zombies: [
      { x: 760, y: 190, radius: ZOMBIE_RADIUS, health: ZOMBIE_HEALTH, alive: true, attackTimer: 0 }
    ]
  },
  treatmentWing: {
    name: "Treatment Wing",
    theme: "treatment",
    floorColors: [COLORS.floorC, COLORS.floorD],
    walls: [
      { x: 0, y: 0, w: WIDTH, h: 26 },
      { x: 0, y: HEIGHT - 26, w: WIDTH, h: 26 },
      { x: 0, y: 0, w: 26, h: HEIGHT },
      { x: WIDTH - 26, y: 0, w: 26, h: HEIGHT },
      { x: 200, y: 110, w: 30, h: 230 },
      { x: 200, y: 110, w: 220, h: 30 },
      { x: 500, y: 160, w: 220, h: 30 },
      { x: 500, y: 160, w: 30, h: 180 },
      { x: 310, y: 390, w: 260, h: 30 }
    ],
    props: [
      { x: 90, y: 110, w: 70, h: 120 },
      { x: 610, y: 265, w: 170, h: 70 },
      { x: 340, y: 225, w: 100, h: 85 }
    ],
    doors: [
      {
        id: "treatment-foyer-door",
        x: 26,
        y: 230,
        w: 10,
        h: 84,
        targetRoom: "foyer",
        targetSpawn: { x: WIDTH - 76, y: 270 },
        locked: false,
        prompt: "Press E to return to the foyer"
      },
      {
        id: "treatment-lab-door",
        x: WIDTH - 36,
        y: 214,
        w: 10,
        h: 92,
        targetRoom: "biolab",
        targetSpawn: { x: 76, y: 260 },
        locked: false,
        prompt: "Press E to enter the biolab"
      }
    ],
    items: [],
    crates: [
      {
        id: "wing-crate-1",
        x: 726,
        y: 122,
        w: 38,
        h: 38,
        opened: false,
        forcedLoot: null
      },
      {
        id: "wing-crate-2",
        x: 604,
        y: 356,
        w: 38,
        h: 38,
        opened: false,
        forcedLoot: {
          type: "grenade",
          itemId: "grenade",
          label: "Grenade",
          amount: 1
        }
      },
      {
        id: "wing-crate-3",
        x: 282,
        y: 188,
        w: 38,
        h: 38,
        opened: false,
        forcedLoot: null
      }
    ],
    zombies: [
      { x: 640, y: 430, radius: ZOMBIE_RADIUS, health: ZOMBIE_HEALTH, alive: true, attackTimer: 0 },
      { x: 774, y: 120, radius: ZOMBIE_RADIUS, health: ZOMBIE_HEALTH, alive: true, attackTimer: 0 }
    ]
  },
  biolab: {
    name: "Biolab Vault",
    theme: "biolab",
    floorColors: [COLORS.floorD, COLORS.floorB],
    walls: [
      { x: 0, y: 0, w: WIDTH, h: 26 },
      { x: 0, y: HEIGHT - 26, w: WIDTH, h: 26 },
      { x: 0, y: 0, w: 26, h: HEIGHT },
      { x: WIDTH - 26, y: 0, w: 26, h: HEIGHT },
      { x: 170, y: 120, w: 260, h: 30 },
      { x: 170, y: 120, w: 30, h: 170 },
      { x: 520, y: 100, w: 30, h: 220 },
      { x: 520, y: 100, w: 210, h: 30 },
      { x: 315, y: 390, w: 320, h: 30 }
    ],
    props: [
      { x: 92, y: 360, w: 120, h: 70 },
      { x: 660, y: 352, w: 126, h: 78 },
      { x: 352, y: 230, w: 110, h: 92 }
    ],
    doors: [
      {
        id: "biolab-treatment-door",
        x: 26,
        y: 214,
        w: 10,
        h: 92,
        targetRoom: "treatmentWing",
        targetSpawn: { x: WIDTH - 76, y: 260 },
        locked: false,
        prompt: "Press E to return to the treatment wing"
      }
    ],
    items: [],
    crates: [
      {
        id: "biolab-crate-1",
        x: 240,
        y: 324,
        w: 38,
        h: 38,
        opened: false,
        forcedLoot: null
      },
      {
        id: "biolab-crate-2",
        x: 742,
        y: 150,
        w: 38,
        h: 38,
        opened: false,
        forcedLoot: null
      }
    ],
    zombies: [
      { x: 682, y: 188, radius: ZOMBIE_RADIUS, health: ZOMBIE_HEALTH, alive: true, attackTimer: 0 },
      { x: 252, y: 452, radius: ZOMBIE_RADIUS, health: ZOMBIE_HEALTH, alive: true, attackTimer: 0 },
      { x: 820, y: 412, radius: ZOMBIE_RADIUS, health: ZOMBIE_HEALTH, alive: true, attackTimer: 0 }
    ]
  }
};

const state = {
  keys: {},
  previousKeys: {},
  screen: "title",
  player: {
    x: 110,
    y: 460,
    radius: PLAYER_RADIUS,
    health: PLAYER_MAX_HEALTH,
    ammo: STARTING_AMMO,
    facingX: 1,
    facingY: 0,
    fireTimer: 0,
    inventory: [],
    selectedSlot: 0
  },
  currentRoom: "foyer",
  bullets: [],
  effects: [],
  message: "",
  messageTimer: 0,
  transitionTimer: 0,
  gameOver: false,
  victory: false,
  lastTime: 0,
  audio: {
    context: null,
    master: null,
    unlocked: false,
    zombieGroanTimer: 0
  }
};

function ensureAudio() {
  if (state.audio.context) {
    return state.audio.context;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }

  const context = new AudioContextClass();
  const master = context.createGain();
  master.gain.value = 0.42;
  master.connect(context.destination);

  state.audio.context = context;
  state.audio.master = master;
  return context;
}

function unlockAudio() {
  const context = ensureAudio();
  if (!context) {
    return;
  }

  if (context.state === "suspended") {
    context.resume();
  }

  state.audio.unlocked = true;
}

function playTone(options) {
  const context = ensureAudio();
  if (!context || !state.audio.unlocked) {
    return;
  }

  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();

  oscillator.type = options.type || "sine";
  oscillator.frequency.setValueAtTime(options.frequency || 220, now);
  if (options.frequencyEnd) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(options.frequencyEnd, 0.001), now + (options.duration || 0.2));
  }

  filter.type = options.filterType || "lowpass";
  filter.frequency.setValueAtTime(options.filterFrequency || 1200, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(options.volume || 0.05, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (options.duration || 0.2));

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(state.audio.master);

  oscillator.start(now);
  oscillator.stop(now + (options.duration || 0.2));
}

function playNoise(options) {
  const context = ensureAudio();
  if (!context || !state.audio.unlocked) {
    return;
  }

  const duration = options.duration || 0.12;
  const buffer = context.createBuffer(1, Math.max(1, Math.floor(context.sampleRate * duration)), context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }

  const source = context.createBufferSource();
  source.buffer = buffer;

  const filter = context.createBiquadFilter();
  filter.type = options.filterType || "bandpass";
  filter.frequency.value = options.filterFrequency || 900;

  const gain = context.createGain();
  const now = context.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(options.volume || 0.04, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(state.audio.master);
  source.start(now);
}

function playSound(name) {
  switch (name) {
    case "gunshot":
      playNoise({ duration: 0.08, filterFrequency: 1400, volume: 0.06 });
      playTone({ type: "triangle", frequency: 180, frequencyEnd: 60, duration: 0.12, volume: 0.05, filterFrequency: 900 });
      break;
    case "crateBreak":
      playNoise({ duration: 0.14, filterFrequency: 700, volume: 0.05 });
      playTone({ type: "square", frequency: 160, frequencyEnd: 80, duration: 0.1, volume: 0.03, filterFrequency: 600 });
      break;
    case "pickup":
      playTone({ type: "triangle", frequency: 660, frequencyEnd: 990, duration: 0.16, volume: 0.035, filterFrequency: 1800 });
      break;
    case "unlock":
      playTone({ type: "square", frequency: 420, frequencyEnd: 620, duration: 0.08, volume: 0.03, filterFrequency: 1500 });
      playTone({ type: "triangle", frequency: 620, frequencyEnd: 860, duration: 0.12, volume: 0.025, filterFrequency: 1800 });
      break;
    case "door":
      playTone({ type: "sawtooth", frequency: 120, frequencyEnd: 90, duration: 0.22, volume: 0.03, filterFrequency: 700 });
      break;
    case "heal":
      playTone({ type: "sine", frequency: 360, frequencyEnd: 540, duration: 0.2, volume: 0.03, filterFrequency: 1200 });
      break;
    case "grenade":
      playNoise({ duration: 0.24, filterFrequency: 500, volume: 0.07 });
      playTone({ type: "sawtooth", frequency: 90, frequencyEnd: 30, duration: 0.28, volume: 0.05, filterFrequency: 500 });
      break;
    case "hurt":
      playTone({ type: "square", frequency: 180, frequencyEnd: 110, duration: 0.15, volume: 0.035, filterFrequency: 800 });
      break;
    case "zombie":
      playTone({ type: "sawtooth", frequency: 110, frequencyEnd: 70, duration: 0.45, volume: 0.02, filterFrequency: 500 });
      playNoise({ duration: 0.2, filterFrequency: 320, volume: 0.01 });
      break;
    default:
      break;
  }
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  state.keys[key] = true;

  if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
    event.preventDefault();
  }

  if (key === "enter" && state.screen === "title") {
    startGame();
  }

  if (state.screen === "play") {
    unlockAudio();
  }

  if (key === "r" && (state.gameOver || state.victory)) {
    resetGame();
    state.screen = "play";
  }
});

window.addEventListener("keyup", (event) => {
  state.keys[event.key.toLowerCase()] = false;
});

if (dropItemButton) {
  dropItemButton.addEventListener("click", () => {
    unlockAudio();
    if (state.screen !== "play" || state.gameOver || state.victory) {
      return;
    }
    dropSelectedItem();
  });
}

function cloneRooms() {
  return JSON.parse(JSON.stringify(ROOMS));
}

let world = cloneRooms();

function getCurrentRoom() {
  return world[state.currentRoom];
}

function showMessage(text, duration = 2.2) {
  state.message = text;
  state.messageTimer = duration;
}

function startGame() {
  unlockAudio();
  playSound("pickup");
  resetGame();
  state.screen = "play";
}

function resetGame() {
  world = cloneRooms();
  state.currentRoom = "foyer";
  state.player.x = 110;
  state.player.y = 460;
  state.player.health = PLAYER_MAX_HEALTH;
  state.player.ammo = STARTING_AMMO;
  state.player.facingX = 1;
  state.player.facingY = 0;
  state.player.fireTimer = 0;
  state.player.inventory = [];
  state.player.selectedSlot = 0;
  state.bullets = [];
  state.effects = [];
  state.message = "Search the foyer for a key.";
  state.messageTimer = 3;
  state.transitionTimer = 0;
  state.gameOver = false;
  state.victory = false;
}

function keyDown(...keys) {
  return keys.some((key) => state.keys[key]);
}

function justPressed(key) {
  return !!state.keys[key] && !state.previousKeys[key];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distanceSquared(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function isVisibleToPlayer(x, y, padding = 0) {
  const radius = VISION_RADIUS + padding;
  return distanceSquared(state.player.x, state.player.y, x, y) <= radius * radius;
}

function circleRectCollision(x, y, radius, rect) {
  const nearestX = clamp(x, rect.x, rect.x + rect.w);
  const nearestY = clamp(y, rect.y, rect.y + rect.h);
  const dx = x - nearestX;
  const dy = y - nearestY;
  return dx * dx + dy * dy < radius * radius;
}

function getSolidCrates(room) {
  return room.crates.filter((crate) => !crate.opened);
}

function collidesWithLevel(x, y, radius, room = getCurrentRoom()) {
  for (const wall of [...room.walls, ...room.props, ...getSolidCrates(room)]) {
    if (circleRectCollision(x, y, radius, wall)) {
      return true;
    }
  }
  return false;
}

function moveWithCollision(actor, moveX, moveY, dt, room = getCurrentRoom()) {
  const nextX = actor.x + moveX * dt;
  if (!collidesWithLevel(nextX, actor.y, actor.radius, room)) {
    actor.x = nextX;
  }

  const nextY = actor.y + moveY * dt;
  if (!collidesWithLevel(actor.x, nextY, actor.radius, room)) {
    actor.y = nextY;
  }
}

function hasKey(keyId) {
  return state.player.inventory.some((item) => item.type === "key" && item.itemId === keyId);
}

function findSelectedItem() {
  return state.player.inventory[state.player.selectedSlot] || null;
}

function addInventoryItem(item) {
  if (state.player.inventory.length >= INVENTORY_LIMIT) {
    showMessage("Inventory full.");
    return false;
  }

  state.player.inventory.push({
    type: item.type,
    itemId: item.itemId || null,
    label: item.label,
    amount: item.amount || 0
  });

  if (state.player.inventory.length === 1) {
    state.player.selectedSlot = 0;
  }

  return true;
}

function triggerExplosion(x, y) {
  state.effects.push({ x, y, radius: GRENADE_RADIUS, timer: EXPLOSION_TIME, maxTimer: EXPLOSION_TIME });
}

function dropSelectedItem() {
  const item = findSelectedItem();

  if (!item) {
    showMessage("No item selected.");
    return;
  }

  const room = getCurrentRoom();
  const length = Math.hypot(state.player.facingX, state.player.facingY) || 1;
  const dropDistance = state.player.radius + 20;
  const dropX = clamp(state.player.x + (state.player.facingX / length) * dropDistance, 28, WIDTH - 28);
  const dropY = clamp(state.player.y + (state.player.facingY / length) * dropDistance, 28, HEIGHT - 28);

  room.items.push({
    ...item,
    x: dropX,
    y: dropY,
    radius: item.radius || 12,
    picked: false
  });

  state.player.inventory.splice(state.player.selectedSlot, 1);
  state.player.selectedSlot = clamp(state.player.selectedSlot, 0, Math.max(state.player.inventory.length - 1, 0));
  showMessage(item.label + " dropped.");
}

function useSelectedItem() {
  const item = findSelectedItem();

  if (!item) {
    showMessage("No item selected.");
    return;
  }

  if (item.type === "healing") {
    if (state.player.health >= PLAYER_MAX_HEALTH) {
      showMessage("Health already stable.");
      return;
    }

    state.player.health = Math.min(PLAYER_MAX_HEALTH, state.player.health + item.amount);
    playSound("heal");
    showMessage(`${item.label} used.`);
    state.player.inventory.splice(state.player.selectedSlot, 1);
    state.player.selectedSlot = clamp(state.player.selectedSlot, 0, Math.max(state.player.inventory.length - 1, 0));
    return;
  }

  if (item.type === "grenade") {
    const length = Math.hypot(state.player.facingX, state.player.facingY) || 1;
    const blastX = state.player.x + (state.player.facingX / length) * GRENADE_THROW_DISTANCE;
    const blastY = state.player.y + (state.player.facingY / length) * GRENADE_THROW_DISTANCE;
    const room = getCurrentRoom();

    for (const zombie of room.zombies) {
      if (!zombie.alive) {
        continue;
      }

      if (distanceSquared(blastX, blastY, zombie.x, zombie.y) <= GRENADE_RADIUS * GRENADE_RADIUS) {
        zombie.health -= GRENADE_DAMAGE;
        if (zombie.health <= 0) {
          zombie.alive = false;
        }
      }
    }

    triggerExplosion(blastX, blastY);
    playSound("grenade");
    showMessage("Grenade detonated.");
    state.player.inventory.splice(state.player.selectedSlot, 1);
    state.player.selectedSlot = clamp(state.player.selectedSlot, 0, Math.max(state.player.inventory.length - 1, 0));

    const noThreatsRemain = Object.values(world).every((mapRoom) =>
      mapRoom.zombies.every((enemy) => !enemy.alive)
    );
    if (noThreatsRemain) {
      state.victory = true;
    }
    return;
  }

  showMessage("That item cannot be used here.");
}

function rollLoot() {
  const totalWeight = LOOT_TABLE.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const item of LOOT_TABLE) {
    roll -= item.weight;
    if (roll <= 0) {
      return { ...item };
    }
  }

  return { ...LOOT_TABLE[0] };
}

function createDroppedLoot(loot, x, y) {
  return {
    id: `drop-${Math.random().toString(36).slice(2)}`,
    type: loot.type,
    itemId: loot.itemId || null,
    label: loot.label,
    amount: loot.amount || 0,
    x,
    y,
    radius: 13,
    picked: false
  };
}

function breakCrate(crate, room) {
  if (crate.opened) {
    return;
  }

  crate.opened = true;
  const loot = crate.forcedLoot ? { ...crate.forcedLoot } : rollLoot();
  const drop = createDroppedLoot(loot, crate.x + crate.w / 2, crate.y + crate.h / 2);
  room.items.push(drop);
  playSound("crateBreak");
  showMessage(`${loot.label} dropped from the crate.`);
}

function spawnBullet() {
  if (state.player.ammo <= 0 || state.player.fireTimer > 0 || state.gameOver || state.transitionTimer > 0) {
    return;
  }

  const length = Math.hypot(state.player.facingX, state.player.facingY) || 1;
  const dirX = state.player.facingX / length;
  const dirY = state.player.facingY / length;

  state.bullets.push({
    roomId: state.currentRoom,
    x: state.player.x + dirX * 20,
    y: state.player.y + dirY * 20,
    vx: dirX * BULLET_SPEED,
    vy: dirY * BULLET_SPEED,
    life: BULLET_LIFE
  });

  state.player.ammo -= 1;
  state.player.fireTimer = FIRE_COOLDOWN;
  playSound("gunshot");
}

function transitionToRoom(door) {
  state.currentRoom = door.targetRoom;
  state.player.x = door.targetSpawn.x;
  state.player.y = door.targetSpawn.y;
  state.bullets = [];
  state.transitionTimer = TRANSITION_TIME;
  playSound("door");
  showMessage(world[state.currentRoom].name, 2);
}

function handleDoors() {
  const room = getCurrentRoom();

  for (const door of room.doors) {
    if (!circleRectCollision(state.player.x, state.player.y, state.player.radius + 8, door)) {
      continue;
    }

    const prompt = door.locked ? "Press E to inspect the locked door" : door.prompt;
    showMessage(prompt, 0.15);

    if (!justPressed("e")) {
      return true;
    }

    if (door.locked) {
      if (!hasKey(door.keyId)) {
        showMessage("The door is locked.");
        return true;
      }

      door.locked = false;
      playSound("unlock");
      showMessage("The Brass Key unlocks the door.", 1.4);
    }

    transitionToRoom(door);
    return true;
  }

  return false;
}

function pickupItem(item) {
  if (item.type === "ammo") {
    state.player.ammo += item.amount;
    item.picked = true;
    playSound("pickup");
    showMessage(`Picked up ${item.amount} handgun rounds.`);
    return true;
  }

  if (addInventoryItem(item)) {
    item.picked = true;
    playSound("pickup");
    showMessage(`${item.label} stored.`);
    return true;
  }

  return false;
}

function handleRoomItems() {
  const room = getCurrentRoom();

  for (const item of room.items) {
    if (item.picked) {
      continue;
    }

    const reach = state.player.radius + item.radius + 6;
    if (distanceSquared(state.player.x, state.player.y, item.x, item.y) > reach * reach) {
      continue;
    }

    showMessage(`Press E to pick up ${item.label}`, 0.15);
    if (justPressed("e")) {
      pickupItem(item);
    }
    return true;
  }

  return false;
}

function handleCratePrompt() {
  const room = getCurrentRoom();

  for (const crate of room.crates) {
    if (crate.opened) {
      continue;
    }

    const centerX = crate.x + crate.w / 2;
    const centerY = crate.y + crate.h / 2;
    if (distanceSquared(state.player.x, state.player.y, centerX, centerY) <= 38 * 38) {
      showMessage("A supply crate. One shot should break it.", 0.15);
      return true;
    }
  }

  return false;
}

function handleInteractions() {
  if (handleDoors()) {
    return;
  }

  if (handleRoomItems()) {
    return;
  }

  handleCratePrompt();
}

function updatePlayer(dt) {
  let moveX = 0;
  let moveY = 0;

  if (keyDown("a", "arrowleft")) {
    moveX -= 1;
  }
  if (keyDown("d", "arrowright")) {
    moveX += 1;
  }
  if (keyDown("w", "arrowup")) {
    moveY -= 1;
  }
  if (keyDown("s", "arrowdown")) {
    moveY += 1;
  }

  if (moveX !== 0 || moveY !== 0) {
    const length = Math.hypot(moveX, moveY);
    moveX = (moveX / length) * PLAYER_SPEED;
    moveY = (moveY / length) * PLAYER_SPEED;
    state.player.facingX = moveX;
    state.player.facingY = moveY;
  }

  moveWithCollision(state.player, moveX, moveY, dt);

  if (state.player.fireTimer > 0) {
    state.player.fireTimer -= dt;
  }

  if (justPressed("1")) {
    state.player.selectedSlot = 0;
  }
  if (justPressed("2")) {
    state.player.selectedSlot = 1;
  }
  if (justPressed("3")) {
    state.player.selectedSlot = 2;
  }

  if (justPressed(" ")) {
    spawnBullet();
  }

  if (justPressed("h")) {
    useSelectedItem();
  }

  if (justPressed("q")) {
    dropSelectedItem();
  }

  handleInteractions();
}

function updateBullets(dt) {
  const room = getCurrentRoom();

  for (let index = state.bullets.length - 1; index >= 0; index -= 1) {
    const bullet = state.bullets[index];

    if (bullet.roomId !== state.currentRoom) {
      state.bullets.splice(index, 1);
      continue;
    }

    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;

    if (bullet.life <= 0 || bullet.x < 0 || bullet.y < 0 || bullet.x > WIDTH || bullet.y > HEIGHT) {
      state.bullets.splice(index, 1);
      continue;
    }

    let crateBroken = false;
    for (const crate of room.crates) {
      if (!crate.opened && circleRectCollision(bullet.x, bullet.y, 4, crate)) {
        breakCrate(crate, room);
        state.bullets.splice(index, 1);
        crateBroken = true;
        break;
      }
    }
    if (crateBroken) {
      continue;
    }

    if (collidesWithLevel(bullet.x, bullet.y, 4, room)) {
      state.bullets.splice(index, 1);
      continue;
    }

    for (const zombie of room.zombies) {
      if (!zombie.alive) {
        continue;
      }

      const hitDistance = zombie.radius + 4;
      if (distanceSquared(bullet.x, bullet.y, zombie.x, zombie.y) <= hitDistance * hitDistance) {
        zombie.health -= 1;
        state.bullets.splice(index, 1);

        if (zombie.health <= 0) {
          zombie.alive = false;
          const noThreatsRemain = Object.values(world).every((mapRoom) =>
            mapRoom.zombies.every((enemy) => !enemy.alive)
          );
          if (noThreatsRemain) {
            state.victory = true;
          }
        }
        break;
      }
    }
  }
}

function updateZombies(dt) {
  const room = getCurrentRoom();
  const livingZombies = room.zombies.filter((zombie) => zombie.alive);

  if (livingZombies.length > 0 && state.audio.unlocked) {
    state.audio.zombieGroanTimer -= dt;
    if (state.audio.zombieGroanTimer <= 0) {
      playSound("zombie");
      state.audio.zombieGroanTimer = 4 + Math.random() * 5;
    }
  }

  for (const zombie of room.zombies) {
    if (!zombie.alive) {
      continue;
    }

    const dx = state.player.x - zombie.x;
    const dy = state.player.y - zombie.y;
    const distance = Math.hypot(dx, dy);

    if (zombie.attackTimer > 0) {
      zombie.attackTimer -= dt;
    }

    if (distance < ZOMBIE_DETECTION_RANGE) {
      const dirX = dx / (distance || 1);
      const dirY = dy / (distance || 1);
      moveWithCollision(zombie, dirX * ZOMBIE_SPEED, dirY * ZOMBIE_SPEED, dt, room);
    }

    if (distance <= ZOMBIE_ATTACK_RANGE && zombie.attackTimer <= 0) {
      state.player.health = Math.max(0, state.player.health - ZOMBIE_ATTACK_DAMAGE);
      zombie.attackTimer = ZOMBIE_ATTACK_COOLDOWN;
      playSound("hurt");
      showMessage("The creature tears into you.", 0.8);

      if (state.player.health <= 0) {
        state.gameOver = true;
      }
    }
  }
}

function updateEffects(dt) {
  for (let index = state.effects.length - 1; index >= 0; index -= 1) {
    state.effects[index].timer -= dt;
    if (state.effects[index].timer <= 0) {
      state.effects.splice(index, 1);
    }
  }
}

function update(dt) {
  if (state.screen !== "play") {
    state.previousKeys = { ...state.keys };
    return;
  }

  if (!state.gameOver && !state.victory) {
    if (state.transitionTimer > 0) {
      state.transitionTimer -= dt;
    } else {
      updatePlayer(dt);
      updateBullets(dt);
      updateZombies(dt);
      updateEffects(dt);
    }
  } else {
    updateEffects(dt);
  }

  if (state.messageTimer > 0) {
    state.messageTimer -= dt;
    if (state.messageTimer <= 0) {
      state.message = "";
    }
  }

  state.previousKeys = { ...state.keys };
}

function drawFoyerBackdrop() {
  const wallGradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  wallGradient.addColorStop(0, "#2d2a2a");
  wallGradient.addColorStop(0.35, "#1d191b");
  wallGradient.addColorStop(1, "#111214");
  ctx.fillStyle = wallGradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (let x = 0; x < WIDTH; x += 42) {
    ctx.fillStyle = x % 84 === 0 ? "#322b26" : "#3a312b";
    ctx.fillRect(x, 260, 42, HEIGHT - 260);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.18)";
    ctx.strokeRect(x, 260, 42, HEIGHT - 260);
  }

  ctx.fillStyle = "#5a1420";
  ctx.fillRect(300, 240, 360, 230);
  ctx.strokeStyle = "#8f6d54";
  ctx.lineWidth = 6;
  ctx.strokeRect(300, 240, 360, 230);

  ctx.fillStyle = "rgba(214, 184, 124, 0.08)";
  ctx.beginPath();
  ctx.ellipse(480, 130, 190, 75, 0, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 3; i += 1) {
    const lx = 250 + i * 180;
    const lamp = ctx.createRadialGradient(lx, 92, 8, lx, 92, 88);
    lamp.addColorStop(0, "rgba(255, 215, 150, 0.34)");
    lamp.addColorStop(1, "rgba(255, 215, 150, 0)");
    ctx.fillStyle = lamp;
    ctx.fillRect(lx - 88, 4, 176, 210);
  }
}

function drawTreatmentBackdrop() {
  const base = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  base.addColorStop(0, "#293038");
  base.addColorStop(1, "#171b21");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (let y = 0; y < HEIGHT; y += 36) {
    for (let x = 0; x < WIDTH; x += 36) {
      ctx.fillStyle = (x / 36 + y / 36) % 2 === 0 ? "#b9c3c6" : "#9aa7ad";
      ctx.globalAlpha = 0.08;
      ctx.fillRect(x, y, 36, 36);
    }
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = "rgba(165, 31, 31, 0.12)";
  ctx.fillRect(0, 312, WIDTH, 8);

  const lights = [140, 370, 620, 840];
  for (const lightX of lights) {
    ctx.fillStyle = "#d5e6e2";
    ctx.fillRect(lightX - 44, 34, 88, 10);
    const glow = ctx.createRadialGradient(lightX, 44, 6, lightX, 44, 90);
    glow.addColorStop(0, "rgba(188, 255, 234, 0.22)");
    glow.addColorStop(1, "rgba(188, 255, 234, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(lightX - 90, 20, 180, 160);
  }

  ctx.fillStyle = "rgba(190, 220, 230, 0.14)";
  ctx.fillRect(64, 94, 118, 148);
  ctx.fillRect(582, 250, 210, 94);
}

function drawBiolabBackdrop() {
  const base = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  base.addColorStop(0, "#0e1518");
  base.addColorStop(0.5, "#121d22");
  base.addColorStop(1, "#0a0f14");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (let y = 0; y < HEIGHT; y += 54) {
    for (let x = 0; x < WIDTH; x += 54) {
      ctx.fillStyle = (x / 54 + y / 54) % 2 === 0 ? "rgba(120, 168, 157, 0.05)" : "rgba(54, 91, 100, 0.08)";
      ctx.fillRect(x, y, 54, 54);
    }
  }

  for (let x = 70; x < WIDTH; x += 150) {
    ctx.fillStyle = "rgba(84, 255, 208, 0.08)";
    ctx.fillRect(x, 78, 46, 160);
    const tubeGlow = ctx.createRadialGradient(x + 23, 160, 12, x + 23, 160, 95);
    tubeGlow.addColorStop(0, "rgba(90, 255, 210, 0.28)");
    tubeGlow.addColorStop(1, "rgba(90, 255, 210, 0)");
    ctx.fillStyle = tubeGlow;
    ctx.fillRect(x - 30, 60, 110, 210);
  }

  ctx.fillStyle = "#30383e";
  ctx.fillRect(0, 248, WIDTH, 12);
  for (let x = 0; x < WIDTH; x += 42) {
    ctx.fillStyle = x % 84 === 0 ? "#f1d46d" : "#2f3438";
    ctx.fillRect(x, 248, 21, 12);
  }

  for (let x = 100; x < WIDTH - 60; x += 180) {
    ctx.fillStyle = "rgba(119, 255, 221, 0.16)";
    ctx.fillRect(x, 40, 72, 22);
    ctx.strokeStyle = "rgba(170, 255, 236, 0.32)";
    ctx.strokeRect(x, 40, 72, 22);
  }
}

function drawThemedBackdrop(room) {
  if (room.theme === "foyer") {
    drawFoyerBackdrop();
    return;
  }

  if (room.theme === "treatment") {
    drawTreatmentBackdrop();
    return;
  }

  drawBiolabBackdrop();
}

function drawThemedDetails(room) {
  if (room.theme === "foyer") {
    ctx.fillStyle = "rgba(214, 184, 124, 0.2)";
    ctx.fillRect(452, 84, 56, 18);
    ctx.fillRect(456, 102, 48, 96);
    ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
    ctx.fillRect(306, 246, 348, 218);
    return;
  }

  if (room.theme === "treatment") {
    ctx.fillStyle = "rgba(190, 220, 230, 0.12)";
    ctx.fillRect(84, 116, 82, 24);
    ctx.fillRect(334, 240, 120, 20);
    ctx.fillRect(626, 284, 148, 26);
    ctx.fillStyle = "rgba(115, 255, 197, 0.18)";
    ctx.fillRect(360, 196, 32, 18);
    ctx.fillRect(676, 232, 28, 14);
    return;
  }

  ctx.strokeStyle = "rgba(92, 220, 201, 0.24)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(70, 472);
  ctx.lineTo(180, 392);
  ctx.lineTo(288, 392);
  ctx.lineTo(354, 280);
  ctx.lineTo(470, 280);
  ctx.lineTo(594, 150);
  ctx.lineTo(730, 150);
  ctx.stroke();
}

function setUIFont(size, align = "left") {
  ctx.font = `bold ${size}px "Courier New", monospace`;
  ctx.textAlign = align;
}

function fillPixel(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawGameIcon(kind, x, y, scale = 1, framed = false) {
  const s = scale;

  if (framed) {
    ctx.fillStyle = "rgba(12, 16, 18, 0.88)";
    ctx.beginPath();
    ctx.arc(x, y, 15 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(88, 120, 96, 0.8)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  const image = iconImages[kind];
  if (image && image.complete && image.naturalWidth > 0) {
    const size = framed ? 24 * s : 28 * s;
    ctx.drawImage(image, x - size / 2, y - size / 2, size, size);
    return;
  }

  switch (kind) {
    case "key":
      fillPixel(x - 8 * s, y - 2 * s, 14 * s, 3 * s, "#d9a311");
      fillPixel(x - 2 * s, y - 6 * s, 3 * s, 11 * s, "#f0c62f");
      fillPixel(x + 2 * s, y - 1 * s, 3 * s, 6 * s, "#d99510");
      fillPixel(x + 5 * s, y - 1 * s, 3 * s, 9 * s, "#c4840d");
      ctx.strokeStyle = "#f7da65";
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.arc(x - 9 * s, y - 1 * s, 5 * s, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case "green-herb":
      fillPixel(x - 2 * s, y - 10 * s, 3 * s, 18 * s, "#4dcf2f");
      fillPixel(x - 8 * s, y - 5 * s, 7 * s, 4 * s, "#65e040");
      fillPixel(x - 10 * s, y - 1 * s, 8 * s, 4 * s, "#59c935");
      fillPixel(x + 1 * s, y - 7 * s, 7 * s, 4 * s, "#69e645");
      fillPixel(x + 3 * s, y - 1 * s, 8 * s, 4 * s, "#52be31");
      break;
    case "mixed-herbs":
      drawGameIcon("green-herb", x - 3 * s, y + 1 * s, s * 0.9, false);
      fillPixel(x + 1 * s, y - 10 * s, 3 * s, 18 * s, "#be2b23");
      fillPixel(x + 4 * s, y - 8 * s, 7 * s, 4 * s, "#ea4937");
      fillPixel(x + 5 * s, y - 2 * s, 8 * s, 4 * s, "#d53d30");
      fillPixel(x - 1 * s, y + 2 * s, 7 * s, 4 * s, "#c9312b");
      break;
    case "grenade":
      fillPixel(x - 7 * s, y - 8 * s, 14 * s, 16 * s, "#6c8b31");
      fillPixel(x - 5 * s, y - 10 * s, 10 * s, 3 * s, "#89ab44");
      fillPixel(x - 1 * s, y - 13 * s, 7 * s, 3 * s, "#8a8e92");
      fillPixel(x + 6 * s, y - 11 * s, 3 * s, 10 * s, "#b6bcc0");
      ctx.strokeStyle = "#42561f";
      ctx.lineWidth = 1.5 * s;
      for (let i = -4; i <= 4; i += 4) {
        ctx.beginPath();
        ctx.moveTo(x - 7 * s, y + i * s);
        ctx.lineTo(x + 7 * s, y + i * s);
        ctx.stroke();
      }
      break;
    case "ammo":
      fillPixel(x - 10 * s, y - 7 * s, 18 * s, 12 * s, "#3a2825");
      fillPixel(x - 8 * s, y - 5 * s, 14 * s, 8 * s, "#a32123");
      fillPixel(x + 7 * s, y + 4 * s, 6 * s, 3 * s, "#c27d2f");
      fillPixel(x + 12 * s, y + 4 * s, 3 * s, 3 * s, "#edbf67");
      fillPixel(x - 1 * s, y + 6 * s, 5 * s, 2 * s, "#e2d4ba");
      break;
    case "pistol":
      fillPixel(x - 12 * s, y - 6 * s, 20 * s, 5 * s, "#475056");
      fillPixel(x - 4 * s, y - 1 * s, 11 * s, 4 * s, "#31373b");
      fillPixel(x + 2 * s, y + 2 * s, 6 * s, 10 * s, "#24292d");
      fillPixel(x + 4 * s, y + 10 * s, 4 * s, 3 * s, "#1b1f22");
      fillPixel(x - 10 * s, y - 2 * s, 5 * s, 2 * s, "#69757c");
      break;
    case "zombie":
      fillPixel(x - 7 * s, y - 8 * s, 14 * s, 16 * s, "#8ea17f");
      fillPixel(x - 8 * s, y - 12 * s, 8 * s, 5 * s, "#a23c35");
      fillPixel(x - 4 * s, y - 1 * s, 3 * s, 3 * s, "#210e0a");
      fillPixel(x + 2 * s, y - 1 * s, 3 * s, 3 * s, "#210e0a");
      fillPixel(x - 2 * s, y + 5 * s, 6 * s, 3 * s, "#782118");
      break;
    case "player":
      fillPixel(x - 5 * s, y - 11 * s, 10 * s, 6 * s, "#d4bc98");
      fillPixel(x - 6 * s, y - 5 * s, 12 * s, 10 * s, "#324a6c");
      fillPixel(x - 8 * s, y - 3 * s, 3 * s, 7 * s, "#8d5f45");
      fillPixel(x + 5 * s, y - 3 * s, 3 * s, 7 * s, "#8d5f45");
      fillPixel(x - 5 * s, y + 5 * s, 4 * s, 9 * s, "#1f2430");
      fillPixel(x + 1 * s, y + 5 * s, 4 * s, 9 * s, "#1f2430");
      break;
    default:
      break;
  }
}

function getItemIconKind(item) {
  if (item.type === "key") {
    return "key";
  }
  if (item.type === "grenade") {
    return "grenade";
  }
  if (item.type === "ammo") {
    return "ammo";
  }
  if (item.itemId === "mixed-herbs") {
    return "mixed-herbs";
  }
  return "green-herb";
}
function drawItem(item) {
  drawGameIcon(getItemIconKind(item), item.x, item.y, 0.9, true);
}

function drawRoom() {
  const room = getCurrentRoom();
  drawThemedBackdrop(room);
  drawThemedDetails(room);

  for (const wall of room.walls) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.strokeStyle = COLORS.wallEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(wall.x + 1, wall.y + 1, wall.w - 2, wall.h - 2);
  }

  for (const prop of room.props) {
    if (room.theme === "treatment") {
      ctx.fillStyle = "#85939a";
      ctx.fillRect(prop.x, prop.y, prop.w, prop.h);
      ctx.fillStyle = "rgba(220, 240, 244, 0.12)";
      ctx.fillRect(prop.x + 6, prop.y + 6, prop.w - 12, 14);
      ctx.strokeStyle = "#c4d2d6";
    } else if (room.theme === "biolab") {
      ctx.fillStyle = "#2c3c41";
      ctx.fillRect(prop.x, prop.y, prop.w, prop.h);
      ctx.fillStyle = "rgba(110, 255, 224, 0.15)";
      ctx.fillRect(prop.x + 8, prop.y + 8, prop.w - 16, 18);
      ctx.strokeStyle = "#6cccb7";
    } else {
      ctx.fillStyle = COLORS.prop;
      ctx.fillRect(prop.x, prop.y, prop.w, prop.h);
      ctx.strokeStyle = COLORS.propEdge;
    }

    ctx.lineWidth = 2;
    ctx.strokeRect(prop.x + 1, prop.y + 1, prop.w - 2, prop.h - 2);
  }

  for (const crate of room.crates) {
    const crateCenterX = crate.x + crate.w / 2;
    const crateCenterY = crate.y + crate.h / 2;
    if (!isVisibleToPlayer(crateCenterX, crateCenterY, 20)) {
      continue;
    }

    if (crate.opened) {
      ctx.fillStyle = COLORS.crateBand;
      ctx.fillRect(crate.x + 3, crate.y + 22, crate.w - 6, 10);
      ctx.fillRect(crate.x + 3, crate.y + 8, 10, 8);
      ctx.fillRect(crate.x + crate.w - 13, crate.y + 10, 10, 8);
      continue;
    }

    ctx.fillStyle = COLORS.crate;
    ctx.fillRect(crate.x, crate.y, crate.w, crate.h);
    ctx.strokeStyle = COLORS.crateEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(crate.x + 1, crate.y + 1, crate.w - 2, crate.h - 2);
    ctx.fillStyle = COLORS.crateBand;
    ctx.fillRect(crate.x + 10, crate.y, 6, crate.h);
    ctx.fillRect(crate.x + 22, crate.y, 6, crate.h);
  }

  for (const door of room.doors) {
    ctx.fillStyle = door.locked ? COLORS.doorLocked : COLORS.door;
    ctx.fillRect(door.x, door.y, door.w, door.h);
  }

  for (const item of room.items) {
    if (!item.picked && isVisibleToPlayer(item.x, item.y, item.radius || 0)) {
      drawItem(item);
    }
  }
}

function drawPlayer() {
  ctx.save();
  ctx.translate(state.player.x, state.player.y);

  ctx.fillStyle = COLORS.shadow;
  ctx.beginPath();
  ctx.ellipse(0, 14, 17, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  drawGameIcon("player", 0, 0, 1, false);

  const facingLength = Math.hypot(state.player.facingX, state.player.facingY) || 1;
  ctx.strokeStyle = COLORS.playerAccent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -2);
  ctx.lineTo(
    (state.player.facingX / facingLength) * 20,
    (state.player.facingY / facingLength) * 20
  );
  ctx.stroke();

  ctx.restore();
}

function drawZombies() {
  const room = getCurrentRoom();

  for (const zombie of room.zombies) {
    if (!zombie.alive || !isVisibleToPlayer(zombie.x, zombie.y, zombie.radius)) {
      continue;
    }

    ctx.save();
    ctx.translate(zombie.x, zombie.y);

    ctx.fillStyle = COLORS.shadow;
    ctx.beginPath();
    ctx.ellipse(0, 16, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    drawGameIcon("zombie", 0, -1, 1, false);

    ctx.restore();
  }
}

function drawBullets() {
  ctx.fillStyle = COLORS.bullet;
  for (const bullet of state.bullets) {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEffects() {
  for (const effect of state.effects) {
    const progress = effect.timer / effect.maxTimer;
    ctx.fillStyle = COLORS.explosion;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.radius * (1 - progress * 0.4), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLighting() {
  const gradient = ctx.createRadialGradient(
    state.player.x,
    state.player.y,
    20,
    state.player.x,
    state.player.y,
    220
  );

  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(0.45, "rgba(0, 0, 0, 0.18)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.72)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  if (state.player.health <= 30) {
    ctx.fillStyle = COLORS.warning;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  if (state.transitionTimer > 0) {
    const alpha = clamp(state.transitionTimer / TRANSITION_TIME, 0, 1) * 0.85;
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}

function drawHud() {
  const livingThreats = getCurrentRoom().zombies.filter((zombie) => zombie.alive).length;

  ctx.fillStyle = COLORS.uiPanel;
  ctx.fillRect(18, 18, 255, 110);
  ctx.strokeStyle = COLORS.uiBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, 255, 110);

  ctx.fillStyle = "#ffffff";
  setUIFont(16);
  ctx.fillText("STATUS", 34, 42);

  ctx.fillStyle = COLORS.textDim;
  setUIFont(12);
  ctx.fillText("HP", 34, 68);

  ctx.fillStyle = COLORS.healthBack;
  ctx.fillRect(72, 56, 170, 16);
  ctx.fillStyle = COLORS.health;
  ctx.fillRect(72, 56, 170 * (state.player.health / PLAYER_MAX_HEALTH), 16);

  drawGameIcon("pistol", 47, 96, 0.8, false);
  ctx.fillStyle = COLORS.ammo;
  setUIFont(12);
  ctx.fillText(String(state.player.ammo).padStart(2, "0"), 72, 98);

  drawGameIcon("zombie", 168, 96, 0.72, true);
  ctx.fillStyle = COLORS.textDim;
  ctx.fillText(String(livingThreats), 192, 98);

  ctx.fillStyle = COLORS.uiPanel;
  ctx.fillRect(WIDTH - 302, 18, 284, 152);
  ctx.strokeStyle = COLORS.uiBorder;
  ctx.strokeRect(WIDTH - 302, 18, 284, 152);

  ctx.fillStyle = "#ffffff";
  setUIFont(16);
  ctx.fillText("INVENTORY", WIDTH - 286, 42);

  ctx.fillStyle = COLORS.textDim;
  setUIFont(11);
  ctx.fillText(getCurrentRoom().name.toUpperCase(), WIDTH - 286, 68);

  for (let i = 0; i < INVENTORY_LIMIT; i += 1) {
    const slotX = WIDTH - 286;
    const slotY = 84 + i * 24;
    ctx.fillStyle = i === state.player.selectedSlot ? "rgba(216, 210, 162, 0.12)" : "rgba(255, 255, 255, 0.02)";
    ctx.fillRect(slotX, slotY, 248, 18);
    ctx.strokeStyle = i === state.player.selectedSlot ? COLORS.selected : "rgba(190, 190, 190, 0.28)";
    ctx.strokeRect(slotX, slotY, 248, 18);

    const item = state.player.inventory[i];
    if (item) {
      drawGameIcon(getItemIconKind(item), slotX + 14, slotY + 9, 0.45, false);
      ctx.fillStyle = "#d9ddd8";
      setUIFont(10);
      ctx.fillText(`${i + 1}. ${item.label.toUpperCase()}`, slotX + 28, slotY + 13);
    } else {
      ctx.fillStyle = "rgba(200, 200, 200, 0.25)";
      setUIFont(10);
      ctx.fillText(`${i + 1}. EMPTY`, slotX + 8, slotY + 13);
    }
  }

  ctx.fillStyle = COLORS.uiPanel;
  ctx.fillRect(18, HEIGHT - 72, 470, 40);
  ctx.strokeStyle = COLORS.uiBorder;
  ctx.strokeRect(18, HEIGHT - 72, 470, 40);
  ctx.fillStyle = COLORS.textDim;
  setUIFont(11);
  ctx.fillText((state.message || "Explore carefully.").toUpperCase(), 34, HEIGHT - 46);
}

function drawOverlay(title, subtitle, prompt) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.76)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = COLORS.uiPanel;
  ctx.fillRect(WIDTH / 2 - 260, HEIGHT / 2 - 126, 520, 252);
  ctx.strokeStyle = COLORS.uiBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(WIDTH / 2 - 260, HEIGHT / 2 - 126, 520, 252);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 36px Courier New";
  ctx.textAlign = "center";
  ctx.fillText(title, WIDTH / 2, HEIGHT / 2 - 34);

  ctx.fillStyle = COLORS.textDim;
  ctx.font = "18px Courier New";
  ctx.fillText(subtitle, WIDTH / 2, HEIGHT / 2 + 10);
  ctx.fillText(prompt, WIDTH / 2, HEIGHT / 2 + 52);
  ctx.textAlign = "left";
}

function drawWrappedCenteredText(text, centerX, startY, maxWidth, lineHeight) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  lines.forEach((line, index) => {
    ctx.fillText(line, centerX, startY + index * lineHeight);
  });
}

function render() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  if (state.screen === "title") {
    ctx.fillStyle = "#0b0d11";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const titleGradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    titleGradient.addColorStop(0, "#1b2027");
    titleGradient.addColorStop(1, "#090a0d");
    ctx.fillStyle = titleGradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = "rgba(0, 0, 0, 0.76)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = COLORS.uiPanel;
    ctx.fillRect(WIDTH / 2 - 300, HEIGHT / 2 - 146, 600, 292);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(WIDTH / 2 - 300, HEIGHT / 2 - 146, 600, 292);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 34px Courier New";
    ctx.fillText("Resident Evil: Greened Out", WIDTH / 2, HEIGHT / 2 - 48);

    ctx.fillStyle = COLORS.textDim;
    ctx.font = "17px Courier New";
    drawWrappedCenteredText(
      "Shoot crates for loot, find the key, clear the treatment wing, and survive the biolab.",
      WIDTH / 2,
      HEIGHT / 2 + 8,
      500,
      28
    );

    ctx.font = "bold 18px Courier New";
    ctx.fillText("Press Enter to begin", WIDTH / 2, HEIGHT / 2 + 88);
    ctx.textAlign = "left";
    return;
  }

  drawRoom();
  drawBullets();
  drawZombies();
  drawPlayer();
  drawEffects();
  drawLighting();
  drawHud();

  if (state.gameOver) {
    drawOverlay("Game Over", "Vital signs lost inside the facility.", "Press R to restart the run");
  } else if (state.victory) {
    drawOverlay("Area Secure", "The infected in all three rooms are down.", "Press R to run it again");
  }
}

function frame(timestamp) {
  const dt = Math.min((timestamp - state.lastTime) / 1000 || 0, 0.033);
  state.lastTime = timestamp;

  update(dt);
  render();
  requestAnimationFrame(frame);
}

resetGame();
requestAnimationFrame(frame);
































