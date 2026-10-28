import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translate, registerDictionary, useLanguage, getLang } from '../js/i18n/i18n.js';
import trParts from '../js/i18n/tr/index.js';
import keep from '../js/i18n/keep.js';
import { PROCESS_AREAS } from '../js/data/tmmi.js';

registerDictionary({
  strings: { 'New game': 'Yeni oyun', 'evening': 'akşam' },
  templates: [['Chapter {0} / 7', 'Bölüm {0} / 7'], ['{0} left this {1}', '{1} için {0} kaldı']],
});

test('English is returned unchanged while the language is en', () => {
  useLanguage('en');
  assert.equal(translate('New game'), 'New game');
});

test('exact strings translate and keep surrounding whitespace', () => {
  useLanguage('tr');
  assert.equal(getLang(), 'tr');
  assert.equal(translate('New game'), 'Yeni oyun');
  assert.equal(translate('  New game '), '  Yeni oyun ');
});

test('templates translate and may reorder their captured values', () => {
  useLanguage('tr');
  assert.equal(translate('Chapter 3 / 7'), 'Bölüm 3 / 7');
  assert.equal(translate('2 h left this evening'), 'akşam için 2 sa kaldı');
});

test('glued sentences, separators and quotes translate piece by piece', () => {
  registerDictionary({ strings: { 'QA lead': 'QA lideri', 'Owns the test plan.': 'Test planının sahibi.', 'Who said it?': 'Kim söyledi?' } });
  useLanguage('tr');
  assert.equal(translate('QA lead · Owns the test plan.'), 'QA lideri · Test planının sahibi.');
  assert.equal(translate('Who said it? Owns the test plan.'), 'Kim söyledi? Test planının sahibi.');
  assert.equal(translate('“Who said it?”'), '“Kim söyledi?”');
  assert.equal(translate('QA lead. Owns the test plan.'), 'QA lideri. Test planının sahibi.');
  assert.equal(translate('Nothing here. Nor here.'), 'Nothing here. Nor here.');
});

test('generic templates do not rewrite untranslated sentences', () => {
  registerDictionary({ templates: [['{0} and {1}', '{0} ve {1}']] });
  useLanguage('tr');
  assert.equal(translate('Deniz and Kerem'), 'Deniz ve Kerem');
  assert.equal(translate('The team writes tests late. Builds and releases are manual.'), 'The team writes tests late. Builds and releases are manual.');
});

test('template values keep bracket pairs and decimal codes intact', () => {
  registerDictionary({
    strings: { 'Draft test policy (wiki)': 'Taslak test politikası (wiki)' },
    templates: [['Request {0}: {1} ({2} min)', 'Talep et {0}: {1} ({2} dk)'], ['{0}: {1} of {2} rated', '{0}: {1}/{2} derecelendirildi']],
  });
  useLanguage('tr');
  assert.equal(translate('Request A: Draft test policy (wiki) (20 min)'), 'Talep et A: Taslak test politikası (wiki) (20 dk)');
  assert.equal(translate('PA 2.1 Test Policy and Strategy: 0 of 3 rated'), 'PA 2.1 Test Policy and Strategy: 0/3 derecelendirildi');
});

test('a paragraph glued after a label matches as one paragraph', () => {
  registerDictionary({ strings: { 'Step 5': 'Adım 5', 'Nobody was singled out. Staff spoke openly.': 'Kimse hedef gösterilmedi. Çalışanlar açıkça konuştu.' } });
  useLanguage('tr');
  assert.equal(translate('Step 5. Nobody was singled out. Staff spoke openly.'), 'Adım 5. Kimse hedef gösterilmedi. Çalışanlar açıkça konuştu.');
});

test('money amounts use Turkish digit grouping', () => {
  registerDictionary({ templates: [['Expert: {0} h · TRY {1}', 'Uzman: {0} sa · {1} TL']] });
  useLanguage('tr');
  assert.equal(translate('Expert: 210 h · TRY 150,000'), 'Uzman: 210 sa · 150.000 TL');
  assert.equal(translate('TRY 30,000'), '30.000 TL');
  assert.equal(translate('5 h 40 min'), '5 sa 40 dk');
  assert.equal(translate('50,000 / 150,000 TRY'), '50.000 / 150.000 TL');
});

test('unknown, empty and non-text values pass through', () => {
  useLanguage('tr');
  assert.equal(translate('Nothing like this exists'), 'Nothing like this exists');
  assert.equal(translate('12:30'), '12:30');
  assert.equal(translate(''), '');
  assert.equal(translate(undefined), undefined);
});

test('an unknown language id is ignored', () => {
  useLanguage('tr');
  assert.equal(useLanguage('xx'), 'tr');
  useLanguage('en');
});

test('Turkish dictionaries are well formed', () => {
  assert.ok(Array.isArray(trParts) && trParts.length > 0);
  const marks = (s) => (s.match(/\{\d+\}/g) || []).sort().join(',');
  for (const part of trParts) {
    for (const [en, tr] of Object.entries(part.strings)) {
      assert.equal(typeof tr, 'string', en);
      assert.notEqual(tr.trim(), '', en);
    }
    for (const [en, tr] of part.templates) assert.equal(marks(en), marks(tr), en);
  }
});

test('Turkish covers the main menu and keeps official TMMi names in English', () => {
  [...trParts, keep].forEach(registerDictionary);
  useLanguage('tr');
  for (const label of ['New game', 'Settings', 'How to play']) assert.notEqual(translate(label), label, label);
  for (const pa of PROCESS_AREAS) {
    assert.equal(translate(pa.name), pa.name, pa.name);
    for (const g of pa.goals) assert.equal(translate(g.name), g.name, g.name);
  }
  assert.equal(translate('Deniz and Kerem'), 'Deniz ve Kerem');
  useLanguage('en');
});
