// Binocular ghosts (Minneapolis only). They watch, never hurt.
// While Jasmin is in a sight cone a "seen" meter fills. Full meter: she is
// wrapped in the ghosts' cloak until she stays out of sight for 5 seconds.
// Seen together with Andrew: the meter fills twice as fast, nearby ghosts
// converge, and Andrew is sent back to wait at the last checkpoint.

import { ui } from "./ui.js";
import { sfx } from "./audio.js";
import { t } from "./content.js";

const CONE_LEN = 124;
const CONE_HALF = 0.55;        // radians, about 32 degrees
const FILL = 0.9;              // meter per second
const DECAY = 0.22;
const UNCLOAK_AFTER = 5;       // seconds out of sight
const DRIFT = 14;              // px/s
const RANGE = 72;              // px each way from home
const CONVERGE_RADIUS = 220;

export class Ghosts {
  constructor(level) {
    this.level = level;
    this.list = [];
    this.hides = [];
    this.meter = 0;
    this.unseen = 0;
    this.ended = false;
    this.firstSeen = false;
    this.exitX = Infinity;
    this.cones = level.add.graphics().setDepth(6);
    if (!level.anims.exists("enemy-ghost")) {
      level.anims.create({ key: "enemy-ghost", frames: [{ key: "enemy-ghost-0" }, { key: "enemy-ghost-1" }], frameRate: 3, repeat: -1 });
    }
  }

  addGhost(x, y) {
    const g = this.level.add.sprite(x, y, "enemy-ghost-0").setOrigin(0.5, 1).setDepth(8).play("enemy-ghost");
    g.home = { x, y };
    g.dir = Math.random() < 0.5 ? -1 : 1;
    g.t = Math.random() * 6;
    g.pause = 0;
    g.converge = 0;
    this.list.push(g);
  }

  addHide(x, y, key) {
    const s = this.level.add.image(x, y, key).setOrigin(0.5, 1).setDepth(11);
    this.hides.push(s);
  }

  setExit(x) {
    this.exitX = x;
  }

  get active() {
    return this.list.length > 0 && !this.ended;
  }

  isHidden() {
    const p = this.level.player.sprite;
    if (!this.level.player.onGround) return false;
    return this.hides.some((h) => Math.abs(h.x - p.x) < h.width / 2 - 3 && Math.abs(h.y - p.y) < 6);
  }

  // Is the point inside ghost g's sight cone with a clear line of sight?
  sees(g, x, y) {
    const ex = g.x + g.dir * 5, ey = g.y - 16;
    const dx = x - ex, dy = y - ey;
    const d = Math.hypot(dx, dy);
    if (d > CONE_LEN || d < 1) return false;
    const ang = Math.atan2(dy, dx * g.dir);
    if (Math.abs(ang) > CONE_HALF) return false;
    const layer = this.level.layer;
    for (let s = 8; s < d; s += 8) {
      const tile = layer.getTileAtWorldXY(ex + (dx * s) / d, ey + (dy * s) / d);
      if (tile && tile.collides) return false;
    }
    return true;
  }

  update(dt) {
    if (!this.list.length) return;
    const L = this.level, p = L.player, ps = p.sprite;
    if (!this.ended && ps.x > this.exitX) this.end();

    let seen = false, together = false;
    const andrew = L.trail.get("andrew");
    const hidden = this.isHidden();
    this.cones.clear();

    for (const g of this.list) {
      if (!g.active) continue;
      g.t += dt;
      // Drift, with the occasional pause to look around.
      if (g.converge > 0) {
        g.converge -= dt;
        const dir = Math.sign(ps.x - g.x) || 1;
        g.dir = dir;
        g.x += dir * DRIFT * 2.4 * dt;
        g.x = Math.min(g.x, this.exitX - 20);
      } else if (g.pause > 0) {
        g.pause -= dt;
        if (g.pause <= 0 && !g.staring) g.dir *= -1;
      } else {
        g.x += g.dir * DRIFT * dt;
        if (g.x > Math.min(g.home.x + RANGE, this.exitX - 20) || g.x < g.home.x - RANGE) { g.pause = 1.2; }
        else if (Math.random() < dt * 0.15) g.pause = 1.5;
      }
      g.y = g.home.y + Math.sin(g.t * 2) * 3;
      g.setFlipX(g.dir < 0);
      if (this.ended) continue;

      const hit = !hidden && !p.dead && this.sees(g, ps.x, ps.y - 18);
      const withHim = hit && andrew && !andrew.scripted && this.sees(g, andrew.sprite.x, andrew.sprite.y - 18);
      g.staring = hit;
      if (hit) { seen = true; g.pause = Math.max(g.pause, 0.6); } // stop and stare
      if (withHim) together = true;
      this.drawCone(g, hit);
    }

    if (this.ended || L.mode !== "play") return this.hud();

    if (seen) {
      if (!this.firstSeen) {
        this.firstSeen = true;
        ui.caption("", t(L.level.ghostFirstSeenCaption), 3600);
      }
      this.meter = Math.min(1, this.meter + FILL * (together ? 2 : 1) * dt);
      this.unseen = 0;
      if (this.meter >= 1) this.full(together);
    } else {
      this.meter = Math.max(0, this.meter - DECAY * dt);
      this.unseen += dt;
      if (p.cloaked && this.unseen >= UNCLOAK_AFTER) p.setCloak(false);
    }
    this.hud();
  }

  full(together) {
    const L = this.level, p = L.player;
    if (!p.cloaked) {
      p.setCloak(true);
      sfx.hit();
      L.puff(p.sprite.x, p.sprite.y - 16, 0x34313b, 12);
    }
    if (together) {
      for (const g of this.list) if (Math.abs(g.x - p.sprite.x) < CONVERGE_RADIUS) g.converge = 3;
      L.sendAndrewBack();
      ui.caption("", t(L.level.togetherCaughtCaption), 3600);
    }
    this.meter = 0.35;
  }

  drawCone(g, hit) {
    const ex = g.x + g.dir * 5, ey = g.y - 16;
    const a1 = -CONE_HALF, a2 = CONE_HALF;
    const g2 = this.cones;
    g2.fillStyle(hit ? 0xff6a5a : 0xfff2b0, hit ? 0.28 : 0.14);
    g2.beginPath();
    g2.moveTo(ex, ey);
    for (let i = 0; i <= 6; i++) {
      const a = a1 + ((a2 - a1) * i) / 6;
      g2.lineTo(ex + Math.cos(a) * CONE_LEN * g.dir, ey + Math.sin(a) * CONE_LEN);
    }
    g2.closePath();
    g2.fillPath();
  }

  hud() {
    ui.meter(this.active ? this.meter : null, this.level.player.cloaked);
  }

  end() {
    this.ended = true;
    this.cones.clear();
    for (const g of this.list) {
      this.level.tweens.add({ targets: g, alpha: 0, y: g.y - 20, duration: 900, onComplete: () => g.destroy() });
    }
    ui.meter(null);
  }
}
