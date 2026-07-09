import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform, SafeAreaView } from 'react-native';
import { useSession } from '../store/session';
import { LANGUAGES } from '../constants/languages';

const SUPPORTED_CODES = ['it', 'en', 'es', 'fr', 'de', 'pt', 'ar', 'zh', 'ja', 'ko', 'ru', 'tr', 'pl', 'nl'];

export default function LanguageFlagsRow() {
  const { language, setLanguage } = useSession();
  const current = (language || 'it').toLowerCase();

  const supportedLanguages = LANGUAGES.filter(l => SUPPORTED_CODES.includes(l.code));

  return (
    <View style={styles.outerContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {supportedLanguages.map((lang) => {
          const isActive = lang.code === current;
          return (
            <TouchableOpacity
              key={lang.code}
              style={[styles.flagButton, isActive && styles.flagButtonActive]}
              onPress={() => setLanguage(lang.code)}
              activeOpacity={0.7}
            >
              <Text style={[styles.flagEmoji, isActive && styles.flagEmojiActive]}>{lang.flag}</Text>
              <Text style={[styles.flagText, isActive && styles.flagTextActive]}>
                {lang.code.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E6EFEA',
    paddingVertical: 10,
    shadowColor: '#0B5D4D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
  },
  container: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  flagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F5F2',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDE8E2',
    gap: 5,
  },
  flagButtonActive: {
    backgroundColor: '#E6F4EA',
    borderColor: '#0F8A6A',
  },
  flagEmoji: {
    fontSize: 18,
  },
  flagEmojiActive: {
    transform: [{ scale: 1.05 }],
  },
  flagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#596B63',
  },
  flagTextActive: {
    color: '#0B5D4D',
    fontWeight: '700',
  },
});
