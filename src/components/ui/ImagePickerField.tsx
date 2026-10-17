import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/useTheme';
import { mediaService } from '../../services/mediaService';

interface Props {
  value?: string;
  onChange: (uri: string | undefined) => void;
  label?: string;
  helperText?: string;
  placeholderTitle?: string;
  placeholderDescription?: string;
  aspect?: [number, number];
  disabled?: boolean;
}

export function ImagePickerField({
  value,
  onChange,
  label = 'Foto',
  helperText,
  placeholderTitle = 'Agregá una foto',
  placeholderDescription = 'De la caja o de la receta. Es opcional.',
  aspect = [1, 1],
  disabled = false,
}: Props) {
  const theme = useTheme();
  const [busy, setBusy] = useState(false);

  const handleCamera = async () => {
    if (busy || disabled) return;
    setBusy(true);
    try {
      const result = await mediaService.takePhoto(aspect);
      if (result) onChange(result.uri);
    } catch (e) {
      Alert.alert('No se pudo abrir la cámara', e instanceof Error ? e.message : 'Intentá nuevamente.');
    } finally {
      setBusy(false);
    }
  };

  const handleGallery = async () => {
    if (busy || disabled) return;
    setBusy(true);
    try {
      const result = await mediaService.pickImage(aspect);
      if (result) onChange(result.uri);
    } catch (e) {
      Alert.alert('No se pudo abrir la galería', e instanceof Error ? e.message : 'Intentá nuevamente.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = () => {
    if (busy || disabled) return;
    onChange(undefined);
  };

  const aspectRatio = aspect[0] / aspect[1];

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={[styles.label, { color: theme.colors.subtext }]}>
          {label.toUpperCase()}
        </Text>
      ) : null}

      <View
        style={[
          styles.previewBox,
          value ? styles.previewWithImage : styles.previewEmpty,
          {
            backgroundColor: theme.colors.bg,
            borderColor: theme.colors.border,
            aspectRatio: value ? aspectRatio : undefined,
          },
        ]}
      >
        {value ? (
          <Image source={{ uri: value }} style={styles.preview} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <View style={[styles.placeholderIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
              <Ionicons name="image-outline" size={23} color={theme.colors.primary} />
            </View>
            <View style={styles.placeholderCopy}>
              <Text style={[styles.placeholderTitle, { color: theme.colors.text }]}>{placeholderTitle}</Text>
              {placeholderDescription ? (
                <Text style={[styles.placeholderText, { color: theme.colors.subtext }]}>{placeholderDescription}</Text>
              ) : null}
            </View>
          </View>
        )}

        {busy ? (
          <View style={styles.busyOverlay}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : null}
      </View>

      {helperText ? (
        <Text style={[styles.helper, { color: theme.colors.subtext }]}>
          {helperText}
        </Text>
      ) : null}

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
            (busy || disabled) && styles.disabled,
          ]}
          onPress={handleCamera}
          disabled={busy || disabled}
          accessibilityRole="button"
          accessibilityLabel="Tomar foto con la cámara"
        >
          <Ionicons name="camera-outline" size={18} color={theme.colors.onPrimary} />
          <Text style={[styles.actionText, { color: theme.colors.onPrimary }]}>
            Cámara
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionBtn,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            (busy || disabled) && styles.disabled,
          ]}
          onPress={handleGallery}
          disabled={busy || disabled}
          accessibilityRole="button"
          accessibilityLabel="Elegir foto de la galería"
        >
          <Ionicons name="images-outline" size={18} color={theme.colors.primary} />
          <Text style={[styles.actionText, { color: theme.colors.primary }]}>
            Galería
          </Text>
        </TouchableOpacity>

        {value ? (
          <TouchableOpacity
            style={[
              styles.removeBtn,
              { borderColor: theme.colors.danger },
              (busy || disabled) && styles.disabled,
            ]}
            onPress={handleRemove}
            disabled={busy || disabled}
            accessibilityRole="button"
            accessibilityLabel="Quitar foto"
          >
            <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 8, gap: 8 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  previewBox: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  previewWithImage: { width: '100%' },
  previewEmpty: { minHeight: 82, borderStyle: 'dashed' },
  preview: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  placeholderIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderCopy: { flex: 1, gap: 3 },
  placeholderTitle: { fontSize: 14, fontWeight: '700' },
  placeholderText: {
    fontSize: 13,
    fontWeight: '500',
  },
  busyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  helper: { fontSize: 13, lineHeight: 18 },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  actionBtn: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
  },
  removeBtn: {
    width: 48,
    minHeight: 48,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});
