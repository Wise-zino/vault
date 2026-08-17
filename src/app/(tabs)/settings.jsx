import { useAuth } from '@/contexts/AuthContext';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function SettingRow({ label, value, onPress, danger }) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View>
        <Text style={[styles.settingLabel, danger && styles.settingLabelDanger]}>
          {label}
        </Text>
        {value ? <Text style={styles.settingValue}>{value}</Text> : null}
      </View>
      {onPress && <Text style={[styles.settingArrow, danger && styles.settingArrowDanger]}>›</Text>}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'CONFIRM EXIT',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ACCOUNT</Text>
        <View style={styles.accentBar} />
      </View>

      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.username?.[0] || 'U').toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.profileName}>{user?.username?.toUpperCase() || 'USER'}</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>ACTIVE ACCOUNT</Text>
          </View>
        </View>
      </View>

      {/* Settings groups */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>APP INFO</Text>
        <View style={styles.group}>
          <SettingRow label="VERSION" value="1.0.0" />
          
          <SettingRow label="DATA SOURCE" value="Open Exchange" />
          <SettingRow label="REFRESH RATE" value="10 seconds" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SUPPORTED CURRENCIES</Text>
        <View style={styles.currencyGrid}>
          {['USD', 'EUR', 'GBP', 'NGN', 'JPY', 'CAD', 'AUD'].map((c) => (
            <View key={c} style={styles.currencyChip}>
              <Text style={styles.currencyChipText}>{c}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.group}>
          <SettingRow
            label="LOG OUT"
            onPress={handleLogout}
            danger
          />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>VAULT</Text>
        <Text style={styles.footerSub}>Designed and Built by Wise Ewomazino</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060b10' },
  header: {
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: '#0d2020',
  },
  headerTitle: { color: '#ffffff', fontSize: 28, fontWeight: '900', letterSpacing: 3 },
  accentBar: { width: 32, height: 3, backgroundColor: '#00ff88', marginTop: 14 },

  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    margin: 24, padding: 20,
    backgroundColor: '#0a0f14',
    borderWidth: 1, borderColor: '#1a2e2e',
    borderLeftWidth: 3, borderLeftColor: '#00ff88',
  },
  avatar: {
    width: 52, height: 52,
    backgroundColor: '#0a1e14',
    borderWidth: 2, borderColor: '#00ff88',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#00ff88', fontSize: 22, fontWeight: '900' },
  profileName: { color: '#ffffff', fontSize: 18, fontWeight: '800', letterSpacing: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00ff88' },
  statusText: { color: '#4a9a6a', fontSize: 10, letterSpacing: 2 },

  section: { paddingHorizontal: 24, marginBottom: 8 },
  sectionTitle: {
    color: '#2a4a3a', fontSize: 10, letterSpacing: 3,
    fontWeight: '700', marginBottom: 8,
  },
  group: {
    backgroundColor: '#0a0f14',
    borderWidth: 1, borderColor: '#1a2e2e',
  },
  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#0d1a1a',
  },
  settingLabel: { color: '#8aaa9a', fontSize: 13, letterSpacing: 0.5 },
  settingLabelDanger: { color: '#ff4466' },
  settingValue: { color: '#4a6a5a', fontSize: 11, marginTop: 2 },
  settingArrow: { color: '#3a5a4a', fontSize: 18 },
  settingArrowDanger: { color: '#ff4466' },

  currencyGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  currencyChip: {
    borderWidth: 1, borderColor: '#1a3a2a',
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: '#0a0f14',
  },
  currencyChipText: { color: '#4a9a6a', fontSize: 12, fontWeight: '700', letterSpacing: 1 },

  footer: {
     alignItems: 'center', gap: 4,
  },
  footerText: { color: '#1a3a2a', fontSize: 11, letterSpacing: 3, fontWeight: '700' },
  footerSub: { color: '#1a2a2a', fontSize: 10 },
});