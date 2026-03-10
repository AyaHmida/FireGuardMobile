import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';

/*************  ✨ Windsurf Command 🌟  *************/
/**
 * Button component
 * Support multiple variants: primary, secondary, danger
 * Also supports sizes: sm, md, lg
 * @param {Object} props
 * @param {String} props.label
 * @param {String} props.icon
 * @param {String} [props.variant=primary]
 * @param {String} [props.size=md]
 * @param {Boolean} [props.loading=false]
 * @param {Boolean} [props.disabled=false]
 * @param {Function} props.onPress
 * @param {Object} [props.style={}]
 * @returns {ReactElement}
 */
export const Button = ({
  label,
  icon,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onPress,
  style = {},
}) => {
  const getSizeStyles = () => {
    const sizes = {
      sm: { paddingVertical: 8, paddingHorizontal: 12, fontSize: 12 },
      md: { paddingVertical: 12, paddingHorizontal: 16, fontSize: 14 },
      lg: { paddingVertical: 16, paddingHorizontal: 20, fontSize: 15 },
    };
    return sizes[size] || sizes.md;
  };

  const getVariantStyles = () => {
    const variants = {
      primary: {
        backgroundColor: Colors.fire,
        textColor: '#FFFFFF',
      },
      secondary: {
        backgroundColor: Colors.surface,
        textColor: Colors.text,
        borderWidth: 1,
        borderColor: Colors.border,
      },
      danger: {
        backgroundColor: Colors.danger,
        textColor: '#FFFFFF',
      },
    };
    return variants[variant] || variants.primary;
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();
  const content = loading
    ? '⟳ ' + (label || '')
    : (icon ? icon + ' ' : '') + (label || '');

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderWidth: variantStyles.borderWidth || 0,
          borderColor: variantStyles.borderColor,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <Text
        style={{
          color: variantStyles.textColor,
          fontSize: sizeStyles.fontSize,
          fontWeight: '600',
        }}
      >
        {content}
      </Text>
    </TouchableOpacity>
  );
};
/*******  6f862110-3828-4f23-a4ef-2fcf0e7ecdfb  *******/

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
});

export default Button;
