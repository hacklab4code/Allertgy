import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface SmallCardProps {
  title?: string;
  rating?: number;
  discountText?: string;
  imageUrl?: string;
}

export const SmallCard: React.FC<SmallCardProps> = ({
  title = "McDonald's",
  rating = 4.0,
  discountText = '50% OFF up to ₹100',
  imageUrl = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400',
}) => {
  return (
    <View style={styles.mcContainer}>
      {/* Contenitore Immagine */}
      <View style={styles.mcImageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.mcImage}
          resizeMode="cover"
        />

        {/* Badge Sconto in alto a sinistra */}
        <View style={styles.mcDiscountBadge}>
          <Text style={styles.mcDiscountText}>{discountText}</Text>
        </View>
      </View>

      {/* Badge Rating - Posizionato esattamente nello "scavo" */}
      <View style={styles.mcRatingBadge}>
        <Text style={styles.mcRatingText}>{rating.toFixed(1)}</Text>
        <Ionicons name="star-outline" size={12} color="white" />
      </View>

      {/* Titolo */}
      <View style={styles.mcTextContainer}>
        <Text style={styles.mcTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>
    </View>
  );
};

// Export alias McDonaldsCard
export const McDonaldsCard = SmallCard;

const styles = StyleSheet.create({
  mcContainer: {
    width: 170,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingBottom: 16,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  mcImageContainer: {
    height: 140,
    width: '100%',
    position: 'relative',
  },
  mcImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    // IL SEGRETO: un raggio enorme solo su questo angolo per creare lo spazio bianco
    borderBottomLeftRadius: 65,
  },
  mcDiscountBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#3e3a35',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderTopLeftRadius: 24,
    borderBottomRightRadius: 14,
  },
  mcDiscountText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 11,
  },
  mcRatingBadge: {
    position: 'absolute',
    top: 120, // Scende giù per riempire lo spazio bianco lasciato dall'immagine
    left: 14,
    backgroundColor: '#1b6e40',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
  },
  mcRatingText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 4,
  },
  mcTextContainer: {
    paddingHorizontal: 14,
    paddingTop: 22, // Spinge il testo sotto al badge verde
  },
  mcTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#2d333f',
  },
});
