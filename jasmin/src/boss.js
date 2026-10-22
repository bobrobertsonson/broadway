// The fire boss. Comic, not scary. It needs the whole family:
// Andrew's boost reaches the high windows, Isaac (Jennifer) reveals the valves,
// Nube's cloud rains on the fire when a valve opens, and Jennifer blocks embers
// while Isaac is near the family. Three valves = fire out.

import { ui } from "./ui.js";
import { sfx } from "./audio.js";
import { t } from "./content.js";

const REVEAL = 96;          // px from Isaac
const SHIELD = 30;          // ember blocked within this distance of Isaac
const SHIELD_FAMILY = 44;   // Isaac counts as "near the family" within this of Jasmin
const SPIT_EVERY = 1.7;

export class Boss {
  constructor(level, x, y) {
    this.level = level;
    this.valves = [];
    this.opened = 0;
    this.size = 1;
    this.t = 0;
    this.spit = 2.5;
    this.done = false;
    if (!level.anims.exists("boss-fire")) {
      level.anims.create({ key: "boss-fire", frames: [0, 1, 2].map((i) => ({ key: `boss-fire-${i}` })), frameRate: 6, repeat: -1 });
    }
    this.fire = level.physics.add.sprite(x, y, "boss-fire-0").setOrigin(0.5, 1).setDepth(7).play("boss-fire");
    this.fire.body.setAllowGravity(false).setImmovable(true);
    this.fire.body.setSize(40, 48).setOffset(12, 16);
    this.embers = level.physics.add.group();
    level.physics.add.collider(this.embers, level.layer, (e) => this.fizzle(e));
    level.physics.add.overlap(level.player.sprite, this.embers, (_p, e) => this.hitPlayer(e));
    level.physics.add.overlap(level.player.sprite, this.fire, () => this.touchFire());
  }

  addValve(x, y) {
    const v = this.level.add.image(x, y, "prop-valve-0").setOrigin(0.5, 1).setDepth(6).setAlpha(0);
    v.revealed = false;
    v.open = false;
    this.valves.push(v);
  }

  intro() {
    ui.caption("", t(this.level.level.bossIntroCaption), 4000);
  }

  update(dt) {
    if (this.done) return;
    const L = this.level, p = L.player.sprite;
    this.t += dt;

    // The fire slowly grows (until the cloud knocks it back).
    this.size = Math.min(1.7, this.size + dt * 0.02);
    this.fire.setScale(this.size + Math.sin(this.t * 6) * 0.03);

    // Spit embers in an arc toward Jasmin.
    this.spit -= dt;
    if (this.spit <= 0 && L.mode === "play" && !L.player.dead) {
      this.spit = SPIT_EVERY / (0.8 + this.size * 0.3);
      const n = this.size > 1.3 ? 2 : 1;
      for (let i = 0; i < n; i++) this.spitEmber(p.x + (i ? Phaser.Math.Between(-40, 40) : 0));
    }

    // Jennifer: reveals valves near Isaac, shields the family from embers.
    const isaac = L.trail.get("isaac");
    if (isaac) {
      const ix = isaac.sprite.x, iy = isaac.sprite.y - 10;
      for (const v of this.valves) {
        if (!v.revealed && Math.hypot(v.x - ix, v.y - 8 - iy) < REVEAL) {
          v.revealed = true;
          L.tweens.add({ targets: v, alpha: 1, duration: 400 });
          L.puff(v.x, v.y - 8, 0xd6b8ff, 10);
          sfx.checkpoint();
        }
      }
      const nearFamily = Math.abs(ix - p.x) < SHIELD_FAMILY;
      if (nearFamily) {
        for (const e of this.embers.getChildren()) {
          if (Math.hypot(e.x - ix, e.y - iy) < SHIELD + 16 && Math.abs(e.x - p.x) < SHIELD_FAMILY + 10) this.block(e);
        }
      }
    }

    // Open a valve by touching it.
    for (const v of this.valves) {
      if (!v.revealed || v.open) continue;
      if (Math.abs(v.x - p.x) < 16 && Math.abs(v.y - p.y) < 20) this.openValve(v);
    }

    for (const e of this.embers.getChildren()) if (e.y > L.mapH + 40) e.destroy();
  }

  spitEmber(tx) {
    const f = this.fire;
    const e = this.embers.create(f.x - 8, f.y - 40 * this.size, "boss-ember");
    e.setDepth(9);
    const dx = tx - e.x;
    const flight = 1.1;
    e.body.setVelocity(dx / flight, -260);
    e.body.setSize(5, 5);
    this.level.tweens.add({ targets: e, angle: 360, duration: 600, repeat: -1 });
  }

  block(e) {
    this.level.puff(e.x, e.y, 0xf5d342, 6);
    e.destroy();
    if (!this.blockedOnce) {
      this.blockedOnce = true;
      ui.caption("Jennifer", "Blocked!", 1600);
    }
  }

  fizzle(e) {
    this.level.puff(e.x, e.y, 0xff9a3a, 4);
    e.destroy();
  }

  hitPlayer(e) {
    if (this.level.mode !== "play") return;
    e.destroy();
    this.level.hurtPlayer(e.x);
  }

  touchFire() {
    if (this.level.mode !== "play" || this.done) return;
    this.level.hurtPlayer(this.fire.x);
  }

  openValve(v) {
    const L = this.level;
    v.open = true;
    v.setTexture("prop-valve-1");
    this.opened++;
    sfx.pen();
    L.refreshHud();
    // Nube's cloud rains on the fire.
    const f = this.fire;
    const cloud = L.add.image(f.x, f.y - 90, "fx-cloud").setDepth(12).setScale(1.5).setAlpha(0);
    L.tweens.add({ targets: cloud, alpha: 1, duration: 300 });
    const rain = L.time.addEvent({
      delay: 40, repeat: 50, callback: () => {
        const d = L.add.image(cloud.x + Phaser.Math.Between(-22, 22), cloud.y + 8, "fx-rain").setDepth(12);
        L.tweens.add({ targets: d, y: f.y - 10, duration: 420, onComplete: () => d.destroy() });
      },
    });
    L.tweens.add({ targets: f, angle: { from: -8, to: 8 }, duration: 120, yoyo: true, repeat: 8, onComplete: () => f.setAngle(0) });
    L.time.delayedCall(2200, () => {
      rain.remove();
      L.tweens.add({ targets: cloud, alpha: 0, duration: 400, onComplete: () => cloud.destroy() });
      this.size = Math.max(0.5, this.size - 0.35);
      if (this.opened >= 3) this.defeat();
    });
    ui.caption("valve", `${this.opened} of 3`, 1800);
  }

  defeat() {
    const L = this.level;
    this.done = true;
    for (const e of this.embers.getChildren()) e.destroy();
    L.freeze();
    sfx.win();
    L.tweens.add({
      targets: this.fire, scale: 0, alpha: 0, duration: 1600, ease: "Back.in",
      onComplete: () => {
        this.fire.destroy();
        L.puff(this.fire.x, this.fire.y - 20, 0xffffff, 18);
        ui.caption("", t(L.level.bossDefeatedCaption), 0);
        L.time.delayedCall(3800, () => L.finishGame());
      },
    });
  }
}
