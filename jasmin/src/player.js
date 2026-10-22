import { controls } from "./controls.js";
import { charKey, animKey } from "./art.js";
import { sfx } from "./audio.js";

// Tuning. See ARCHITECTURE.md "Units and physics".
export const PHYS = {
  run: 130,
  accelGround: 1100,
  accelAir: 750,
  decelGround: 1500,
  jump: 330,
  jumpCut: 0.45,
  maxFall: 420,
  glideFall: 45,
  coyote: 0.09,
  buffer: 0.12,
  boostAndrew: 1.3,
  boostRabbit: 1.15,
  charm: 1.5,
  slowDaughter: 0.85,
  iceTraction: 0.22,
  waterGravity: 260,
  waterSink: 70,
  swimStroke: 170,
};

// Hitbox inside the 24 x 32 Jasmin frame (feet on the bottom row).
const BODY = { w: 10, h: 24, xRight: 11, xLeft: 3 };

export class Player {
  constructor(scene, x, y, opts) {
    this.scene = scene;
    this.outfit = opts.outfit;
    this.outline = opts.outline;
    this.hasHat = false;
    this.facing = 1;
    this.coyote = 0;
    this.buffer = 0;
    this.jumpHeld = false;
    this.cut = false;
    this.invuln = 0;
    this.locked = false;   // cutscenes
    this.dead = false;
    this.charmReady = !!opts.charm;
    this.mods = { speed: 1, jump: 1 };

    const s = scene.physics.add.sprite(x, y, this.tex(), 0);
    s.setOrigin(0.5, 1);
    s.body.setSize(BODY.w, BODY.h);
    s.body.setMaxVelocityY(PHYS.maxFall);
    s.setDepth(10);
    this.sprite = s;
    this.syncBody();
    this.play("idle");
  }

  tex() {
    if (this.cloaked) return charKey("jasminCloak", { outline: this.outline });
    return charKey(this.hasHat ? "jasminHat" : "jasmin", { outfit: this.outfit, outline: this.outline });
  }

  refreshTexture() {
    this.sprite.setTexture(this.tex(), 0);
    const a = this.anim || "idle";
    this.anim = null;
    this.play(this.cloaked && (a === "glide" || a === "wave" || a === "write") ? "idle" : a);
  }

  // The ghosts' drab hooded cloak (Minneapolis). No gliding while cloaked.
  setCloak(on) {
    if (this.cloaked === on) return;
    this.cloaked = on;
    this.refreshTexture();
  }

  setOutfit(name) {
    this.outfit = name;
    this.refreshTexture();
  }

  setOutline(on) {
    this.outline = on;
    this.refreshTexture();
    this.syncBody();
  }

  play(anim) {
    const k = animKey(this.tex(), anim);
    if (this.sprite.anims.currentAnim?.key !== k) this.sprite.play(k, true);
    this.anim = anim;
  }

  setHat(on) {
    this.hasHat = on;
    this.refreshTexture();
  }

  syncBody() {
    const pad = this.outline ? 1 : 0;
    const fh = this.sprite.frame.height;
    this.sprite.body.setOffset((this.facing > 0 ? BODY.xRight : BODY.xLeft) + pad, fh - BODY.h - pad);
  }

  get onGround() {
    const b = this.sprite.body;
    return b.blocked.down || b.touching.down;
  }

