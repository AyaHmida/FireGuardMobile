import { useEffect, useState } from "react";
import { Linking, Platform, StatusBar, StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { AuthProvider } from "./src/context/Authcontext";
import { Colors } from "./src/theme/colors";

import BottomNav from "./src/components/BottomNav";
import AppStatusBar from "./src/components/StatusBar";
import AcceptInvitationScreen from "./src/screens/AcceptInvitationScreen";
import AlertsScreen from "./src/screens/AlertsScreen";
import { ChangePasswordScreen } from "./src/screens/ChangePasswordScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import FamilyScreen from "./src/screens/FamilyScreen";
import { ForgotPasswordScreen } from "./src/screens/Forgotpasswordscreen"; // ← AJOUTÉ
import LoginScreen from "./src/screens/LoginScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import RegisterScreen from "./src/screens/Registerscreen";
import { ResetPasswordScreen } from "./src/screens/Resetpasswordscreen"; // ← AJOUTÉ
import ZoneDetailScreen from "./src/screens/ZoneDetailScreen";

function AppContent() {
  const [screen, setScreen] = useState("login");
  const [navTab, setNavTab] = useState("dashboard");
  const [selectedZone, setSelectedZone] = useState(null);
  const [invitationToken, setInvitationToken] = useState(null);
  const [resetToken, setResetToken] = useState(null); // ← AJOUTÉ

  // ── Extraire les tokens de l'URL au chargement ────────────────────
  useEffect(() => {
    const extractTokenFromURL = async () => {
      try {
        // Sur web
        // ✅ APRÈS — vérifie le path d'abord
        if (Platform.OS === "web" && typeof window !== "undefined") {
          const path = window.location.pathname; // ← AJOUTÉ
          const params = new URLSearchParams(window.location.search);
          const token = params.get("token");

          if (token) {
            // /reset-password?token=XXX  →  reset password
            if (path.includes("reset-password")) {
              setResetToken(token);
              setScreen("resetPassword");
              return;
            }

            // /?token=XXX  →  invitation
            setInvitationToken(token);
            return;
          }
        }

        // Sur iOS/Android avec deep linking
        if (Platform.OS !== "web") {
          const url = await Linking.getInitialURL();
          if (url != null) {
            // fireguard://reset-password?token=XXX
            if (url.includes("reset-password")) {
              const tokenMatch = url.match(/token=([^&]+)/);
              if (tokenMatch?.[1]) {
                setResetToken(tokenMatch[1]);
                setScreen("resetPassword");
                return;
              }
            }

            // Token d'invitation
            const tokenMatch = url.match(/token=([^&]+)/);
            if (tokenMatch?.[1]) {
              setInvitationToken(tokenMatch[1]);
            }
          }
        }
      } catch (error) {
        console.error("Erreur lors de l'extraction du token:", error);
      }
    };

    extractTokenFromURL();

    // Écouter les changements de deep link (iOS/Android)
    if (Platform.OS !== "web") {
      const subscription = Linking.addEventListener("url", ({ url }) => {
        // Deep link reset password
        if (url.includes("reset-password")) {
          const tokenMatch = url.match(/token=([^&]+)/);
          if (tokenMatch?.[1]) {
            setResetToken(tokenMatch[1]);
            setScreen("resetPassword");
            return;
          }
        }

        // Deep link invitation
        const tokenMatch = url.match(/token=([^&]+)/);
        if (tokenMatch?.[1]) {
          setInvitationToken(tokenMatch[1]);
        }
      });

      return () => subscription.remove();
    }
  }, []);

  // ── Écrans hors session (pas de BottomNav, pas de StatusBar) ──────
  const PUBLIC_SCREENS = [
    "login",
    "register",
    "forgotPassword",
    "resetPassword",
  ];
  const isLoggedIn = !PUBLIC_SCREENS.includes(screen) && !invitationToken;

  // ── Handlers ──────────────────────────────────────────────────────
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
  const handleChangePassword = () => setScreen("changePassword");

  const renderScreen = () => {
    // ── Invitation ─────────────────────────────────────────────────
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

    // ── Écrans publics ─────────────────────────────────────────────
    if (screen === "login")
      return (
        <LoginScreen
          onLogin={handleLogin}
          onRegister={() => setScreen("register")}
          onForgotPassword={() => setScreen("forgotPassword")} // ← minuscule, cohérent
        />
      );

    if (screen === "register")
      return (
        <RegisterScreen
          onRegister={() => setScreen("login")}
          onBack={() => setScreen("login")}
        />
      );

    if (screen === "forgotPassword")
      // ← AJOUTÉ
      return <ForgotPasswordScreen onBack={() => setScreen("login")} />;

    if (screen === "resetPassword")
      // ← AJOUTÉ
      return (
        <ResetPasswordScreen
          token={resetToken}
          onBack={() => setScreen("login")}
          onSuccess={() => {
            setResetToken(null);
            setScreen("login");
          }}
        />
      );

    // ── Écrans privés ──────────────────────────────────────────────
    if (screen === "changePassword")
      return <ChangePasswordScreen onBack={() => setScreen("app")} />;

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
        return (
          <ProfileScreen
            onBack={handleBack}
            onLogout={handleLogout}
            onChangePassword={handleChangePassword}
          />
        );
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
      {isLoggedIn && screen !== "zone" && screen !== "changePassword" && (
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
