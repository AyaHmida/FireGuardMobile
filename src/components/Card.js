import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../theme/colors';
import { getStatusColor } from '../utils/helpers';

export const Card = ({
  children,
  title,
  subtitle,
  icon,
  status,
  onPress,
  style = {},
  interactive = false,
}) => {
  // ✅ TouchableOpacity si cliquable, View sinon
  const Container = interactive ? TouchableOpacity : View;

  // ✅ boxShadow → shadowColor/elevation, border → borderWidth/borderColor
  const statusStyle =
    interactive && status
      ? {
          borderColor: getStatusColor(status) + '40',
          shadowColor:
            status !== 'normal' ? getStatusColor(status) : 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: status !== 'normal' ? 0.2 : 0,
          shadowRadius: status !== 'normal' ? 6 : 0,
          elevation: status !== 'normal' ? 4 : 0,
        }
      : {};

  return (
    <Container
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.container, statusStyle, style]}
    >
      {/* Header optionnel */}
      {(title || subtitle || icon) && (
        <View style={{ marginBottom: title || subtitle ? 12 : 0 }}>
          {icon && (
            // ✅ div → Text pour les emojis/icônes
            <Text style={styles.icon}>{icon}</Text>
          )}
          {title && (
            // ✅ div → Text
            <Text style={styles.title}>{title}</Text>
          )}
          {subtitle && (
            // ✅ div → Text
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}
        </View>
      )}
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    // ✅ background → backgroundColor
    backgroundColor: Colors.card,
    // ✅ border: '1px solid' → borderWidth + borderColor
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
  },
  icon: {
    fontSize: 24,
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});

export default Card;
