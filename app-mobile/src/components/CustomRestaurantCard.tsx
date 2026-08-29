import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

export interface RestaurantCardProps {
  title?: string;
  rating?: string;
  location?: string;
  reviews?: string;
  imageUrl?: string;
  discountText?: string;
  isAvailable?: boolean;
  appBgColor?: string; // IMPORTANTE: deve essere uguale al bg dello schermo
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  // Parametri opzionali per calibrare lo scavo al millimetro
  cutoutWidth?: number;
  cutoutHeight?: number;
}

export const RestaurantCardNativeWind = ({
  title = 'Trattoria Da Matteo',
  rating = '4.5',
  location = 'Milano',
  reviews = '312',
  imageUrl = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=400',
  discountText = '75%',
  isAvailable = true,
  appBgColor = '#F4F3F8',
  isFavorite = true,
  onToggleFavorite,
  cutoutWidth = 100,
  cutoutHeight = 70,
}: RestaurantCardProps) => {
  // Tracciato Bézier dinamico modulabile
  const cX1 = Math.round(cutoutWidth * 0.45);
  const cY1 = cutoutHeight;
  const cX2 = 0;
  const cY2 = Math.round(cutoutHeight * 0.5);

  const svgPath = `M0,${cutoutHeight} L${cutoutWidth},${cutoutHeight} C${cX1},${cY1} ${cX2},${cY2} 0,0 Z`;

  return (
    <View className="w-[165px] mr-3">
      {/* 
        1. Wrapper Immagine 
        Arrotondamento generale r=22
      */}
      <View className="relative w-full h-[165px] rounded-[22px] overflow-hidden">
        <Image
          source={{ uri: imageUrl }}
          className="w-full h-full object-cover"
        />

        {/* Cuore Preferiti in alto a destra */}
        <TouchableOpacity
          onPress={onToggleFavorite}
          activeOpacity={0.8}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/30 items-center justify-center"
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={14}
            color="#ff5252"
          />
        </TouchableOpacity>

        {/* 
          2. SVG Overlay ("Lo Scavo")
          Disegna la curva concava a Bézier del colore di sfondo dello schermo
        */}
        <View
          className="absolute bottom-0 left-0"
          style={{ width: cutoutWidth, height: cutoutHeight }}
          pointerEvents="none"
        >
          <Svg width="100%" height="100%" viewBox={`0 0 ${cutoutWidth} ${cutoutHeight}`}>
            <Path d={svgPath} fill={appBgColor} />
          </Svg>
        </View>

        {/* 3. Badge Sconto posizionato dentro lo scavo */}
        <View 
          className={`absolute bottom-2 left-2 flex-row items-center rounded-full px-2 py-1 border ${
            isAvailable 
              ? 'bg-[#eef9f2] border-[#d1f2d9]' 
              : 'bg-[#f3f4f6] border-[#e5e7eb]'
          }`}
        >
          <View 
            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
              isAvailable ? 'bg-[#00c853]' : 'bg-[#9ca3af]'
            }`} 
          />
          <Text 
            className={`text-[11px] font-bold ${
              isAvailable ? 'text-[#0a7a36]' : 'text-[#6b7280]'
            }`}
          >
            {discountText}
          </Text>
        </View>
      </View>

      {/* 4. Dettagli Ristorante (Sotto l'immagine) */}
      <View className="pt-2 px-1">
        {/* Titolo Locale su 2 righe per massima leggibilità */}
        <Text className="text-[14.5px] font-extrabold text-[#1F1635] leading-tight" numberOfLines={2}>
          {title}
        </Text>

        {/* Recensioni a sinistra, Stelle a destra */}
        <View className="flex-row items-center justify-between mt-1">
          {reviews ? (
            <Text className="text-[11px] text-[#71717A] font-semibold">
              {reviews} recensioni
            </Text>
          ) : <View />}
          <View className="flex-row items-center bg-[#FFF8E7] px-1.5 py-0.5 rounded-md">
            <Ionicons name="star" size={10} color="#F59E0B" />
            <Text className="text-[11px] font-bold text-[#D97706] ml-1">{rating}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export const CustomRestaurantCard = RestaurantCardNativeWind;
