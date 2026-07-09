import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { api, type Review } from '../api/client';
import { t } from '../engine/translations';

export function useMenuReviews(codice: string | undefined, language: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [externalReviews, setExternalReviews] = useState<Review[]>([]);
  const [myRatingStaff, setMyRatingStaff] = useState(5);
  const [myRatingMenu, setMyRatingMenu] = useState(5);
  const [myRatingSafety, setMyRatingSafety] = useState(5);
  const [myComment, setMyComment] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewTab, setReviewTab] = useState<'allertgy' | 'google' | 'tripadvisor'>('allertgy');

  useEffect(() => {
    if (!codice) return;
    api.listReviews(codice)
      .then((rs) => {
        setReviews(rs);
        const mine = rs.find((r) => r.is_mine);
        if (mine) {
          setMyRatingStaff(mine.rating_staff ?? 5);
          setMyRatingMenu(mine.rating_menu ?? 5);
          setMyRatingSafety(mine.rating_safety ?? 5);
          setMyComment(mine.comment ?? '');
        }
      })
      .catch(() => {});
    api.listExternalReviews(codice).then(setExternalReviews).catch(() => {});
  }, [codice]);

  const submitReview = async () => {
    if (!codice) return;
    setReviewBusy(true);
    try {
      const avg = Math.round((myRatingStaff + myRatingMenu + myRatingSafety) / 3);
      await api.upsertReview(codice, avg, myComment.trim(), myRatingStaff, myRatingMenu, myRatingSafety);
      setReviews(await api.listReviews(codice));
      Alert.alert(t('thank_you', language), t('review_published', language));
    } catch (e) {
      Alert.alert(t('error', language), (e as Error).message);
    }
    setReviewBusy(false);
  };

  return {
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
  };
}
