/** Test collegamenti allergeni — esegui con: npm test */
import assert from 'node:assert';
import {
  expandAllergieCodes,
  getLinkedAllergens,
  toggleAllergieSelection,
} from './allergyLinks.ts';

// Esempio utente: arachidi → noce moscata (+ lupini)
const arachidiLinked = getLinkedAllergens('arachidi');
assert.ok(arachidiLinked.includes('noce_moscata'), 'arachidi deve collegare noce moscata');
assert.ok(arachidiLinked.includes('lupini'), 'arachidi deve collegare lupini');

const afterArachidi = toggleAllergieSelection(new Set(), 'arachidi');
assert.ok(afterArachidi.has('arachidi'));
assert.ok(afterArachidi.has('noce_moscata'));
assert.ok(afterArachidi.has('lupini'));

// Deselezionando arachidi si rimuovono i correlati
const afterDeselect = toggleAllergieSelection(afterArachidi, 'arachidi');
assert.equal(afterDeselect.size, 0);

// Figlio → padre, senza fratelli
const afterMandorle = toggleAllergieSelection(new Set(), 'mandorle');
assert.ok(afterMandorle.has('mandorle'));
assert.ok(afterMandorle.has('frutta_a_guscio'));
assert.ok(!afterMandorle.has('noci'), 'mandorle non deve selezionare altre noci');

// Padre → tutti i figli
const afterFrutta = toggleAllergieSelection(new Set(), 'frutta_a_guscio');
assert.ok(afterFrutta.has('mandorle'));
assert.ok(afterFrutta.has('noci'));
assert.ok(afterFrutta.has('noce_moscata'));

// Rimuovere un figlio lascia il padre se altri figli restano
const partial = toggleAllergieSelection(afterFrutta, 'mandorle');
assert.ok(partial.has('frutta_a_guscio'));
assert.ok(!partial.has('mandorle'));

// Ultimo figlio rimosso → rimuove anche il padre
let onlyMandorle = toggleAllergieSelection(new Set(), 'frutta_a_guscio');
onlyMandorle = toggleAllergieSelection(onlyMandorle, 'mandorle');
for (const child of ['nocciole', 'noci', 'noci_pecan', 'noci_brasiliane', 'pistacchi', 'anacardi', 'castagne', 'pinoli', 'macadamia']) {
  onlyMandorle = toggleAllergieSelection(onlyMandorle, child);
}
assert.ok(!onlyMandorle.has('frutta_a_guscio'));

assert.deepEqual(
  expandAllergieCodes(['arachidi']).sort(),
  ['arachidi', 'lupini', 'noce_moscata'].sort(),
);

console.log('allergyLinks: tutti i test passati');
