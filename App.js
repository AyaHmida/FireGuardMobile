import { useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AuthProvider } from './src/context/Authcontext';
import { Colors } from './src/theme/colors';

import BottomNav from './src/components/BottomNav';
import AppStatusBar from './src/components/StatusBar';
import AlertsScreen from './src/screens/AlertsScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RegisterScreen from './src/screens/Registerscreen';
import ZoneDetailScreen from './src/screens/ZoneDetailScreen';

function AppContent() {
  const [screen, setScreen] = useState('login');
  const [navTab, setNavTab] = useState('dashboard');
  const [selectedZone, setSelectedZone] = useState(null);

  const isLoggedIn = screen !== 'login' && screen !== 'register';

  const handleLogin = () => setScreen('app');
  const handleZone = (zone) => {
    setSelectedZone(zone);
    setScreen('zone');
  };
  const handleAlert = () => {
    setNavTab('alerts');
    setScreen('app');
  };
  const handleBack = () => setScreen('app');
  const handleNavTab = (tab) => {
    setNavTab(tab);
    setScreen('app');
  };

  const handleLogout = () => {
    setScreen('login');
    setNavTab('dashboard');
  };

  const renderScreen = () => {
    if (screen === 'register')
      return (
        <RegisterScreen
          onRegister={() => setScreen('login')}
          onBack={() => setScreen('login')}
        />
      );

    if (screen === 'login')
      return (
        <LoginScreen
          onLogin={handleLogin}
          onRegister={() => setScreen('register')}
        />
      );

    if (screen === 'zone')
      return <ZoneDetailScreen zone={selectedZone} onBack={handleBack} />;

    switch (navTab) {
      case 'dashboard':
        return <DashboardScreen onZone={handleZone} onAlert={handleAlert} />;
      case 'zones':
        return <DashboardScreen onZone={handleZone} onAlert={handleAlert} />;
      case 'alerts':
        return <AlertsScreen onBack={handleBack} />;
      case 'profile':
        // ✅ onLogout passé à ProfileScreen
        return <ProfileScreen onBack={handleBack} onLogout={handleLogout} />;
      default:
        return <DashboardScreen onZone={handleZone} onAlert={handleAlert} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      {isLoggedIn && <AppStatusBar />}
      <View style={styles.content}>{renderScreen()}</View>
      {isLoggedIn && screen !== 'zone' && (
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
