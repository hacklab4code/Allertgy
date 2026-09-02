import assert from 'node:assert/strict';
import {
  SEMAFORO_TOKENS,
  BRAND_TOKENS,
  normalizeSemaforoStatus,
} from '../designTokens.ts';

console.log('🧪 Avvio test Semaforo Tokens & Design System...');

// 1. Verifica coerenza semaforo assoluto
assert.equal(SEMAFORO_TOKENS.safe.solid, '#10B981', 'Verde safe deve essere #10B981');
assert.equal(SEMAFORO_TOKENS.safe.soft, '#ECFDF5', 'Verde soft deve essere #ECFDF5');
assert.equal(SEMAFORO_TOKENS.safe.text, '#065F46', 'Verde text deve essere #065F46');

assert.equal(SEMAFORO_TOKENS.warning.solid, '#F59E0B', 'Giallo warning deve essere #F59E0B');
assert.equal(SEMAFORO_TOKENS.warning.soft, '#FFFBEB', 'Giallo soft deve essere #FFFBEB');
assert.equal(SEMAFORO_TOKENS.warning.text, '#92400E', 'Giallo text deve essere #92400E');

assert.equal(SEMAFORO_TOKENS.danger.solid, '#EF4444', 'Rosso danger deve essere #EF4444');
assert.equal(SEMAFORO_TOKENS.danger.soft, '#FEF2F2', 'Rosso soft deve essere #FEF2F2');
assert.equal(SEMAFORO_TOKENS.danger.text, '#991B1B', 'Rosso text deve essere #991B1B');

// 2. Verifica normalizzazione status
assert.equal(normalizeSemaforoStatus('safe'), 'safe');
assert.equal(normalizeSemaforoStatus('green'), 'safe');
assert.equal(normalizeSemaforoStatus('VERDE'), 'safe');
assert.equal(normalizeSemaforoStatus('idoneo'), 'safe');

assert.equal(normalizeSemaforoStatus('warning'), 'warning');
assert.equal(normalizeSemaforoStatus('yellow'), 'warning');
assert.equal(normalizeSemaforoStatus('GIALLO'), 'warning');
assert.equal(normalizeSemaforoStatus('attenzione'), 'warning');

assert.equal(normalizeSemaforoStatus('danger'), 'danger');
assert.equal(normalizeSemaforoStatus('red'), 'danger');
assert.equal(normalizeSemaforoStatus('ROSSO'), 'danger');
assert.equal(normalizeSemaforoStatus('non idoneo'), 'danger');

assert.equal(normalizeSemaforoStatus('unknown'), 'neutral');
assert.equal(normalizeSemaforoStatus(null), 'neutral');

// 3. Brand action (Cosmic #23212C + Vanilla #F1FEC8)
assert.equal(BRAND_TOKENS.primary, '#23212C', 'Brand primary deve essere Cosmic #23212C');
assert.equal(BRAND_TOKENS.light, '#F1FEC8', 'Brand light deve essere Vanilla #F1FEC8');
assert.deepEqual(BRAND_TOKENS.premiumGradient, ['#121118', '#23212C', '#353344'], 'Premium gradient deve essere cosmic dark');

console.log('✅ Tutti i test sui Token Semaforo, Brand Tokens e Normalizzazione sono superati!');
