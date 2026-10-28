// Lights: cool moonlight through the windows (the only shadow caster), a sky
// fill, warm lamp point lights and an alarm light. The light count never changes
// (moods only change colours and intensities), so shaders are compiled once.
import { C } from './palette.js';
import { lin } from './geo.js';

const MAX_LAMPS = 6;

export const MOODS = {
  evening:      { sky: 0x5272a6, ground: 0x2a2018, hemi: 0.5, moon: 0.5, fill: 0.22, fillColor: 0xffc9a0, lamp: 1.7, lampColor: C.amber, alarm: 0, exposure: 1.08, pools: 1, screen: 1 },
  outage:       { sky: 0x445a80, ground: 0x2a1614, hemi: 0.42, moon: 0.42, fill: 0.18, fillColor: 0xff8a7a, lamp: 1.1, lampColor: 0xffa060, alarm: 3.2, exposure: 1.05, pools: 0.75, screen: 1 },
  'after-good': { sky: 0x6a82b0, ground: 0x30261c, hemi: 0.58, moon: 0.45, fill: 0.28, fillColor: 0xffd6a8, lamp: 1.9, lampColor: 0xffbe6e, alarm: 0, exposure: 1.12, pools: 1.15, screen: 0.9 },
  'after-bad':  { sky: 0x3d4f72, ground: 0x241a18, hemi: 0.42, moon: 0.6, fill: 0.18, fillColor: 0xb8c8ff, lamp: 1.0, lampColor: 0xffa860, alarm: 1.6, exposure: 1.02, pools: 0.7, screen: 1 },
};

const ALARM_AT = { outage: [-0.6, 2.2, -6.2], 'after-bad': [10.6, 1.8, -6.4] };
// The moon (directional light) position; it shines towards the origin.
export const MOON_POS = [-7, 16, -15];

export function createLighting(THREE, scene, lamps, { shadowSize = 1024 } = {}) {
  const hemi = new THREE.HemisphereLight(0xffffff, 0x000000, 0.6);
  scene.add(hemi);

  const moon = new THREE.DirectionalLight(lin(THREE, C.moon), 0.7);
  moon.position.set(...MOON_POS);
  moon.target.position.set(0, 0, 0);
  moon.castShadow = true;
  moon.shadow.mapSize.set(shadowSize, shadowSize);
  const sc = moon.shadow.camera;
  sc.left = -17; sc.right = 17; sc.top = 13; sc.bottom = -13; sc.near = 4; sc.far = 50;
  moon.shadow.bias = -0.0015;
  moon.shadow.normalBias = 0.06;
  scene.add(moon, moon.target);

  const fill = new THREE.DirectionalLight(0xffffff, 0.3);
  fill.position.set(12, 9, 14);
  scene.add(fill);

  const lampLights = lamps.filter((l) => l.light).slice(0, MAX_LAMPS).map((l) => {
    const p = new THREE.PointLight(lin(THREE, C.amber), 1, 6.5, 2);
    p.position.set(l.x, l.y, l.z);
    scene.add(p);
    return p;
  });

  const alarm = new THREE.PointLight(lin(THREE, C.alert), 0, 8, 2);
  alarm.position.set(...ALARM_AT.outage);
  scene.add(alarm);

  let mood = MOODS.evening;
  let moodId = 'evening';

  return {
    alarm,
    setShadowSize(size) {
      moon.shadow.mapSize.set(size, size);
      moon.shadow.map?.dispose();
      moon.shadow.map = null;
    },
    setMood(id, renderer) {
      moodId = MOODS[id] ? id : 'evening';
      mood = MOODS[moodId];
      hemi.color.copy(lin(THREE, mood.sky));
      hemi.groundColor.copy(lin(THREE, mood.ground));
      hemi.intensity = mood.hemi;
      moon.intensity = mood.moon;
      fill.color.copy(lin(THREE, mood.fillColor));
      fill.intensity = mood.fill;
      lampLights.forEach((p, i) => {
        p.color.copy(lin(THREE, mood.lampColor));
        p.intensity = moodId === 'after-bad' && i % 2 ? 0 : mood.lamp;
      });
      if (ALARM_AT[moodId]) alarm.position.set(...ALARM_AT[moodId]);
      alarm.intensity = mood.alarm;
      if (renderer) renderer.toneMappingExposure = mood.exposure;
      return mood;
    },
    update(t, reduced) {
      if (!mood.alarm) return;
      if (moodId === 'outage') alarm.intensity = reduced ? mood.alarm * 0.7 : mood.alarm * (0.45 + 0.55 * Math.abs(Math.sin(t * 3.2)));
      else alarm.intensity = reduced ? mood.alarm : mood.alarm * (0.8 + 0.2 * Math.sin(t * 1.3));
    },
    dispose() {
      moon.shadow.map?.dispose();
      [hemi, moon, moon.target, fill, alarm, ...lampLights].forEach((l) => scene.remove(l));
    },
  };
}
