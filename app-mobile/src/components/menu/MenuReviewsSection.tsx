import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type Review } from '../../api/client';
import DetailSection from '../DetailSection';
import { GlassCard } from '../ui/GlassCard';
import { t } from '../../engine/translations';
import { getLocaleForLang } from '../../constants/languages';
import type { Menu } from '../../types';
import { colors, radius } from '../../theme';

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
  const sourceTabs: Array<{
    id: 'allertgy' | 'google' | 'tripadvisor';
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    visible: boolean;
    color: string;
  }> = [
    { id: 'allertgy', label: `AllerTgy (${reviews.length})`, icon: 'leaf-outline', visible: true, color: colors.brand },
    { id: 'google', label: 'Google', icon: 'logo-google', visible: !!menu.google_rating, color: '#2563eb' },
    { id: 'tripadvisor', label: 'TripAdvisor', icon: 'earth-outline', visible: !!menu.tripadvisor_rating, color: '#059669' },
  ];

  const criteria = [
    { label: 'Attenzione dello staff', icon: 'people-outline' as const, value: myRatingStaff, setValue: setMyRatingStaff },
    { label: 'Chiarezza del menù', icon: 'reader-outline' as const, value: myRatingMenu, setValue: setMyRatingMenu },
    { label: 'Sicurezza del pasto', icon: 'shield-checkmark-outline' as const, value: myRatingSafety, setValue: setMyRatingSafety },
  ];

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
        style={styles.sectionIntro}
      />
      <View style={styles.box}>
        <View style={styles.header}>
          <View style={styles.headingGroup}>
            <View style={styles.headingIcon}>
              <Ionicons name="star" size={15} color="#A66B00" />
            </View>
            <Text style={styles.title}>{t('reviews', language)}</Text>
          </View>
          {reviews.length > 0 && (
            <View style={styles.avg}>
              <Ionicons name="star" size={13} color="#A66B00" />
              <Text style={styles.avgText}>
                {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {(menu.google_rating || menu.tripadvisor_rating) ? (
          <View style={styles.sourceScores}>
            {menu.google_rating ? (
              <View style={[styles.sourceScore, styles.googleScore]}>
                <Ionicons name="logo-google" size={15} color="#2563eb" />
                <Text style={styles.sourceName}>Google</Text>
                <Text style={[styles.sourceRating, { color: '#2563eb' }]}>{menu.google_rating}</Text>
                <Ionicons name="star" size={12} color="#2563eb" />
                <Text style={styles.sourceCount}>{menu.google_reviews_count}</Text>
              </View>
            ) : null}
            {menu.tripadvisor_rating ? (
              <View style={[styles.sourceScore, styles.tripadvisorScore]}>
                <Ionicons name="earth-outline" size={15} color="#059669" />
                <Text style={styles.sourceName}>TripAdvisor</Text>
                <Text style={[styles.sourceRating, { color: '#059669' }]}>{menu.tripadvisor_rating}</Text>
                <Ionicons name="star" size={12} color="#059669" />
                <Text style={styles.sourceCount}>{menu.tripadvisor_reviews_count}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.tabsRow}>
          {sourceTabs.filter((tab) => tab.visible).map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabBtn, reviewTab === tab.id && { ...styles.tabBtnActive, borderBottomColor: tab.color }]}
              onPress={() => setReviewTab(tab.id)}
            >
              <Ionicons name={tab.icon} size={15} color={reviewTab === tab.id ? tab.color : colors.textMuted} />
              <Text style={[styles.tabText, reviewTab === tab.id && { color: tab.color }]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
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
                <View style={styles.emptyIcon}>
                  <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.brand} />
                </View>
                <Text style={styles.empty}>{t('no_reviews', language)}</Text>
                <Text style={styles.emptySub}>{t('be_first_review', language)}</Text>
              </View>
            )}

            {canSubmit && (
              <GlassCard style={styles.form}>
                <View style={styles.formHeader}>
                  <View style={styles.formIcon}>
                    <Ionicons name="heart-outline" size={18} color={colors.brand} />
                  </View>
                  <View style={styles.formCopy}>
                    <Text style={styles.formLabel}>La tua esperienza allergie</Text>
                    <Text style={styles.formSub}>Aiuta chi ha allergie a scegliere con più serenità.</Text>
                  </View>
                </View>

                <View style={styles.allergyQBox}>
                  {criteria.map((criterion, index) => (
                    <View key={criterion.label} style={[styles.allergyQRow, index > 0 && styles.criterionDivider]}>
                      <View style={styles.criterionLabel}>
                        <Ionicons name={criterion.icon} size={16} color={colors.brand} />
                        <Text style={styles.allergyQLabel}>{criterion.label}</Text>
                      </View>
                      <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <TouchableOpacity
                            key={n}
                            onPress={() => criterion.setValue(n)}
                            style={styles.starTap}
                            accessibilityRole="button"
                            accessibilityLabel={`${criterion.label}: ${n} stelle`}
                          >
                            <Ionicons
                              name={n <= criterion.value ? 'star' : 'star-outline'}
                              size={25}
                              color={n <= criterion.value ? '#E7A600' : '#D8D2DF'}
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ))}
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
                <View style={styles.emptyIcon}>
                  <Ionicons name="globe-outline" size={22} color={colors.brand} />
                </View>
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
  sectionIntro: { marginTop: 8 },
  box: { marginTop: 14, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headingGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headingIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF3CF', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 19, fontWeight: '900', color: colors.onSurface, letterSpacing: -0.5 },
  avg: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF9E8', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 99 },
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
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 7,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.brand50, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  empty: { color: colors.onSurfaceMuted, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  emptySub: { color: colors.textMuted, fontSize: 12, fontWeight: '500', textAlign: 'center' },
  form: {
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
    marginTop: 6,
  },
  formHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  formIcon: { width: 35, height: 35, borderRadius: 18, backgroundColor: colors.brand50, alignItems: 'center', justifyContent: 'center' },
  formCopy: { flex: 1, gap: 2 },
  formLabel: { fontWeight: '800', fontSize: 16, color: colors.onSurface },
  formSub: { fontSize: 12, lineHeight: 17, color: colors.textMuted, fontWeight: '500' },
  starsRow: { flexDirection: 'row', marginLeft: 24 },
  starTap: { paddingHorizontal: 2, paddingVertical: 2 },
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
  sourceScores: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sourceScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  googleScore: { backgroundColor: '#F4F8FF', borderColor: '#BBD1FF' },
  tripadvisorScore: { backgroundColor: '#EFFBF7', borderColor: '#9FE2CD' },
  sourceName: { fontSize: 12, fontWeight: '700', color: colors.inkSoft },
  sourceRating: { fontSize: 14, fontWeight: '900', marginLeft: 3 },
  sourceCount: { fontSize: 11, color: colors.textMuted, fontWeight: '600', marginLeft: 2 },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: 2,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 10,
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
    paddingHorizontal: 12,
  },
  allergyQRow: { paddingVertical: 12, gap: 7 },
  criterionDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  criterionLabel: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  allergyQLabel: { fontSize: 13, fontWeight: '800', color: colors.inkSoft },
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
