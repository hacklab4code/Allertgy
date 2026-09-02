/**
 * Costanti di layout condivise — posizione, clearance, touch target.
 * Non dipendono dallo stile visivo (colori, font).
 */
export const TAB_BAR_HEIGHT = 66;
/** Altezza pill dock — stesso valore di GlassTabBar BAR_H. */
export const TAB_BAR_PILL_HEIGHT = 56;
/** Raggio angoli tab bar (= pill height / 2). Allineato a radius.bar / radius.md. */
export const TAB_BAR_CORNER_RADIUS = TAB_BAR_PILL_HEIGHT / 2;
export const TAB_BAR_FLOAT_OFFSET = 0;
/** Legacy — tab gooey non usa più ScanSphere */
export const SCAN_SPHERE_SIZE = 60;
/** Spazio verticale riservato alla barra SOS / titolo / notifiche */
export const HEADER_FLOAT_CLEARANCE = 78;

/** Altezza unica barra di ricerca (Home, Locali, …) */
export const SEARCH_BAR_HEIGHT = 52;

/** Spazio inferiore: pill floating + cerchio + alone soft */
export const TAB_BAR_CLEARANCE = 140;

/** Apple HIG / Material — target minimo consigliato */
export const MIN_TOUCH_TARGET = 44;

/** Altezza minima chip filtro e toggle secondari */
export const CHIP_MIN_HEIGHT = 40;

/** Gap verticale standard tra blocchi di sezione in scroll */
export const SECTION_GAP = 24;

/** Padding orizzontale schermate tab */
export const SCREEN_PADDING_H = 24;
