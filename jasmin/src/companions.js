import { charKey, animKey } from "./art.js";
import { sortCompanions } from "./state.js";

// Companions replay Jasmin's path from a history buffer (one point every STEP px
// she travels). Each follower sits SPACING px further back along that path.
// When she stands still, the spacing shrinks so everyone huddles up next to her.

const STEP = 2;
const SPACING = 24;
const HUDDLE = 14;
const MAX_POINTS = 800;
const HOPPERS = ["rupert"];

export class Trail {
  constructor(scene, leader, names, outline) {
    this.scene = scene;
    this.leader = leader;
    this.outline = outline;
    this.points = [];
    this.idle = 0;
    this.spacing = SPACING;
    this.members = [];
    this.resetPoints();
    for (const n of names) this.add(n);
    this.reset();
  }

  resetPoints() {
    const s = this.leader.sprite;
    this.points = [];
    for (let i = 0; i < 120; i++) this.points.push({ x: s.x - this.leader.facing * i * STEP * 0.4, y: s.y, air: false });
  }

  // Adds a companion (optionally appearing at x, y; otherwise behind Jasmin).
  add(name, x, y) {
    if (this.members.some((m) => m.name === name)) return this.rejoin(name);
    const key = charKey(name, { outline: this.outline });
    const s = this.scene.add.sprite(x ?? this.leader.sprite.x, y ?? this.leader.sprite.y, key, 0).setOrigin(0.5, 1);
    s.play(animKey(key, "idle"));
    this.members.push({ name, key, sprite: s, slot: 0, last: { x: s.x, y: s.y }, anim: "idle", present: true });
    this.reorder();
  }

  reorder() {
    const order = sortCompanions(this.members.map((m) => m.name));
    this.members.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
    let slot = 1;
    for (const m of this.members) {
      if (!m.present) continue;
      m.slot = slot++;
      m.sprite.setDepth(10 - m.slot);
    }
  }

  // Swap every texture between plain and outlined (dark levels / night).
  setOutline(on) {
    this.outline = on;
    for (const m of this.members) {
      m.key = charKey(m.name, { outline: on });
      m.sprite.setTexture(m.key, 0);
      m.anim = null;
    }
  }

  reset() {
    this.resetPoints();
    for (const m of this.members) {
      if (!m.present) continue;
      const p = this.at(m.slot * HUDDLE);
      m.sprite.setPosition(p.x, p.y);
      m.last = { x: p.x, y: p.y };
    }
  }

  get(name) {
    return this.members.find((m) => m.name === name && m.present);
  }

  has(name) {
    return !!this.get(name);
  }

  names() {
    return this.members.filter((m) => m.present).map((m) => m.name);
  }

  // Takes a member out of the trail (cutscenes, send-off, ghosts). Returns the member.
  detach(name) {
    const m = this.members.find((x) => x.name === name);
    if (!m) return null;
    m.present = false;
    this.reorder();
    return m;
  }

  rejoin(name) {
    const m = this.members.find((x) => x.name === name);
    if (!m) return null;
    m.present = true;
    this.reorder();
    return m;
  }

  remove(name) {
    const m = this.detach(name);
    if (m) this.members = this.members.filter((x) => x !== m);
    return m;
  }

  playOn(m, anim) {
    if (m.anim === anim) return;
    m.sprite.play(animKey(m.key, anim));
    m.anim = anim;
  }

  at(dist) {
    const i = Math.min(this.points.length - 1, Math.max(0, Math.round(dist / STEP)));
    return this.points[i];
  }

  update(dt) {
    const s = this.leader.sprite;
    const head = this.points[0];
    const air = !this.leader.onGround;
    // A jump in place (in the air, barely moving sideways) isn't recorded, so it
    // doesn't drag followers up onto her; jumps and falls while moving still are.
    const dx = s.x - head.x, dy = s.y - head.y;
    const d = Math.hypot(dx, dy);
    const inPlace = air && Math.abs(s.body.velocity.x) < 30;
    if (d >= STEP && !inPlace) {
      const n = Math.floor(d / STEP);
      for (let k = 1; k <= n; k++) {
        const tt = (k * STEP) / d;
        this.points.unshift({ x: head.x + dx * tt, y: head.y + dy * tt, air });
      }
      if (this.points.length > MAX_POINTS) this.points.length = MAX_POINTS;
    }

    const moving = Math.abs(s.body.velocity.x) > 10;
    this.idle = moving ? 0 : this.idle + dt;
    const want = this.idle > 0.35 ? HUDDLE : SPACING;
    this.spacing += (want - this.spacing) * Math.min(1, dt * (want < this.spacing ? 2.5 : 6));

    for (const m of this.members) {
      if (!m.present || m.scripted) continue;
      let p = this.at(m.slot * this.spacing);
      // Huddled next to her while she stands: stand on her ground, not on the tail of a fall.
      if (!air && this.idle > 0.35 && (p.air || Math.abs(p.x - s.x) < 40)) p = { x: p.x, y: s.y, air: false };
      const sp = m.sprite;
      const vx = p.x - m.last.x;
      sp.setPosition(Math.round(p.x), Math.round(p.y));
      if (Math.abs(vx) > 0.05) sp.setFlipX(vx < 0);
      const hop = HOPPERS.includes(m.name);
      // Keep running through brief slow frames (ice, spacing changes) so the
      // run cycle doesn't restart on its first frame over and over.
      m.still = Math.abs(vx) > 0.15 ? 0 : (m.still || 0) + dt;
      let anim = "idle";
      if (p.air) anim = hop ? "hop" : "jump";
      else if (m.still < 0.15 && (m.anim === "run" || m.anim === "hop" || Math.abs(vx) > 0.15)) anim = hop ? "hop" : "run";
      this.playOn(m, anim);
      m.last = { x: p.x, y: p.y };
    }
  }

  // True when this companion is standing right next to Jasmin.
  isNext(name) {
    const m = this.get(name);
    if (!m || m.scripted) return false;
    const s = this.leader.sprite;
    return Math.abs(m.sprite.x - s.x) <= 20 && Math.abs(m.sprite.y - s.y) < 6 && m.anim === "idle";
  }
}
