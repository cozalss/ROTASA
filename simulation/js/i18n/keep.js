// Official TMMi names stay in English in every language. Mapping them to
// themselves makes them exact matches, so no generic template ("{0} and {1}")
// can rewrite part of a name.
import { PROCESS_AREAS, ALL_GOALS } from '../data/tmmi.js';

const names = [...PROCESS_AREAS.map((pa) => pa.name), ...ALL_GOALS.map((g) => g.name)];

export default { strings: Object.fromEntries(names.map((n) => [n, n])), templates: [] };
