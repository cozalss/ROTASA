// World palette (sRGB hex). Deep navy and teal for the building, warm amber
// for lamps, orange only for the player and highlighted hotspots.
// These colours are drawn into WebGL and canvases, so they are literal on purpose;
// they mirror css/tokens.css (player #ff8a3d, expert #3cc4b8, night #0d1a2b).

export const C = {
  night: 0x0d1a2b,
  player: 0xff8a3d,
  expert: 0x3cc4b8,
  alert: 0xff5a4f,
  good: 0x6fcf86,
  amber: 0xffb45e,
  moon: 0xa9c3ff,

  floor: 0x1f2e42,
  floorZone: 0x1b293b,
  floorWood: 0x5b4636,
  slabSide: 0x182739,
  slabCut: 0x9fb3c8,
  wall: 0x3d5574,
  wallInner: 0x4d6788,
  wallCap: 0xd7e1ec,
  trim: 0x1d2b3c,
  mullion: 0x1a2635,
  glassFrame: 0x56708c,

  deskTop: 0xb69878,
  deskTopDark: 0x8a6e55,
  deskLeg: 0x26323f,
  metal: 0x6f8296,
  chair: 0x2c3d52,
  chairSeat: 0x2f6f73,
  monitor: 0x1b232d,
  paper: 0xece6d8,
  cork: 0xa7774a,
  shelf: 0x6a4f3c,
  book: [0xc65b4a, 0x3f7f8c, 0xd9b45a, 0x5c6f9c, 0x7c9b62, 0xb07aa1],
  pot: 0xc4714a,
  potDark: 0x2f3e4f,
  leaf: 0x2f8a5f,
  leafLight: 0x4cae74,
  rug: 0x3a5a6c,
  rugBorder: 0xc98e5a,
  sofa: 0x4b6a8a,
  rack: 0x1f2832,

  asphalt: 0x223044,
  sidewalk: 0x3a4b60,
  curb: 0x5d728a,
  lane: 0xc9d3dd,
  ground: 0x16222f,
  grass: 0x1d3a35,
  building: [0x23364f, 0x2a3f5a, 0x1f3047, 0x304865],
  windowWarm: 0xffcf8a,
  windowCool: 0x9fd0ff,
  truckBody: 0xc9d3dd,
  truckCab: 0x2f6f73,
  tyre: 0x111820,
  headlight: 0xfff1cf,
  taillight: 0xff4a3d,
};

// People's skin tones.
export const SKIN = {
  light: 0xf1c7a5,
  medium: 0xd9a37e,
  tan: 0xc68a63,
  deep: 0x8f5b3e,
};
