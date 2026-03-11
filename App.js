import { useEffect, useState } from "react";
import { Linking, Platform, StatusBar, StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { AuthProvider } from "./src/context/Authcontext";
import { Colors } from "./src/theme/colors";

import BottomNav from "./src/components/BottomNav";
import AppStatusBar from "./src/components/StatusBar";
import AcceptInvitationScreen from "./src/screens/AcceptInvitationScreen";
import AlertsScreen from "./src/screens/AlertsScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import FamilyScreen from "./src/screens/FamilyScreen";
import LoginScreen from "./src/screens/LoginScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import RegisterScreen from "./src/screens/Registerscreen";
import ZoneDetailScreen from "./src/screens/ZoneDetailScreen";

function AppContent() {
  const [screen, setScreen] = useState("login");
  const [navTab, setNavTab] = useState("dashboard");
  const [selectedZone, setSelectedZone] = useState(null);
  const [invitationToken, setInvitationToken] = useState(null);

  // ── Extraire le token d'invitation de l'URL au chargement ──────────
  useEffect(() => {
    const extractTokenFromURL = async () => {
      try {
        // Sur web
        if (Platform.OS === "web" && typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const token = params.get("token");
          if (token) {
            setInvitationToken(token);
            return;
          }
        }

        // Sur iOS/Android avec deep linking
        if (Platform.OS !== "web") {
          const url = await Linking.getInitialURL();
          if (url != null) {
            const tokenMatch = url.match(/token=([^&]+)/);
            if (tokenMatch && tokenMatch[1]) {
              setInvitationToken(tokenMatch[1]);
            }
          }
        }
      } catch (error) {
        console.error("Erreur lors de l'extraction du token:", error);
      }
    };

    extractTokenFromURL();

    // Écouter les changements de deep link (pour iOS/Android)
    if (Platform.OS !== "web") {
      const subscription = Linking.addEventListener("url", ({ url }) => {
        const tokenMatch = url.match(/token=([^&]+)/);
        if (tokenMatch && tokenMatch[1]) {
          setInvitationToken(tokenMatch[1]);
        }
      });

      return () => subscription.remove();
    }
  }, []);

  const isLoggedIn =
    screen !== "login" && screen !== "register" && !invitationToken;

  const handleLogin = () => setScreen("app");
  const handleZone = (zone) => {
    setSelectedZone(zone);
    setScreen("zone");
  };
  const handleAlert = () => {
    setNavTab("alerts");
    setScreen("app");
  };
  const handleBack = () => setScreen("app");
  const handleNavTab = (tab) => {
    setNavTab(tab);
    setScreen("app");
  };

  const handleLogout = () => {
    setScreen("login");
    setNavTab("dashboard");
  };
  const handleFamily = () => setScreen("family");

  const renderScreen = () => {
    // ── Écran d'acceptation d'invitation ──────────────────────────
    if (invitationToken) {
      return (
        <AcceptInvitationScreen
          token={invitationToken}
          onInvitationAccepted={() => {
            setInvitationToken(null);
            setScreen("login");
          }}
          onCancel={() => {
            setInvitationToken(null);
            setScreen("login");
          }}
        />
      );
    }

    if (screen === "register")
      return (
        <RegisterScreen
          onRegister={() => setScreen("login")}
          onBack={() => setScreen("login")}
        />
      );

    if (screen === "login")
      return (
        <LoginScreen
          onLogin={handleLogin}
          onRegister={() => setScreen("register")}
        />
      );

    if (screen === "zone")
      return <ZoneDetailScreen zone={selectedZone} onBack={handleBack} />;

    switch (navTab) {
      case "dashboard":
        return <DashboardScreen onZone={handleZone} onAlert={handleAlert} />;
      case "zones":
        return <DashboardScreen onZone={handleZone} onAlert={handleAlert} />;
      case "alerts":
        return <AlertsScreen onBack={handleBack} />;
      case "profile":
        return <ProfileScreen onBack={handleBack} onLogout={handleLogout} />;
      case "family":
        return <FamilyScreen onBack={handleBack} />;

      default:
        return <DashboardScreen onZone={handleZone} onAlert={handleAlert} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      {isLoggedIn && <AppStatusBar />}
      <View style={styles.content}>{renderScreen()}</View>
      {isLoggedIn && screen !== "zone" && (
        <BottomNav active={navTab} onChange={handleNavTab} />
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  content: { flex: 1 },
});
