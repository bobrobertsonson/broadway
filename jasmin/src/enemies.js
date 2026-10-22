// Everyday annoyances. Simple patrol and hop behaviors only.

const KINDS = {
  i: { key: "enemy-inbox", fly: true, speed: 28, range: 40 },
  t: { key: "enemy-subway", speed: 32 },
  l: { key: "enemy-laundry", hop: 170, every: 1.6, speed: 18 },
  a: { key: "enemy-alarm", hop: 240, every: 1.1, speed: 36 },
  e: { key: "enemy-germ", speed: 26 },
  f: { key: "enemy-food", hop: 150, every: 1.4, speed: 22 },
  n: { key: "enemy-cold", fly: true, speed: 22, range: 32 },
};

export const ENEMY_CHARS = Object.keys(KINDS).join("");

export function makeEnemyAnims(scene) {
  for (const k of Object.values(KINDS)) {
    if (scene.anims.exists(k.key)) scene.anims.remove(k.key);
    scene.anims.create({ key: k.key, frames: [{ key: `${k.key}-0` }, { key: `${k.key}-1` }], frameRate: 4, repeat: -1 });
  }
}

export function spawnEnemy(scene, group, ch, x, y) {
  const kind = KINDS[ch];
  const e = group.create(x, y, `${kind.key}-0`);
  e.setOrigin(0.5, 1);
  e.play(kind.key);
  e.kind = kind;
  e.dir = -1;
  e.home = { x, y };
  e.t = Math.random() * 2;
  e.setDepth(8);
  e.body.setSize(e.width - 4, e.height - 2).setOffset(2, 2);
  if (kind.fly) {
    e.body.setAllowGravity(false);
    e.y = y - 4;
  }
  e.setPosition(x, e.y);
  return e;
}

export function updateEnemy(e, dt, layer) {
  const k = e.kind, b = e.body;
  if (!e.active || e.squashed) return;
  e.t += dt;
  if (k.fly) {
    b.setVelocityX(e.dir * k.speed);
    e.y = e.home.y - 4 + Math.sin(e.t * 3) * 5;
    if (e.x < e.home.x - k.range) e.dir = 1;
    if (e.x > e.home.x + k.range) e.dir = -1;
  } else if (k.hop) {
    const grounded = b.blocked.down;
    if (grounded) {
      b.setVelocityX(0);
      if (e.t > k.every) {
        e.t = 0;
        if (!ledgeAhead(e, layer)) e.dir *= -1;
        b.setVelocity(e.dir * k.speed * 2, -k.hop);
      }
    }
    if (b.blocked.left) e.dir = 1;
    if (b.blocked.right) e.dir = -1;
  } else {
    if (b.blocked.left) e.dir = 1;
    if (b.blocked.right) e.dir = -1;
    if (b.blocked.down && !ledgeAhead(e, layer)) e.dir *= -1;
    b.setVelocityX(e.dir * k.speed);
  }
  e.setFlipX(e.dir > 0);
}

// Is there ground in front of this enemy's feet?
function ledgeAhead(e, layer) {
  const x = e.x + e.dir * (e.body.width / 2 + 2);
  const t = layer.getTileAtWorldXY(x, e.body.bottom + 2);
  return !!(t && t.collides);
}

export function squash(scene, e) {
  e.squashed = true;
  e.body.enable = false;
  e.anims.stop();
  scene.tweens.add({ targets: e, scaleY: 0.3, alpha: 0, duration: 260, onComplete: () => e.destroy() });
}
