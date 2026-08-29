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

// --- TEST DIETE (basate su ingredienti reali, non tag fittizi) ---
const vegBurger = {
  nome_piatto: 'Veg Burger',
  descrizione: 'Burger con seitan, verdure grigliate e salsa di soia',
  allergeni_contenuti: ['glutine', 'soia'],
  allergeni_tracce: ['senape'],
};

const pizzaFormaggio = {
  nome_piatto: 'Pizza Margherita',
  descrizione: 'Pizza con pomodoro, mozzarella e basilico',
  allergeni_contenuti: ['glutine', 'latte'],
  allergeni_tracce: [] as string[],
};

const tagliataManzo = {
  nome_piatto: 'Tagliata di manzo',
  descrizione: 'Tagliata di manzo con rucola e grana',
  allergeni_contenuti: ['latte'],
  allergeni_tracce: [] as string[],
};

const insalataMista = {
  nome_piatto: 'Insalata Mista',
  descrizione: 'Lattuga, pomodori, mais e olive',
  allergeni_contenuti: [] as string[],
  allergeni_tracce: [] as string[],
};

// Profilo vegano
assert.equal(calcolaSemaforo(['vegano'], vegBurger).stato, 'verde', 'Veg burger dovrebbe essere verde per vegano');
assert.equal(calcolaSemaforo(['vegano'], pizzaFormaggio).stato, 'rosso', 'Pizza con mozzarella dovrebbe essere rossa per vegano');
assert.equal(calcolaSemaforo(['vegano'], tagliataManzo).stato, 'rosso', 'Tagliata di manzo dovrebbe essere rossa per vegano');
assert.equal(calcolaSemaforo(['vegano'], insalataMista).stato, 'verde', 'Insalata mista dovrebbe essere verde per vegano');

// Profilo vegetariano
assert.equal(calcolaSemaforo(['vegetariano'], vegBurger).stato, 'verde', 'Veg burger dovrebbe essere verde per vegetariano');
assert.equal(calcolaSemaforo(['vegetariano'], pizzaFormaggio).stato, 'verde', 'Pizza margherita dovrebbe essere verde per vegetariano (latte ok)');
assert.equal(calcolaSemaforo(['vegetariano'], tagliataManzo).stato, 'rosso', 'Tagliata di manzo dovrebbe essere rossa per vegetariano');
assert.deepEqual(calcolaSemaforo(['vegetariano'], tagliataManzo).match_contenuti, ['vegetariano'], 'Match vegetariano su tagliata');
assert.equal(calcolaSemaforo(['vegetariano'], insalataMista).stato, 'verde', 'Insalata mista dovrebbe essere verde per vegetariano');


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

// Criterio crudo/cotto: presenza → giallo (non rosso), perché la forma non è nota dal menù
const frittata = { nome_piatto: 'Frittata', allergeni_contenuti: ['uova'], allergeni_tracce: [] as string[] };
assert.equal(calcolaSemaforo(['uova'], frittata).stato, 'rosso', 'Assoluto (default) → rosso');
assert.equal(calcolaSemaforo(['uova'], frittata, [], { uova: 'assoluto' }).stato, 'rosso');
assert.equal(calcolaSemaforo(['uova'], frittata, [], { uova: 'crudo' }).stato, 'giallo', 'Criterio crudo → giallo');
assert.deepEqual(calcolaSemaforo(['uova'], frittata, [], { uova: 'crudo' }).match_criterio, ['uova']);
assert.deepEqual(calcolaSemaforo(['uova'], frittata, [], { uova: 'crudo' }).match_contenuti, []);
assert.equal(calcolaSemaforo(['uova'], frittata, [], { uova: 'cotto' }).stato, 'giallo', 'Criterio cotto → giallo');

console.log('✅ semaforo.test.ts: tutti i test superati');
