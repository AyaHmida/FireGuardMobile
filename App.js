import { useEffect, useState } from "react";
import {
  Linking,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { AuthProvider } from "./src/context/Authcontext";
import {
  SystemStateProvider,
  useSystemState,
} from "./src/context/SystemStateContext";
import { Colors } from "./src/theme/colors";

import { BottomNav } from "./src/components/BottomNav";
import AppStatusBar from "./src/components/StatusBar";
import { AcceptInvitationScreen } from "./src/screens/AcceptInvitationScreen";
import { AlertsScreen } from "./src/screens/AlertsScreen";
import { ChangePasswordScreen } from "./src/screens/ChangePasswordScreen";
import ChatbotScreen from "./src/screens/Chatbotscreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { EmergencyContactsScreen } from "./src/screens/EmergencyContactsScreen";
import { FamilyScreen } from "./src/screens/FamilyScreen";
import { ForgotPasswordScreen } from "./src/screens/Forgotpasswordscreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { RegisterScreen } from "./src/screens/Registerscreen";
import { ResetPasswordScreen } from "./src/screens/Resetpasswordscreen";
import { ZoneDetailScreen } from "./src/screens/ZoneDetailScreen";
function AppContent() {
  const [screen, setScreen] = useState("login");
  const [navTab, setNavTab] = useState("dashboard");
  const [selectedZone, setSelectedZone] = useState(null);
  const [alertZoneId, setAlertZoneId] = useState(null); // ✅ AJOUT
  const [invitationToken, setInvitationToken] = useState(null);
  const [resetToken, setResetToken] = useState(null);

  // ── Extraire les tokens de l'URL au chargement ────────────────────
  useEffect(() => {
    const extractTokenFromURL = async () => {
      try {
        if (Platform.OS === "web" && typeof window !== "undefined") {
          const path = window.location.pathname;
          const params = new URLSearchParams(window.location.search);
          const token = params.get("token");

          if (token) {
            if (path.includes("reset-password")) {
              setResetToken(token);
              setScreen("resetPassword");
              return;
            }
            setInvitationToken(token);
            return;
          }
        }

        if (Platform.OS !== "web") {
          const url = await Linking.getInitialURL();
          if (url != null) {
            if (url.includes("reset-password")) {
              const tokenMatch = url.match(/token=([^&]+)/);
              if (tokenMatch?.[1]) {
                setResetToken(tokenMatch[1]);
                setScreen("resetPassword");
                return;
              }
            }
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

    if (Platform.OS !== "web") {
      const subscription = Linking.addEventListener("url", ({ url }) => {
        if (url.includes("reset-password")) {
          const tokenMatch = url.match(/token=([^&]+)/);
          if (tokenMatch?.[1]) {
            setResetToken(tokenMatch[1]);
            setScreen("resetPassword");
            return;
          }
        }
        const tokenMatch = url.match(/token=([^&]+)/);
        if (tokenMatch?.[1]) {
          setInvitationToken(tokenMatch[1]);
        }
      });

      return () => subscription.remove();
    }
  }, []);

  // ── Écrans hors session ───────────────────────────────────────────
  const PUBLIC_SCREENS = [
    "login",
    "register",
    "forgotPassword",
    "resetPassword",
  ];
  const isLoggedIn = !PUBLIC_SCREENS.includes(screen) && !invitationToken;
  const { locked } = useSystemState();
  const isLockRouteAllowed =
    !locked ||
    screen === "changePassword" ||
    (screen === "app" && (navTab === "profile" || navTab === "dashboard"));

  // ── Handlers ──────────────────────────────────────────────────────
  const handleLogin = () => setScreen("app");

  const handleZone = (zone) => {
    if (locked) return;
    setSelectedZone(zone);
    setScreen("zone");
  };

  // ✅ CORRIGÉ — reçoit zoneId depuis DashboardScreen
  const handleAlert = (zoneId) => {
    if (locked) return;
    setAlertZoneId(zoneId ?? null);
    setNavTab("alerts");
    setScreen("app");
  };

  const handleBack = () => {
    if (locked) {
      setScreen("app");
      setNavTab("dashboard");
      return;
    }
    setScreen("app");
  };

  const handleNavTab = (tab) => {
    if (locked && tab !== "profile" && tab !== "dashboard") return;
    setNavTab(tab);
    setScreen("app");
  };

  const handleLogout = () => {
    setScreen("login");
    setNavTab("dashboard");
  };

  const handleChangePassword = () => setScreen("changePassword");
  const handleEmergencyContacts = () => {
    if (locked) return;
    setScreen("emergencyContacts");
  };

  useEffect(() => {
    if (!isLoggedIn || !locked) return;
    if (!isLockRouteAllowed) {
      setScreen("app");
      setNavTab("dashboard");
    }
  }, [isLoggedIn, locked, isLockRouteAllowed]);

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
          onForgotPassword={() => setScreen("forgotPassword")}
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
      return <ForgotPasswordScreen onBack={() => setScreen("login")} />;

    if (screen === "resetPassword")
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
    if (screen === "emergencyContacts")
      return <EmergencyContactsScreen onBack={() => setScreen("app")} />;

    if (locked && !isLockRouteAllowed) {
      return (
        <View style={styles.lockScreen}>
          <View style={styles.lockCard}>
            <Text style={styles.lockTitle}>Système désactivé</Text>
            <Text style={styles.lockDescription}>
              La sécurité globale est désactivée. Seules les actions de sécurité
              sont autorisées.
            </Text>
            <TouchableOpacity
              style={[styles.lockButton, styles.lockPrimaryButton]}
              onPress={() => {
                setNavTab("profile");
                setScreen("app");
              }}
            >
              <Text style={styles.lockButtonText}>Accéder au profil</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.lockButton, styles.lockSecondaryButton]}
              onPress={() => setScreen("changePassword")}
            >
              <Text style={styles.lockButtonText}>Changer le mot de passe</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.lockButton, styles.lockSecondaryButton]}
              onPress={handleLogout}
            >
              <Text style={styles.lockButtonText}>Se déconnecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    switch (navTab) {
      case "dashboard":
        return <DashboardScreen onZone={handleZone} onAlert={handleAlert} />;
      case "zones":
        return <DashboardScreen onZone={handleZone} onAlert={handleAlert} />;
      case "alerts":
        // ✅ CORRIGÉ — zoneId transmis
        return <AlertsScreen onBack={handleBack} zoneId={alertZoneId} />;
      case "profile":
        return (
          <ProfileScreen
            onBack={handleBack}
            onLogout={handleLogout}
            onChangePassword={handleChangePassword}
            onEmergencyContacts={handleEmergencyContacts}
          />
        );
      case "family":
        return <FamilyScreen onBack={handleBack} />;
      case "chatbot":
        return <ChatbotScreen onBack={handleBack} />;
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
        <BottomNav active={navTab} onChange={handleNavTab} locked={locked} />
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SystemStateProvider>
        <SafeAreaProvider>
          <AppContent />
        </SafeAreaProvider>
      </SystemStateProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  content: { flex: 1 },
  lockScreen: {
    flex: 1,
    backgroundColor: Colors.bgLight,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  lockCard: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 28,
    shadowColor: Colors.text,
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  lockTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
  },
  lockDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 22,
  },
  lockButton: {
    width: "100%",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  lockPrimaryButton: {
    backgroundColor: Colors.fire,
  },
  lockSecondaryButton: {
    backgroundColor: Colors.surface,
  },
  lockButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
});
