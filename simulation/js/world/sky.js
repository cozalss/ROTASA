// The night above the city blocks: a star field that is bright on a clear
// night and fades behind the overcast when it rains. (A moon and distant bokeh
// lights were tried here, but the isometric camera never frames the sky, even
// fully zoomed out, so they cost draw calls for nothing.)

function stars(THREE, glowTex) {
  const pts = [];
  let s = 11;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < 260; i++) pts.push(-60 + rnd() * 90, 14 + rnd() * 40, -48 - rnd() * 10);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const mat = new THREE.PointsMaterial({ size: 2.5, map: glowTex, color: 0xcfe0ff, transparent: true, opacity: 0.8, depthWrite: false, fog: false, toneMapped: false });
  return new THREE.Points(geo, mat);
}

export function createSky(THREE, parent, { glowTex }) {
  const starField = stars(THREE, glowTex);
  starField.name = 'stars';
  parent.add(starField);
  return {
    setClear(clear) {
      starField.material.opacity = clear ? 0.85 : 0.3;
    },
    dispose() {
      parent.remove(starField);
      starField.geometry.dispose();
      starField.material.dispose();
    },
  };
}
