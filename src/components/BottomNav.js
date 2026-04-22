import { Ionicons } from "@expo/vector-icons"; // ✅ import Expo vector icons
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ALERTS } from "../constants/mockData";
import { Colors } from "../theme/colors";

export const BottomNav = ({ active, onChange }) => {
  const tabs = [
    {
      id: "dashboard",
      icon: "home-outline",
      label: "Accueil",
      color: "#4CAF50",
    }, // vert
    { id: "zones", icon: "location-outline", label: "Zones", color: "#2196F3" }, // bleu
    {
      id: "alerts",
      icon: "notifications-outline",
      label: "Alertes",
      color: "#F44336",
    }, // rouge
    {
      id: "family",
      icon: "people-outline",
      label: "Famille",
      color: "#9C27B0",
    }, // violet
    {
      id: "profile",
      icon: "person-outline",
      label: "Profil",
      color: "#FF9800",
    }, // orange
  ];

  const alertCount = ALERTS.filter((a) => !a.resolved).length;

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          onPress={() => onChange(tab.id)}
          activeOpacity={0.7}
          style={styles.tab}
        >
          {/* Badge alertes */}
          {tab.id === "alerts" && alertCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{alertCount}</Text>
            </View>
          )}

          {/* Icône Ionicons avec couleur personnalisée */}
          <Ionicons
            name={tab.icon}
            size={24}
            color={active === tab.id ? tab.color : Colors.textMuted}
            style={active !== tab.id && styles.iconInactive}
          />

          {/* Label */}
          <Text
            style={[
              styles.label,
              active === tab.id ? styles.labelActive : styles.labelInactive,
            ]}
          >
            {tab.label}
          </Text>

          {/* Indicateur actif */}
          {active === tab.id && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingTop: 8,
    paddingBottom: 12,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingVertical: 6,
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 18,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.danger,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.surface,
    zIndex: 1,
  },
  badgeText: {
    fontSize: 9,
    color: "#fff",
    fontWeight: "700",
  },
  iconInactive: {
    opacity: 0.4,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 4,
  },
  labelActive: {
    color: Colors.fire,
  },
  labelInactive: {
    color: Colors.textMuted,
  },
  activeIndicator: {
    position: "absolute",
    bottom: -2,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.fire,
  },
});

export default BottomNav;
