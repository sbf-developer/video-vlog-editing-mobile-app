import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import { useThemeWithSpacing } from '@/hooks/useTheme';

type ButtonProps = PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  fullWidth?: boolean;
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  fullWidth,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const { colors, radius, typography } = useThemeWithSpacing();
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isDanger = variant === 'danger';
  const isGhost = variant === 'ghost';
  const isSmall = size === 'sm';

  const bg = isGhost
    ? 'transparent'
    : isDanger
      ? colors.danger
      : isPrimary
        ? colors.accent
        : colors.surface;

  const textColor = isGhost
    ? colors.textSecondary
    : isPrimary || isDanger
      ? colors.accentText
      : colors.text;

  const textStyle = isSmall ? typography.buttonSm : typography.button;

  return (
    <Pressable
      {...props}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        isSmall ? styles.buttonSm : styles.buttonMd,
        {
          backgroundColor: bg,
          borderRadius: isSmall ? radius.full : radius.md,
          opacity: disabled ? 0.45 : pressed ? 0.88 : 1,
          width: fullWidth ? '100%' : undefined,
          borderWidth: isSecondary ? 1 : 0,
          borderColor: colors.border,
        },
        style as ViewStyle,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={isSmall ? 15 : 16} color={textColor} /> : null}
          <Text style={[textStyle, { color: textColor }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

type InputProps = TextInputProps & {
  label?: string;
};

export function Input({ label, style, ...props }: InputProps) {
  const { colors, radius, typography } = useThemeWithSpacing();

  return (
    <View style={styles.inputWrap}>
      {label ? (
        <Text style={[typography.label, { color: colors.textMuted, marginBottom: 8 }]}>{label}</Text>
      ) : null}
      <TextInput
        {...props}
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          typography.body,
          {
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.md,
          },
          style,
        ]}
      />
    </View>
  );
}

type EmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
};

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  const { colors, spacing, typography } = useThemeWithSpacing();

  return (
    <View style={[styles.empty, { padding: spacing.xl }]}>
      <Ionicons name={icon} size={40} color={colors.textMuted} />
      <Text style={[typography.heading, { color: colors.text, marginTop: spacing.md, textAlign: 'center' }]}>
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={[
            typography.body,
            { color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
          ]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSm: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 34,
  },
  buttonMd: {
    paddingVertical: 11,
    paddingHorizontal: 18,
    minHeight: 42,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inputWrap: {
    width: '100%',
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
