import React, { useCallback, useEffect, useState } from 'react';
import {
  Clipboard,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { DebossedInput } from './DebossedInput';
import { SurfaceButton } from './SurfaceButton';
import { colors, font, radius, softShadow, spacing } from '../../theme';

export interface MenuScanModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPhoto: () => void;
  onSelectGallery: () => void;
  onAnalyzeUrl: (url: string) => Promise<void> | void;
  analyzing?: boolean;
  isIt?: boolean;
  initialMode?: 'select' | 'url';
}

export function MenuScanModal({
  visible,
  onClose,
  onSelectPhoto,
  onSelectGallery,
  onAnalyzeUrl,
  analyzing = false,
  isIt = true,
  initialMode = 'select',
}: MenuScanModalProps) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'select' | 'url'>(initialMode);
  const [urlInput, setUrlInput] = useState('');
  const [hasClipboardText, setHasClipboardText] = useState(false);

  useEffect(() => {
    if (visible) {
      setMode(initialMode);
      setUrlInput('');
      checkClipboard();
    }
  }, [visible, initialMode]);

  const checkClipboard = async () => {
    try {
      const text = await Clipboard.getString();
      setHasClipboardText(Boolean(text && text.trim().length > 3));
    } catch {
      setHasClipboardText(false);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await Clipboard.getString();
      if (text && text.trim()) {
        setUrlInput(text.trim());
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      // ignore
    }
  };

  const isValidUrl = useCallback((str: string) => {
    const trimmed = str.trim();
    if (!trimmed) return false;
    return (
      /^https?:\/\/.+/i.test(trimmed) ||
      /^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(trimmed)
    );
  }, []);

  const handleConfirmUrl = () => {
    if (!urlInput.trim() || analyzing) return;
    Keyboard.dismiss();
    onAnalyzeUrl(urlInput.trim());
  };

  const handleSelectOption = (type: 'photo' | 'gallery' | 'url') => {
    void Haptics.selectionAsync();
    if (type === 'photo') {
      onClose();
      onSelectPhoto();
    } else if (type === 'gallery') {
      onClose();
      onSelectGallery();
    } else if (type === 'url') {
      setMode('url');
    }
  };

  const isUrlValid = isValidUrl(urlInput);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            {/* Sheet Handle */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHandle} />
              <View style={styles.titleRow}>
                {mode === 'url' && (
                  <TouchableOpacity
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setMode('select');
                    }}
                    style={styles.backBtn}
                    hitSlop={8}
                  >
                    <Ionicons name="arrow-back" size={20} color={colors.onSurface} />
                  </TouchableOpacity>
                )}

                <AppText variant="bodyBold" color={colors.onSurface} style={styles.titleText}>
                  {mode === 'select'
                    ? (isIt ? 'Analizza menù con AI' : 'Analyze menu with AI')
                    : (isIt ? 'Link menù online' : 'Online menu link')}
                </AppText>

                <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
                  <Ionicons name="close" size={18} color={colors.onSurfaceMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {mode === 'select' ? (
              <ScrollView
                bounces={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.body}
              >
                <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.hintText}>
                  {isIt
                    ? 'Scatta una foto, carica un\'immagine già fatta oppure incolla il link del menù online.'
                    : 'Take a photo, upload an existing image, or paste an online menu link.'}
                </AppText>

                <View style={styles.optionsGroup}>
                  {/* Option 1: Scatta foto */}
                  <TouchableOpacity
                    style={styles.optionRow}
                    onPress={() => handleSelectOption('photo')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionIconWrap}>
                      <Ionicons name="camera-outline" size={20} color={colors.brand} />
                    </View>
                    <AppText variant="body" color={colors.onSurface} style={styles.optionLabel}>
                      {isIt ? 'Scatta foto' : 'Take photo'}
                    </AppText>
                    <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceMuted} />
                  </TouchableOpacity>

                  {/* Option 2: Carica dalla galleria */}
                  <TouchableOpacity
                    style={styles.optionRow}
                    onPress={() => handleSelectOption('gallery')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionIconWrap}>
                      <Ionicons name="images-outline" size={20} color={colors.brand} />
                    </View>
                    <AppText variant="body" color={colors.onSurface} style={styles.optionLabel}>
                      {isIt ? 'Carica dalla galleria' : 'Upload from gallery'}
                    </AppText>
                    <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceMuted} />
                  </TouchableOpacity>

                  {/* Option 3: Incolla link menù */}
                  <TouchableOpacity
                    style={styles.optionRow}
                    onPress={() => handleSelectOption('url')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionIconWrap}>
                      <Ionicons name="link-outline" size={20} color={colors.brand} />
                    </View>
                    <AppText variant="body" color={colors.onSurface} style={styles.optionLabel}>
                      {isIt ? 'Incolla link menù' : 'Paste menu link'}
                    </AppText>
                    <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceMuted} />
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : (
              /* Link Mode (Incolla Link) — Stile Tasto Codice */
              <View style={styles.body}>
                <AppText variant="caption" color={colors.onSurfaceMuted} style={styles.hintText}>
                  {isIt
                    ? 'Incolla l\'URL pubblico della pagina menù o di un PDF.'
                    : 'Paste the public URL of the menu page or a PDF.'}
                </AppText>

                {hasClipboardText && (
                  <TouchableOpacity
                    style={styles.pastePill}
                    onPress={handlePasteClipboard}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="clipboard-outline" size={16} color={colors.brand} />
                    <AppText variant="caption" color={colors.brand} style={{ fontWeight: '700' }}>
                      {isIt ? 'Incolla dagli appunti' : 'Paste from clipboard'}
                    </AppText>
                  </TouchableOpacity>
                )}

                <DebossedInput
                  placeholder="https://…"
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  value={urlInput}
                  onChangeText={setUrlInput}
                  returnKeyType="go"
                  onSubmitEditing={handleConfirmUrl}
                  rightIcon={
                    urlInput.length > 0 ? (
                      <TouchableOpacity
                        onPress={() => {
                          setUrlInput('');
                          void Haptics.selectionAsync();
                        }}
                        hitSlop={8}
                      >
                        <Ionicons name="close-circle" size={18} color={colors.onSurfaceMuted} />
                      </TouchableOpacity>
                    ) : null
                  }
                />

                {urlInput.trim().length > 0 && !isUrlValid && (
                  <AppText variant="caption" color={colors.amberText}>
                    {isIt
                      ? 'Inserisci un URL valido (incluso http:// o https://)'
                      : 'Enter a valid URL (including http:// or https://)'}
                  </AppText>
                )}

                {urlInput.trim().length > 0 && isUrlValid && (
                  <AppText variant="caption" color={colors.greenText}>
                    ✓ {isIt ? 'Link pronto per l\'analisi AI' : 'Link ready for AI scan'}
                  </AppText>
                )}

                <SurfaceButton
                  label={
                    analyzing
                      ? (isIt ? 'Analisi in corso…' : 'Analyzing…')
                      : (isIt ? 'Analizza' : 'Analyze')
                  }
                  onPress={handleConfirmUrl}
                  disabled={!urlInput.trim() || analyzing}
                  loading={analyzing}
                  icon="arrow-forward"
                  style={{ marginTop: spacing.xs }}
                />
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  keyboardContainer: {
    width: '100%',
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    ...softShadow(18),
  },
  sheetHeader: {
    alignItems: 'center',
    paddingBottom: spacing.xs,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  titleRow: {
    width: '100%',
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backBtn: {
    paddingRight: 4,
  },
  titleText: {
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
    paddingTop: 4,
  },
  hintText: {
    marginBottom: 2,
  },
  optionsGroup: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  optionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceTertiary,
  },
  optionLabel: {
    flex: 1,
    fontFamily: font.semibold,
    fontSize: 15,
  },
  pastePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 4,
  },
});
