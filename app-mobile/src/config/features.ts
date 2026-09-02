/**
 * Configurazione Feature Flags per AllerTgy.
 * 
 * FASE 1 (Attuale): Lancio 100% gratuito per Utenti e Famiglie.
 * FASE 2 (Futura): Piani in abbonamento e Portale Ristoratori B2B.
 */
export const FEATURES = {
  /** Se true, abilita la registrazione e l'accesso dedicato ai Ristoratori (B2B). */
  ENABLE_OWNER_PORTAL: false,
  /** Se true, abilita la gestione e i paywall dei piani in abbonamento a pagamento. */
  ENABLE_PAID_SUBSCRIPTIONS: false,
};
