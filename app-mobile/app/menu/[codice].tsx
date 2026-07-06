import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { api } from '../../src/api/client';
import DishCard from '../../src/components/DishCard';
import { calcolaSemaforo, type EsitoSemaforo } from '../../src/engine/semaforo';
import { useSession } from '../../src/store/session';
import type { Menu, Piatto } from '../../src/types';
import { t, tSummary } from '../../src/engine/translations';

type Filtro = 'tutti' | 'verde' | 'giallo' | 'rosso';

interface Valutato { p: Piatto; esito: EsitoSemaforo }

const SEZIONI: { stato: 'verde' | 'giallo' | 'rosso' }[] = [
  { stato: 'verde' },
  { stato: 'giallo' },
  { stato: 'rosso' },
];

const getSezioneTitolo = (stato: 'verde' | 'giallo' | 'rosso', lang: 'it' | 'en') => {
  if (lang === 'it') {
    return stato === 'verde' ? '✅ Puoi mangiare'
         : stato === 'giallo' ? '⚠️ Con attenzione'
         : '⛔ Non puoi mangiare';
  } else {
    return stato === 'verde' ? '✅ Safe to eat'
         : stato === 'giallo' ? '⚠️ With caution'
         : '⛔ Do not eat';
  }
};

const getSezioneSotto = (stato: 'verde' | 'giallo' | 'rosso', lang: 'it' | 'en') => {
  if (lang === 'it') {
    return stato === 'verde' ? 'Nessuno dei tuoi allergeni in questi piatti'
         : stato === 'giallo' ? 'Possibili tracce: chiedi conferma al personale'
         : 'Contengono i tuoi allergeni: da evitare';
  } else {
    return stato === 'verde' ? 'None of your allergens in these dishes'
         : stato === 'giallo' ? 'Possible traces: confirm with staff'
         : 'Contains your allergens: avoid';
  }
};

