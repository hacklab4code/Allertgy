import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export interface LargeCardProps {
  title?: string;
  rating?: number;
  featuredDish?: string;
  price?: string;
  deliveryTime?: string;
  distance?: string;
  discountText?: string;
  tagText?: string;
  imageUrl?: string;
  onBookmark?: () => void;
  onHide?: () => void;
}

export const LargeCard: React.FC<LargeCardProps> = ({
  title = 'Third Wave Coffee',
  rating = 4.4,
  featuredDish = 'Hot Latte',
  price = '₹245',
  deliveryTime = '25–30 mins',
  distance = '1.5 km',
  discountText = '20% OFF up to ₹50',
  tagText = 'Low Plastic Packaging',
  imageUrl = 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600',
  onBookmark,
  onHide,
}) => {
  return (
    <View style={styles.twContainer}>
      {/* Sezione Immagine */}
      <View style={styles.twImageWrapper}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.twImage}
          resizeMode="cover"
        />

        {/* Maschera Bianca per l'effetto Onda (Swoosh) */}
        <View style={styles.twWaveMask} />

        {/* Badge in alto a sinistra */}
        <View style={styles.twTopLeftBadge}>
          <Text style={styles.twTopLeftText}>
            {featuredDish} • {price}
          </Text>
        </View>

        {/* Icone in alto a destra */}
        <View style={styles.twTopRightIcons}>
          <TouchableOpacity onPress={onBookmark} style={{ marginRight: 12 }}>
            <Ionicons name="bookmark-outline" size={22} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onHide}>
            <Ionicons name="eye-off-outline" size={22} color="white" />
          </TouchableOpacity>
        </View>

        {/* Badge "Ad" */}
        <View style={styles.twAdBadge}>
          <Text style={styles.twAdText}>Ad</Text>
        </View>

        {/* Pallini del Carosello */}
        <View style={styles.twCarouselDots}>
          <View style={[styles.twDot, styles.twDotActive]} />
          <View style={styles.twDot} />
          <View style={styles.twDot} />
          <View style={styles.twDot} />
        </View>
      </View>

      {/* Sezione Contenuto Inferiore */}
      <View style={styles.twContent}>
        {/* Tempo e Distanza */}
        <View style={styles.twInfoRow}>
          <Ionicons name="time-outline" size={14} color="#6b7280" />
          <Text style={styles.twInfoText}>
            {deliveryTime} • {distance}
          </Text>
        </View>

        {/* Titolo e Rating */}
        <View style={styles.twTitleRow}>
          <Text style={styles.twTitle}>{title}</Text>
          <View style={styles.twRatingBadge}>
            <Text style={styles.twRatingText}>{rating.toFixed(1)}</Text>
            <Ionicons name="star" size={10} color="white" />
          </View>
        </View>

        {/* Sconto */}
        <View style={styles.twDiscountRow}>
          <MaterialCommunityIcons name="brightness-percent" size={16} color="#2563eb" />
          <Text style={styles.twDiscountDesc}>{discountText}</Text>
        </View>

        {/* Divisore Tratteggiato */}
        <View style={styles.twDivider} />

        {/* Tag finale */}
        <View style={styles.twPackagingTag}>
          <Ionicons name="checkmark" size={14} color="#1f7041" />
          <Text style={styles.twPackagingText}>{tagText}</Text>
        </View>
      </View>
    </View>
  );
};

// Export alias ThirdWaveCard
export const ThirdWaveCard = LargeCard;

const styles = StyleSheet.create({
  twContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  twImageWrapper: {
    height: 220,
    width: '100%',
    position: 'relative',
  },
  twImage: {
    width: '100%',
    height: '100%',
  },
  twWaveMask: {
    position: 'absolute',
    bottom: -1, // Sovrappone un pixel extra per evitare linee di rendering
    left: 0,
    width: '45%',
    height: 20,
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 20, // Crea la curva concava verso destra
  },
  twTopLeftBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  twTopLeftText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  twTopRightIcons: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
  },
  twAdBadge: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  twAdText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  twCarouselDots: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  twDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  twDotActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  twContent: {
    padding: 16,
    paddingTop: 8,
  },
  twInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  twInfoText: {
    color: '#6b7280',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  twTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  twTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1f2937',
  },
  twRatingBadge: {
    backgroundColor: '#1f7041',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  twRatingText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
    marginRight: 2,
  },
  twDiscountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  twDiscountDesc: {
    color: '#4b5563',
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '700',
  },
  twDivider: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#e5e7eb',
    width: '100%',
    marginBottom: 12,
  },
  twPackagingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    alignSelf: 'flex-start',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  twPackagingText: {
    color: '#6b7280',
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '600',
  },
});
