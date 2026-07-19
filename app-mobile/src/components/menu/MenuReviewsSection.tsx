import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { type Review } from '../../api/client';
import DetailSection from '../DetailSection';
import { GlassCard } from '../ui/GlassCard';
import { t } from '../../engine/translations';
import { getLocaleForLang } from '../../constants/languages';
import type { Menu } from '../../types';
import { colors } from '../../theme';

type ReviewState = {
  reviews: Review[];
  externalReviews: Review[];
  myRatingStaff: number;
  setMyRatingStaff: (n: number) => void;
  myRatingMenu: number;
  setMyRatingMenu: (n: number) => void;
  myRatingSafety: number;
  setMyRatingSafety: (n: number) => void;
  myComment: string;
  setMyComment: (v: string) => void;
  reviewBusy: boolean;
  reviewTab: 'allertgy' | 'google' | 'tripadvisor';
  setReviewTab: (t: 'allertgy' | 'google' | 'tripadvisor') => void;
  submitReview: () => void;
};

type Props = {
  menu: Menu;
  language: string;
  canSubmit: boolean;
  state: ReviewState;
};

export default function MenuReviewsSection({ menu, language, canSubmit, state }: Props) {
  const {
    reviews,
    externalReviews,
    myRatingStaff,
    setMyRatingStaff,
    myRatingMenu,
    setMyRatingMenu,
    myRatingSafety,
    setMyRatingSafety,
    myComment,
    setMyComment,
    reviewBusy,
    reviewTab,
    setReviewTab,
    submitReview,
  } = state;

  const isIt = language === 'it';

  return (
    <>
      <DetailSection
        title={isIt ? 'RECENSIONI' : 'REVIEWS'}
        subtitle={
          isIt
            ? 'Opinioni AllerTgy, Google e TripAdvisor sul locale.'
            : 'AllerTgy, Google, and TripAdvisor ratings for this venue.'
        }
        card={false}
      />
      <View style={styles.box}>
        <View style={styles.header}>
          <Text style={styles.title}>⭐ {t('reviews', language)}</Text>
          {reviews.length > 0 && (
            <View style={styles.avg}>
              <Text style={styles.avgStar}>★</Text>
              <Text style={styles.avgText}>
                {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {(menu.google_rating || menu.tripadvisor_rating) ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {menu.google_rating ? (
              <View style={styles.externalBadge}>
                <Text style={styles.externalBadgeLabel}>🌐 Google</Text>
                <Text style={styles.externalBadgeRating}>{menu.google_rating}★</Text>
                <Text style={styles.externalBadgeCount}>({menu.google_reviews_count})</Text>
              </View>
            ) : null}
            {menu.tripadvisor_rating ? (
              <View style={[styles.externalBadge, { borderColor: '#10b981' }]}>
                <Text style={[styles.externalBadgeLabel, { color: '#059669' }]}>🦉 TripAdvisor</Text>
                <Text style={[styles.externalBadgeRating, { color: '#059669' }]}>{menu.tripadvisor_rating}★</Text>
                <Text style={styles.externalBadgeCount}>({menu.tripadvisor_reviews_count})</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, reviewTab === 'allertgy' && styles.tabBtnActive]}
            onPress={() => setReviewTab('allertgy')}
          >
            <Text style={[styles.tabText, reviewTab === 'allertgy' && styles.tabTextActive]}>
              🥗 AllerTgy ({reviews.length})
            </Text>
          </TouchableOpacity>
          {menu.google_rating ? (
            <TouchableOpacity
              style={[styles.tabBtn, reviewTab === 'google' && { ...styles.tabBtnActive, borderBottomColor: '#3b82f6' }]}
              onPress={() => setReviewTab('google')}
            >
              <Text style={[styles.tabText, reviewTab === 'google' && { ...styles.tabTextActive, color: '#2563eb' }]}>
                🌐 Google
              </Text>
            </TouchableOpacity>
          ) : null}
          {menu.tripadvisor_rating ? (
            <TouchableOpacity
              style={[styles.tabBtn, reviewTab === 'tripadvisor' && { ...styles.tabBtnActive, borderBottomColor: '#10b981' }]}
              onPress={() => setReviewTab('tripadvisor')}
            >
              <Text style={[styles.tabText, reviewTab === 'tripadvisor' && { ...styles.tabTextActive, color: '#059669' }]}>
                🦉 TripAdvisor
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {reviewTab === 'allertgy' && (
          <>
            {reviews.slice(0, 5).map((r) => (
              <GlassCard key={r.id} style={styles.card}>
                <View style={styles.cardHead}>
                  <View style={styles.authorWrap}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {(r.author_name || 'U').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.author}>
                        {r.author_name}{r.is_mine ? t('you', language) : ''}
                      </Text>
                      <Text style={styles.date}>
                        {new Date(r.created_at).toLocaleDateString(getLocaleForLang(language), {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.starsWrap}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Text key={n} style={[styles.starIcon, n > r.rating && styles.starOff]}>★</Text>
                    ))}
                  </View>
                </View>
                {(r.rating_staff || r.rating_menu || r.rating_safety) ? (
                  <View style={styles.breakdown}>
                    {r.rating_staff ? <Text style={styles.breakdownItem}>👤 Staff: {r.rating_staff}★</Text> : null}
                    {r.rating_menu ? <Text style={styles.breakdownItem}>📋 Menù: {r.rating_menu}★</Text> : null}
                    {r.rating_safety ? <Text style={styles.breakdownItem}>🛡️ Sicurezza: {r.rating_safety}★</Text> : null}
                  </View>
                ) : null}
                {r.comment ? <Text style={styles.comment}>{r.comment}</Text> : null}
                {r.reply ? (
                  <View style={styles.replyBox}>
                    <Text style={styles.replyLabel}>💬 {t('restaurant_reply', language)}</Text>
                    <Text style={styles.comment}>{r.reply}</Text>
                  </View>
                ) : null}
              </GlassCard>
            ))}
            {reviews.length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>💬</Text>
                <Text style={styles.empty}>{t('no_reviews', language)}</Text>
                <Text style={styles.emptySub}>{t('be_first_review', language)}</Text>
              </View>
            )}

            {canSubmit && (
              <GlassCard style={styles.form}>
                <View style={styles.formHeader}>
                  <Text style={styles.formEmoji}>✍️</Text>
                  <Text style={styles.formLabel}>La tua esperienza allergie</Text>
                </View>
                <Text style={styles.formSub}>Valuta i 3 aspetti chiave per la sicurezza alimentare</Text>

                <View style={styles.allergyQBox}>
                  <View style={styles.allergyQRow}>
                    <Text style={styles.allergyQLabel}>👤 Attenzione Staff</Text>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <TouchableOpacity key={n} onPress={() => setMyRatingStaff(n)}>
                          <Text style={[styles.starBtn, n > myRatingStaff && styles.starOff]}>⭐</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View style={styles.allergyQRow}>
                    <Text style={styles.allergyQLabel}>📋 Chiarezza Menù</Text>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <TouchableOpacity key={n} onPress={() => setMyRatingMenu(n)}>
                          <Text style={[styles.starBtn, n > myRatingMenu && styles.starOff]}>⭐</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View style={styles.allergyQRow}>
                    <Text style={styles.allergyQLabel}>🛡️ Sicurezza Pasto</Text>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <TouchableOpacity key={n} onPress={() => setMyRatingSafety(n)}>
                          <Text style={[styles.starBtn, n > myRatingSafety && styles.starOff]}>⭐</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                <TextInput
                  style={styles.input}
                  value={myComment}
                  onChangeText={setMyComment}
                  multiline
                  placeholder="Descrivi la tua esperienza con le allergie..."
                  placeholderTextColor={colors.textMuted}
                />
                <TouchableOpacity
                  style={[styles.submit, reviewBusy && { opacity: 0.4 }]}
                  disabled={reviewBusy}
                  onPress={submitReview}
                >
                  {reviewBusy ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitText}>Pubblica recensione AllerTgy</Text>
                  )}
                </TouchableOpacity>
              </GlassCard>
            )}
          </>
        )}

        {reviewTab !== 'allertgy' && (
          <>
            {externalReviews.filter((r) => r.source === reviewTab).length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>🌐</Text>
                <Text style={styles.empty}>Nessuna recensione esterna disponibile</Text>
              </View>
            ) : (
              externalReviews
                .filter((r) => r.source === reviewTab)
                .map((r, idx) => (
                  <GlassCard key={idx} style={styles.card}>
                    <View style={styles.cardHead}>
                      <View style={styles.authorWrap}>
                        <View
                          style={[
                            styles.avatar,
                            { backgroundColor: reviewTab === 'google' ? '#3b82f6' : '#10b981' },
                          ]}
                        >
                          <Text style={styles.avatarText}>
                            {(r.author_name || 'U').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.author}>{r.author_name}</Text>
                          <Text style={styles.date}>
                            {new Date(r.created_at).toLocaleDateString(getLocaleForLang(language), {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.starsWrap}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Text key={n} style={[styles.starIcon, n > r.rating && styles.starOff]}>★</Text>
                        ))}
                      </View>
                    </View>
                    {r.comment ? <Text style={styles.comment}>{r.comment}</Text> : null}
                  </GlassCard>
                ))
            )}
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  box: { marginTop: 24, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: '900', color: colors.onSurface, letterSpacing: -0.3 },
  avg: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 'auto' },
  avgStar: { fontSize: 14, color: '#f59e0b' },
  avgText: { fontSize: 14, fontWeight: '800', color: colors.inkSoft },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  authorWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.brand200,
  },
  avatarText: { fontSize: 15, fontWeight: '800', color: colors.brandDark },
  author: { fontWeight: '700', fontSize: 13, color: colors.onSurface },
  date: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  starsWrap: { flexDirection: 'row', gap: 1 },
  starIcon: { fontSize: 14, color: '#f59e0b' },
  starOff: { color: colors.border },
  comment: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  replyBox: {
    marginTop: 4,
    marginLeft: 8,
    padding: 10,
    backgroundColor: colors.brand50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.brand200,
    gap: 4,
  },
  replyLabel: { fontSize: 10, fontWeight: '800', color: colors.brandDark, textTransform: 'uppercase' },
  emptyBox: {
    alignItems: 'center',
    padding: 24,
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyEmoji: { fontSize: 28 },
  empty: { color: colors.onSurfaceMuted, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  emptySub: { color: colors.textMuted, fontSize: 12, fontWeight: '500', textAlign: 'center' },
  form: {
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
    marginTop: 6,
  },
  formHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  formEmoji: { fontSize: 18 },
  formLabel: { fontWeight: '800', fontSize: 15, color: colors.onSurface },
  formSub: { fontSize: 12, color: colors.textMuted, fontWeight: '500', marginTop: -4 },
  starsRow: { flexDirection: 'row', gap: 6 },
  starBtn: { fontSize: 28 },
  input: {
    minHeight: 80,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    color: colors.onSurface,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  submit: {
    height: 48,
    backgroundColor: colors.brand,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  externalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#eff6ff',
  },
  externalBadgeLabel: { fontSize: 11, fontWeight: '800', color: '#1d4ed8' },
  externalBadgeRating: { fontSize: 13, fontWeight: '900', color: '#1d4ed8' },
  externalBadgeCount: { fontSize: 10, color: colors.textSecondary, fontWeight: '600' },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 8,
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabBtnActive: { borderBottomColor: colors.brand },
  tabText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  tabTextActive: { color: colors.brand },
  allergyQBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    gap: 12,
  },
  allergyQRow: { gap: 4 },
  allergyQLabel: { fontSize: 12, fontWeight: '800', color: colors.inkSoft },
  breakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: colors.brand50,
    borderWidth: 1,
    borderColor: colors.brand200,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  breakdownItem: { fontSize: 11, fontWeight: '700', color: colors.brandDark },
});