export default function MenuScreen() {
  const { codice } = useLocalSearchParams<{ codice: string }>();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('tutti');
  const [isOffline, setIsOffline] = useState(false);
  const { allergie, addRecent, toggleFavorite, favorites, language, ingredientiEsclusi } = useSession();
  const isFav = !!codice && favorites.some((f) => f.code === codice);
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  useEffect(() => {
    if (!codice) return;
    api.menu(codice)
      .then((m) => {
        setMenu(m);
        addRecent(codice, m.nome_ristorante);
        setIsOffline(false);
      })
      .catch(async (e) => {
        try {
          const cachedJson = await AsyncStorage.getItem(`menu_cache_${codice}`);
          if (cachedJson) {
            const cachedMenu = JSON.parse(cachedJson);
            setMenu(cachedMenu);
            setIsOffline(true);
            return;
          }
        } catch (cacheErr) {
          console.warn("Errore lettura cache locale:", cacheErr);
        }
        setError(e.message);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codice]);

  const valutati: Valutato[] = useMemo(() => {
    if (!menu) return [];
    return menu.piatti.map((p) => ({ p, esito: calcolaSemaforo(allergie, p, ingredientiEsclusi) }));
  }, [menu, allergie, ingredientiEsclusi]);

  const menuGroups = useMemo(() => {
    if (!menu) return [];
    const groups = Array.from(new Set(menu.piatti.map((p) => p.menu_group || 'Principale')));
    return groups;
  }, [menu]);

  useEffect(() => {
    if (menu && menuGroups.length > 0 && !selectedGroup) {
      setSelectedGroup(menuGroups[0]);
    }
  }, [menu, menuGroups, selectedGroup]);

  const valutatiFiltrati = useMemo(() => {
    if (menuGroups.length <= 1) return valutati;
    return valutati.filter((v) => (v.p.menu_group || 'Principale') === selectedGroup);
  }, [valutati, selectedGroup, menuGroups]);

  const conta = (s: 'verde' | 'giallo' | 'rosso') =>
    valutatiFiltrati.filter((v) => v.esito.stato === s).length;

  const FilterChip = ({ f, label }: { f: Filtro; label: string }) => (
    <TouchableOpacity
      style={[styles.fchip, filtro === f && styles.fchipOn]}
      onPress={() => setFiltro(f)}
    >
      <Text style={[styles.fchipText, filtro === f && styles.fchipTextOn]}>{label}</Text>
    </TouchableOpacity>
  );

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }
  if (!menu) return <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#059669" />;

  return (
    <>
      <Stack.Screen options={{ title: menu.nome_ristorante }} />
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            {t('offline_warning', language)}
          </Text>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.container} stickyHeaderIndices={[menuGroups.length > 1 ? 2 : 1]}>
        {/* Riepilogo */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTitle}>{menu.nome_ristorante}{menu.citta ? ` · ${menu.citta}` : ''}</Text>
            <TouchableOpacity onPress={() => codice && toggleFavorite(codice, menu.nome_ristorante)}>
              <Text style={{ fontSize: 22 }}>{isFav ? '⭐️' : '☆'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.summaryText}>
            {tSummary(language, conta('verde'), conta('giallo'), conta('rosso'))}
          </Text>
          <Text style={styles.reminder}>{t('reminder', language)}</Text>
        </View>

        {/* Schede Gruppi Menù (se multipli) */}
        {menuGroups.length > 1 && (
          <View style={styles.groupTabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupTabsScroll}>
              {menuGroups.map((g) => {
                const active = selectedGroup === g;
                return (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setSelectedGroup(g)}
                    style={[styles.groupTab, active && styles.groupTabActive]}
                  >
                    <Text style={[styles.groupTabText, active && styles.groupTabTextActive]}>
                      {g.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Filtri (sticky) */}
        <View style={styles.filters}>
          <FilterChip f="tutti" label={`${t('all', language)} (${valutatiFiltrati.length})`} />
          <FilterChip f="verde" label={`🟢 ${t('yes', language)} (${conta('verde')})`} />
          <FilterChip f="giallo" label={`🟡 (${conta('giallo')})`} />
          <FilterChip f="rosso" label={`🔴 ${t('no', language)} (${conta('rosso')})`} />
        </View>

        {/* Sezioni: cosa puoi / attenzione / cosa non puoi, divise per categoria */}
        {SEZIONI.filter((s) => filtro === 'tutti' || filtro === s.stato).map((sez) => {
          const items = valutatiFiltrati.filter((v) => v.esito.stato === sez.stato);
          if (items.length === 0) return null;

          // raggruppa per categoria (antipasti, primi, ...) mantenendo l'ordine del menù
          const categorie: { nome: string; piatti: Valutato[] }[] = [];
          for (const it of items) {
            const nome = it.p.categoria?.trim() || (language === 'it' ? 'Altro' : 'Other');
            const g = categorie.find((c) => c.nome === nome);
            g ? g.piatti.push(it) : categorie.push({ nome, piatti: [it] });
          }

          return (
            <View key={sez.stato} style={styles.section}>
              <Text style={styles.sectionTitle}>{getSezioneTitolo(sez.stato, language)} ({items.length})</Text>
              <Text style={styles.sectionSub}>{getSezioneSotto(sez.stato, language)}</Text>
              {categorie.map((cat) => (
                <View key={cat.nome}>
                  {(categorie.length > 1 || (cat.nome !== 'Altro' && cat.nome !== 'Other')) && (
                    <Text style={styles.catTitle}>{cat.nome.toUpperCase()}</Text>
                  )}
                  {cat.piatti.map(({ p, esito }) => (
                    <DishCard key={p.id} piatto={p} esito={esito} />
                  ))}
                </View>
              ))}
            </View>
          );
        })}

        {valutatiFiltrati.length === 0 && (
          <Text style={styles.empty}>{t('empty_menu', language)}</Text>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  offlineBanner: {
    backgroundColor: '#fef3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#fcd34d',
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineText: {
    color: '#78350f',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  container: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', padding: 24 },
  error: { color: '#dc2626', textAlign: 'center', fontSize: 16 },
  summary: {
    backgroundColor: '#f0fdf4', borderRadius: 20, padding: 16, marginBottom: 12,
    borderWidth: 1.5, borderColor: '#bbf7d0',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.02,
    shadowRadius: 16,
    elevation: 2,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryTitle: { fontWeight: '900', fontSize: 18, color: '#166534', flex: 1, letterSpacing: -0.3 },
  catTitle: {
    fontSize: 12, fontWeight: '800', color: '#94a3b8',
    letterSpacing: 1, marginTop: 16, marginBottom: 8,
  },
  summaryText: { color: '#14532d', marginTop: 6, lineHeight: 20, fontSize: 13, fontWeight: '500' },
  reminder: { fontSize: 12, color: '#15803d', marginTop: 8, fontWeight: '700' },
  filters: {
    flexDirection: 'row', gap: 8, paddingVertical: 10,
    backgroundColor: '#f8fafc',
  },
  fchip: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 999,
    paddingVertical: 8, paddingHorizontal: 14, backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  fchipOn: { borderColor: '#10b981', backgroundColor: '#e8f8ee' },
  fchipText: { fontSize: 12, color: '#64748b', fontWeight: '700' },
  fchipTextOn: { color: '#15803d', fontWeight: '800' },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', letterSpacing: -0.3 },
  sectionSub: { fontSize: 12, color: '#64748b', marginBottom: 10, marginTop: 3 },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 40 },
  groupTabsContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 10,
    marginBottom: 8,
    borderRadius: 12,
  },
  groupTabsScroll: {
    paddingHorizontal: 8,
    gap: 8,
  },
  groupTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  groupTabActive: {
    backgroundColor: '#e8f8ee',
    borderColor: '#22c55e',
  },
  groupTabText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
  },
  groupTabTextActive: {
    color: '#15803d',
  },
});
