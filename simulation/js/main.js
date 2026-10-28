// Boot. ?nothree=1 removes Three.js before the world is created, to test the
// no-WebGL path: the dossier then carries the whole game.
import { createDirector } from './game/director.js';
import { loadLanguage } from './i18n/i18n.js';

if (new URLSearchParams(window.location.search).has('nothree')) delete window.THREE;

// Dictionaries load before the first render so every screen starts translated.
loadLanguage().then(() => createDirector().boot());
