// Pose and animation for one person rig. Every frame the pose is rebuilt from
// scratch (base pose + state layer), so states never accumulate drift.
import { HIP_STAND, HIP_SEAT } from './person-model.js';

const LOOK_RANGE = 2.8;
const LOOK_LIMIT = 1.0;
const BLINK_MS = 0.12;

export function createAnimator(rig, seed = 1) {
  const s = { state: 'idle', seated: false, walkPhase: 0, lookYaw: 0, blinkAt: 1 + (seed % 5) * 0.7, blinkEnd: 0, t0: seed * 1.37 };
  const tmp = { x: 0, z: 0 };
  return {
    get state() { return s.state; },
    get seated() { return s.seated; },
    setState(state) { s.state = state; rig.root.visible = state !== 'away'; },
    setSeated(seated) { s.seated = seated; },
    // Called while walking: distance moved drives the leg cycle.
    stride(dist) { s.walkPhase += dist * 5.2; },
    update(t, { reduced = false, look = null } = {}) {
      const time = reduced ? 0 : t + s.t0;
      basePose(rig, s.seated);
      const walking = s.state === 'walking';
      if (walking) walkPose(rig, s.walkPhase);
      else STATES[s.state]?.(rig, time, s.seated);
      blink(rig, s, reduced ? -1 : t);
      updateLook(rig, s, look, reduced, tmp);
    },
  };
}

function basePose(rig, seated) {
  rig.body.position.y = seated ? HIP_SEAT : HIP_STAND;
  rig.body.rotation.set(0, 0, 0);
  rig.torso.rotation.set(0, 0, 0);
  rig.torso.scale.set(1, 1, 1);
  rig.head.rotation.set(0, 0, 0);
  rig.mouth.scale.set(1, 1, 1);
  rig.brows.forEach((b, i) => { b.rotation.z = (i ? -1 : 1) * 0.08; b.position.y = 0.068; });
  rig.legs.forEach(({ hip, knee }) => {
    hip.rotation.set(seated ? -1.5 : 0, 0, 0);
    knee.rotation.set(seated ? 1.45 : 0, 0, 0);
  });
  rig.arms.forEach(({ shoulder, elbow, side }) => {
    shoulder.rotation.set(seated ? -0.45 : 0, 0, side * 0.12);
    elbow.rotation.set(seated ? -0.7 : -0.12, 0, 0);
  });
  // Something held in the left hand is carried in front.
  if (rig.props.held) {
    const { shoulder, elbow } = rig.arms[1];
    shoulder.rotation.x = -0.35;
    elbow.rotation.x = -1.1;
  }
}

function breathe(rig, time, rate = 2, amount = 0.012) {
  const b = Math.sin(time * rate);
  rig.torso.scale.y = 1 + b * amount;
  rig.head.position.y = 0.42 + b * amount * 0.4;
}

const STATES = {
  idle(rig, time) {
    breathe(rig, time);
    rig.head.rotation.z = Math.sin(time * 0.6) * 0.035;
    rig.torso.rotation.y = Math.sin(time * 0.35) * 0.04;
  },
  typing(rig, time) {
    breathe(rig, time, 2.2);
    typingArms(rig, time, 15, 0.09);
    rig.head.rotation.x = 0.12 + Math.sin(time * 0.8) * 0.03;
  },
  talking(rig, time, seated) {
    breathe(rig, time, 2.4);
    rig.head.rotation.x = Math.sin(time * 5.2) * 0.07;
    rig.head.rotation.z = Math.sin(time * 1.7) * 0.06;
    rig.mouth.scale.y = 1 + Math.abs(Math.sin(time * 9)) * 2.2;
    const { shoulder, elbow } = rig.arms[0];
    shoulder.rotation.x = (seated ? -0.75 : -0.55) + Math.sin(time * 2.3) * 0.22;
    shoulder.rotation.z = -0.25 + Math.sin(time * 1.6) * 0.1;
    elbow.rotation.x = -0.9 + Math.sin(time * 3.1) * 0.15;
  },
  stressed(rig, time, seated) {
    breathe(rig, time, 6, 0.022);
    typingArms(rig, time, 26, 0.14);
    rig.head.rotation.y = Math.sin(time * 3.1) * 0.22;
    rig.head.rotation.x = 0.05 + Math.sin(time * 7) * 0.04;
    rig.body.rotation.z = Math.sin(time * 9) * 0.02;
    rig.brows.forEach((b, i) => { b.rotation.z = (i ? 1 : -1) * 0.38; b.position.y = 0.075; });
    if (seated) rig.legs[0].knee.rotation.x += Math.sin(time * 15) * 0.09;
  },
};

function typingArms(rig, time, speed, amount) {
  rig.arms.forEach(({ shoulder, elbow, side }) => {
    shoulder.rotation.x = -0.72;
    shoulder.rotation.z = side * 0.04;
    elbow.rotation.x = -0.85 + Math.sin(time * speed + side * 1.9) * amount;
  });
}

function walkPose(rig, phase) {
  const sw = Math.sin(phase);
  rig.body.position.y = HIP_STAND + Math.abs(Math.cos(phase)) * 0.028;
  rig.torso.rotation.x = 0.06;
  rig.torso.rotation.y = sw * 0.08;
  rig.legs.forEach(({ hip, knee }, i) => {
    const side = i ? 1 : -1;
    hip.rotation.x = side * sw * 0.55;
    knee.rotation.x = 0.12 + Math.max(0, side * sw) * 0.55;
  });
  rig.arms.forEach(({ shoulder, elbow, side }) => {
    if (side > 0 && rig.props.held) return;
    shoulder.rotation.x = -side * sw * 0.5;
    elbow.rotation.x = -0.3;
  });
}

function blink(rig, s, t) {
  if (t < 0) { rig.eyes.forEach((e) => { e.scale.y = 1; }); return; }
  if (t >= s.blinkAt) {
    s.blinkEnd = t + BLINK_MS;
    s.blinkAt = t + 2.2 + ((Math.sin(t * 12.9898) * 43758.5453) % 1 + 1) % 1 * 3.2;
  }
  const closed = t < s.blinkEnd;
  rig.eyes.forEach((e) => { e.scale.y = closed ? 0.12 : 1; });
}

function updateLook(rig, s, look, reduced, tmp) {
  let target = 0;
  if (look && !reduced) {
    const p = rig.root.position;
    tmp.x = look.x - p.x;
    tmp.z = look.z - p.z;
    const d = Math.hypot(tmp.x, tmp.z);
    if (d < LOOK_RANGE && d > 0.2) {
      let a = Math.atan2(tmp.x, tmp.z) - rig.root.rotation.y;
      a = Math.atan2(Math.sin(a), Math.cos(a));
      if (Math.abs(a) < 2.2) target = Math.max(-LOOK_LIMIT, Math.min(LOOK_LIMIT, a));
    }
  }
  s.lookYaw += (target - s.lookYaw) * 0.08;
  rig.head.rotation.y += s.lookYaw;
}
