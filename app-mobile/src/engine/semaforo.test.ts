/** Test motore semaforo — esegui con: npm test (Node >= 22) */
import assert from 'node:assert';
import { calcolaSemaforo } from './semaforo.ts';

const carbonara = {
  allergeni_contenuti: ['glutine', 'uova', 'latte'],
  allergeni_tracce: [] as string[],
};
const risotto = {
  allergeni_contenuti: ['latte'],
  allergeni_tracce: ['sedano'],
};
const grigliata = {
  allergeni_contenuti: [] as string[],
  allergeni_tracce: ['solfiti'],
};

// utente allergico a latte → rosso su carbonara e risotto
assert.equal(calcolaSemaforo(['latte'], carbonara).stato, 'rosso');
assert.deepEqual(calcolaSemaforo(['latte'], carbonara).match_contenuti, ['latte']);
assert.equal(calcolaSemaforo(['latte'], risotto).stato, 'rosso');

// utente allergico a sedano → giallo su risotto (solo tracce)
assert.equal(calcolaSemaforo(['sedano'], risotto).stato, 'giallo');
assert.deepEqual(calcolaSemaforo(['sedano'], risotto).match_tracce, ['sedano']);

// utente allergico a solfiti → giallo su grigliata, verde su carbonara
assert.equal(calcolaSemaforo(['solfiti'], grigliata).stato, 'giallo');
assert.equal(calcolaSemaforo(['solfiti'], carbonara).stato, 'verde');

// nessuna allergia → tutto verde
assert.equal(calcolaSemaforo([], carbonara).stato, 'verde');

// contenuto vince su traccia (rosso > giallo)
assert.equal(calcolaSemaforo(['latte', 'sedano'], risotto).stato, 'rosso');

// piatto senza allergeni → verde
assert.equal(
  calcolaSemaforo(['glutine'], { allergeni_contenuti: [], allergeni_tracce: [] }).stato,
  'verde',
);

// --- TEST DIETE ---
const insalataVegan = {
  nome_piatto: 'Insalata Greca Vegana',
  descrizione: 'Insalata con finto formaggio vegano, olive e pomodori',
  allergeni_contenuti: ['vegano'],
  allergeni_tracce: [] as string[],
};

const insalataVegetariana = {
  nome_piatto: 'Insalata Greca Vegetariana',
  descrizione: 'Insalata con feta greca e cetrioli',
  allergeni_contenuti: ['vegetariano'],
  allergeni_tracce: [] as string[],
};

const carbonaraNonVegan = {
  nome_piatto: 'Carbonara',
  descrizione: 'Pasta con uovo e guanciale',
  allergeni_contenuti: ['glutine', 'uova'],
  allergeni_tracce: [] as string[],
};

// Profilo vegano
assert.equal(calcolaSemaforo(['vegano'], insalataVegan).stato, 'verde');
assert.equal(calcolaSemaforo(['vegano'], insalataVegetariana).stato, 'rosso');
assert.deepEqual(calcolaSemaforo(['vegano'], insalataVegetariana).match_contenuti, ['vegano']);
assert.equal(calcolaSemaforo(['vegano'], carbonaraNonVegan).stato, 'rosso');

// Profilo vegetariano
assert.equal(calcolaSemaforo(['vegetariano'], insalataVegan).stato, 'verde');
assert.equal(calcolaSemaforo(['vegetariano'], insalataVegetariana).stato, 'verde');
assert.equal(calcolaSemaforo(['vegetariano'], carbonaraNonVegan).stato, 'rosso');
assert.deepEqual(calcolaSemaforo(['vegetariano'], carbonaraNonVegan).match_contenuti, ['vegetariano']);


// --- TEST INGREDIENTI ESCLUSI ---
const piattoConCipolla = {
  nome_piatto: 'Zuppa di cipolla',
  descrizione: 'Cipolla stufata con brodo vegetale',
  allergeni_contenuti: [] as string[],
  allergeni_tracce: [] as string[],
};

const piattoConAglio = {
  nome_piatto: 'Bruschetta',
  descrizione: 'Pane con aglio e pomodorini freschi',
  allergeni_contenuti: ['glutine'],
  allergeni_tracce: [] as string[],
};

// Escludi cipolla
assert.equal(calcolaSemaforo([], piattoConCipolla, ['cipolla']).stato, 'rosso');
assert.deepEqual(calcolaSemaforo([], piattoConCipolla, ['cipolla']).match_esclusi, ['cipolla']);

// Escludi aglio (nella descrizione)
assert.equal(calcolaSemaforo([], piattoConAglio, ['aglio']).stato, 'rosso');
assert.deepEqual(calcolaSemaforo([], piattoConAglio, ['aglio']).match_esclusi, ['aglio']);

// Escludi aglio + cipolla
assert.equal(calcolaSemaforo([], carbonara, ['aglio']).stato, 'verde');


console.log('✅ semaforo.test.ts: tutti i test superati');