  // ctx: { andrewReady, inWater }
  update(dt, ctx) {
    const s = this.sprite, b = s.body;
    if (this.dead) return;
    if (this.invuln > 0) {
      this.invuln -= dt;
      s.setAlpha(this.invuln > 0 && Math.floor(this.invuln * 12) % 2 ? 0.35 : 1);
    }
    if (this.locked) { this.updateAnim(); return; }

    const dir = (controls.right ? 1 : 0) - (controls.left ? 1 : 0);
    const max = PHYS.run * this.mods.speed;
    const ground = this.onGround;

    // Horizontal: accelerate toward target speed.
    const target = dir * max;
    const ice = this.ice && ground ? PHYS.iceTraction : 1;
    const accel = (ground ? (dir === 0 ? PHYS.decelGround : PHYS.accelGround) : PHYS.accelAir) * ice;
    const dv = target - b.velocity.x;
    const step = accel * dt;
    b.setVelocityX(Math.abs(dv) <= step ? target : b.velocity.x + Math.sign(dv) * step);
    if (dir !== 0 && dir !== this.facing) { this.facing = dir; s.setFlipX(dir < 0); this.syncBody(); }

    // Swimming: slow sinking, every jump press is a stroke upward.
    if (ctx.inWater) {
      b.setGravityY(PHYS.waterGravity - this.scene.physics.world.gravity.y);
      if (b.velocity.y > PHYS.waterSink) b.setVelocityY(PHYS.waterSink);
      if (controls.pressed("jump")) { b.setVelocityY(-PHYS.swimStroke); sfx.jump(); }
      this.swimming = true;
      this.gliding = false;
      this.updateAnim();
      return;
    }
    if (this.swimming) {
      this.swimming = false;
      b.setGravityY(0);
      // Any upward stroke through the surface hops out, held jump or not.
      if (b.velocity.y < 0) b.setVelocityY(-PHYS.jump * 0.9);
    }

    // Jump with coyote time and input buffering.
    this.coyote = ground ? PHYS.coyote : this.coyote - dt;
    this.buffer = controls.pressed("jump") ? PHYS.buffer : this.buffer - dt;
    if (this.buffer > 0 && this.coyote > 0) {
      let mult = this.mods.jump;
      let boosted = false;
      if (ctx.andrewReady && Math.abs(b.velocity.x) < 60) { mult = Math.max(mult, PHYS.boostAndrew); boosted = true; }
      b.setVelocityY(-PHYS.jump * mult);
      this.buffer = 0; this.coyote = 0; this.cut = false;
      boosted ? sfx.boost() : sfx.jump();
      this.boosted = boosted;
    } else if (controls.pressed("jump") && !ground && this.coyote <= 0 && this.charmReady && !(this.hasHat && b.velocity.y > 0)) {
      // Rabbit's keepsake: one extra-high mid-air jump per level.
      this.charmReady = false;
      b.setVelocityY(-PHYS.jump * PHYS.charm);
      this.cut = true;
      sfx.boost();
      this.scene.events.emit("charm-used");
    }

    // Variable height: releasing jump early cuts the rise.
    if (!controls.jump && !this.cut && b.velocity.y < -100 && !this.boosted) {
      b.setVelocityY(b.velocity.y * PHYS.jumpCut);
      this.cut = true;
    }
    if (b.velocity.y >= 0) this.boosted = false;

    // Glide with the hat.
    this.gliding = this.hasHat && !this.cloaked && controls.jump && !ground && b.velocity.y > PHYS.glideFall;
    if (this.gliding) b.setVelocityY(PHYS.glideFall);
    else if (this.hasHat && !this.cloaked && controls.jump && !ground && b.velocity.y > 0) this.gliding = true;

    if (ground && !this.wasGround && this.airTime > 0.25) sfx.land();
    this.airTime = ground ? 0 : (this.airTime || 0) + dt;
    this.wasGround = ground;
    this.updateAnim();
  }

  updateAnim() {
    const b = this.sprite.body;
    if (this.forcedAnim) return this.play(this.forcedAnim);
    if (this.swimming) return this.play(b.velocity.y < 0 ? "jump" : "fall");
    if (!this.onGround) {
      if (this.gliding) this.play("glide");
      else this.play(b.velocity.y < 0 ? "jump" : "fall");
    } else if (Math.abs(b.velocity.x) > 8) this.play("run");
    else this.play("idle");
  }

  // Returns "hat" if the hat absorbed the hit, "dead" otherwise.
  hurt(fromX) {
    if (this.invuln > 0 || this.dead) return null;
    if (this.hasHat) {
      this.setHat(false);
      this.invuln = 1.6;
      this.sprite.body.setVelocity(Math.sign(this.sprite.x - fromX || 1) * 120, -180);
      sfx.hit();
      return "hat";
    }
    this.die();
    return "dead";
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    sfx.hit();
    const s = this.sprite;
    s.body.setVelocity(0, -220);
    s.body.checkCollision.none = true;
    this.forcedAnim = null;
    this.play("hurt");
  }

  respawn(x, y) {
    const s = this.sprite;
    this.dead = false;
    this.forcedAnim = null;
    s.body.checkCollision.none = false;
    s.body.reset(x, y);
    s.setAlpha(1);
    this.invuln = 1.0;
    this.cloaked = false;
    this.setHat(false);
    this.play("idle");
  }
}
