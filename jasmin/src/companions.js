import { charKey, animKey } from "./art.js";

// Companions replay Jasmin's path from a history buffer (one point every STEP px
// she travels). Each follower sits SPACING px further back along that path.
// When she stands still, the spacing shrinks so everyone huddles up next to her.

const STEP = 2;
const SPACING = 24;
const HUDDLE = 13;
const MAX_POINTS = 600;

export class Trail {
  constructor(scene, leader, names, outline) {
    this.scene = scene;
    this.leader = leader;
    this.points = [];
    this.idle = 0;
    this.spacing = SPACING;
    this.members = names.map((name, i) => {
      const key = charKey(name, { outline });
      const s = scene.add.sprite(leader.sprite.x - (i + 1) * 14, leader.sprite.y, key, 0).setOrigin(0.5, 1);
      s.setDepth(9 - i);
      s.play(animKey(key, "idle"));
      return { name, key, sprite: s, slot: i + 1, last: { x: s.x, y: s.y }, anim: "idle", present: true };
    });
    this.reset();
  }

  reset() {
    const s = this.leader.sprite;
    this.points = [];
    for (let i = 0; i < 80; i++) this.points.push({ x: s.x - this.leader.facing * i * STEP * 0.4, y: s.y, air: false });
    for (const m of this.members) {
      const p = this.at(m.slot * HUDDLE);
      m.sprite.setPosition(p.x, p.y);
    }
  }

  get(name) {
    return this.members.find((m) => m.name === name && m.present);
  }

  // Drops a member out of the trail (e.g. the rabbit at the send-off). Returns its sprite.
  detach(name) {
    const m = this.members.find((x) => x.name === name);
    if (!m) return null;
    m.present = false;
    const rest = this.members.filter((x) => x.present);
    rest.forEach((x, i) => (x.slot = i + 1));
    return m.sprite;
  }

  at(dist) {
    const i = Math.min(this.points.length - 1, Math.max(0, Math.round(dist / STEP)));
    return this.points[i];
  }

  update(dt) {
    const s = this.leader.sprite;
    const head = this.points[0];
    const air = !this.leader.onGround;
    const dx = s.x - head.x, dy = s.y - head.y;
    const d = Math.hypot(dx, dy);
    if (d >= STEP) {
      // Insert evenly spaced points along the move.
      const n = Math.floor(d / STEP);
      for (let k = 1; k <= n; k++) {
        const t = (k * STEP) / d;
        this.points.unshift({ x: head.x + dx * t, y: head.y + dy * t, air });
      }
      if (this.points.length > MAX_POINTS) this.points.length = MAX_POINTS;
    }

    const moving = Math.abs(s.body.velocity.x) > 10 || air;
    this.idle = moving ? 0 : this.idle + dt;
    const want = this.idle > 0.35 ? HUDDLE : SPACING;
    this.spacing += (want - this.spacing) * Math.min(1, dt * (want < this.spacing ? 2.5 : 6));

    for (const m of this.members) {
      if (!m.present) continue;
      const p = this.at(m.slot * this.spacing);
      const sp = m.sprite;
      const vx = p.x - m.last.x;
      sp.setPosition(Math.round(p.x), Math.round(p.y));
      if (Math.abs(vx) > 0.05) sp.setFlipX(vx < 0);
      let anim = "idle";
      if (p.air) anim = m.name === "rabbit" ? "hop" : "jump";
      else if (Math.abs(vx) > 0.15) anim = m.name === "rabbit" ? "hop" : "run";
      if (anim !== m.anim) { sp.play(animKey(m.key, anim)); m.anim = anim; }
      m.last = { x: p.x, y: p.y };
    }
  }

  // True when this companion is standing right next to Jasmin.
  isNext(name) {
    const m = this.get(name);
    if (!m) return false;
    const s = this.leader.sprite;
    return Math.abs(m.sprite.x - s.x) <= 18 && Math.abs(m.sprite.y - s.y) < 6 && m.anim === "idle";
  }
}
