import { CURRENCY_SYMBOLS, ENDPOINTS, SUPPORTED_CURRENCIES } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// ─── Sub-components ───────────────────────────────────────────────

function BalanceCard({ currency, balance, isMain }) {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const num = parseFloat(balance).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return (
    <View style={[styles.balanceCard, isMain && styles.balanceCardMain]}>
      <View style={styles.balanceCardTop}>
        <View style={[styles.currencyTag, isMain && styles.currencyTagMain]}>
          <Text style={[styles.currencyCode, isMain && styles.currencyCodeMain]}>
            {currency}
          </Text>
        </View>
        {isMain && <View style={styles.mainDot} />}
      </View>
      <Text style={[styles.balanceAmount, isMain && styles.balanceAmountMain]}>
        {symbol}{num}
      </Text>
      <Text style={styles.balanceCurrencyFull}>
        {CURRENCY_NAMES[currency] || currency}
      </Text>
    </View>
  );
}

function StatPill({ label, value }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const CURRENCY_NAMES = {
  USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound',
  NGN: 'Nigerian Naira', JPY: 'Japanese Yen',
  CAD: 'Canadian Dollar', AUD: 'Australian Dollar',
};


// ─── Main Screen ──────────────────────────────────────────────────

export default function WalletScreen() {
  const { user, authFetch, logout } = useAuth();
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [depositModal, setDepositModal] = useState(false);

  // Conversion form state
  const [fromCurrency, setFromCurrency] = useState('NGN');
  const [toCurrency, setToCurrency] = useState('USD');
  const [amount, setAmount] = useState('');
  const [converting, setConverting] = useState(false);
  const [previewRate, setPreviewRate] = useState(null);

  // Deposit form state
  const [depositCurrency, setDepositCurrency] = useState('NGN');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);

  const fetchBalances = useCallback(async () => {
    try {
      const res = await authFetch(ENDPOINTS.balance);
      const data = await res.json();
      // Expect array: [{currency, balance}, ...]
      setBalances(Array.isArray(data) ? data : data.wallets || []);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authFetch]);

  useEffect(() => { fetchBalances(); }, [fetchBalances]);

  const onRefresh = () => { setRefreshing(true); fetchBalances(); };

  // Fetch preview rate when currencies change
  useEffect(() => {
    if (!fromCurrency || !toCurrency || fromCurrency === toCurrency) {
      setPreviewRate(null);
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          /*`https://api.frankfurter.app/latest?from=${fromCurrency}&to=${toCurrency}&amount=1`*/
          `https://open.er-api.com/v6/latest/${fromCurrency}`
        );
        const data = await res.json();
        setPreviewRate(data.rates?.[toCurrency]);
      } catch { setPreviewRate(null); }
    })();
  }, [fromCurrency, toCurrency]);

  const handleConvert = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { Alert.alert('Error', 'Enter a valid amount.'); return; }
    if (fromCurrency === toCurrency) { Alert.alert('Error', 'Choose different currencies.'); return; }

    setConverting(true);
    try {
      const res = await authFetch(ENDPOINTS.convert, {
        method: 'POST',
        body: JSON.stringify({ from_currency: fromCurrency, to_currency: toCurrency, amount: amt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || 'Insufficient balance');
      Alert.alert('Success ✓', `Converted ${CURRENCY_SYMBOLS[fromCurrency]}${amt} To ${toCurrency}`);
      setModalVisible(false);
      setAmount('');
      fetchBalances();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setConverting(false);
    }
  };

  const handleDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (!amt || amt <= 0) { Alert.alert('Error', 'Enter a valid amount.'); return; }
    setDepositing(true);
    try {
      const res = await authFetch(ENDPOINTS.deposit, {
        method: 'POST',
        body: JSON.stringify({ currency: depositCurrency, amount: amt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || 'Deposit failed');
      Alert.alert('Deposited ✓', `${CURRENCY_SYMBOLS[depositCurrency]}${amt} added to wallet`);
      setDepositModal(false);
      setDepositAmount('');
      fetchBalances();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setDepositing(false);
    }
  };

  const totalUSD = balances.reduce((acc, w) => acc + parseFloat(w.balance || 0), 0);

  // ─── Render ───

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#00ff88" size="large" />
        <Text style={styles.loadingText}>LOADING WALLET...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>
            GOOD {getTimeOfDay()}, {(user?.username || 'TRADER').toUpperCase()}
          </Text>
          <Text style={styles.headerSub}>Your portfolio overview</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>EXIT</Text>
        </TouchableOpacity>
      </View>

      {/* Total summary bar */}
      <View style={styles.summaryBar}>
        <StatPill label="CURRENCIES" value={`${balances.length}`} />
        <View style={styles.summaryDivider} />
        <StatPill label="HOLDINGS" value={`~$${totalUSD.toFixed(0)}`} />
        <View style={styles.summaryDivider} />
        <StatPill label="STATUS" value="ACTIVE" />
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00ff88" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Action buttons */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
          <View style={styles.sectionLine} />
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setDepositModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnLabel}>DEPOSIT</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionBtnIcon, styles.actionBtnIconDark]}>⇄</Text>
            <Text style={[styles.actionBtnLabel, styles.actionBtnLabelDark]}>CONVERT</Text>
          </TouchableOpacity>
        </View>
        
        {/* Section label */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>WALLET BALANCES</Text>
          <View style={styles.sectionLine} />
        </View>

        {/* Balance cards */}
        {balances.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>◈</Text>
            <Text style={styles.emptyTitle}>NO BALANCES YET</Text>
            <Text style={styles.emptySubtitle}>
              Make a deposit to get started
            </Text>
          </View>
        ) : (
          <View style={styles.cardsGrid}>
            {balances.map((w, i) => (
              <BalanceCard
                key={w.currency}
                currency={w.currency}
                balance={w.balance}
                isMain={i === 0}
              />
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ─── CONVERSION MODAL ─── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>CURRENCY CONVERSION</Text>
            {previewRate && (
              <View style={styles.ratePreview}>
                <Text style={styles.ratePreviewText}>
                  1 {fromCurrency} = {previewRate.toFixed(6)} {toCurrency}
                </Text>
              </View>
            )}

            <View style={styles.modalRow}>
              <View style={styles.modalField}>
                <Text style={styles.label}>FROM</Text>
                <CurrencyPicker
                  selected={fromCurrency}
                  onSelect={setFromCurrency}
                  exclude={[toCurrency]}
                />
              </View>
              <TouchableOpacity
                style={styles.swapBtn}
                onPress={() => { setFromCurrency(toCurrency); setToCurrency(fromCurrency); }}
              >
                <Text style={styles.swapBtnText}>⇄</Text>
              </TouchableOpacity>
              <View style={styles.modalField}>
                <Text style={styles.label}>TO</Text>
                <CurrencyPicker
                  selected={toCurrency}
                  onSelect={setToCurrency}
                  exclude={[fromCurrency]}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>AMOUNT ({fromCurrency})</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor="#3a4a5a"
                keyboardType="decimal-pad"
              />
              {previewRate && amount ? (
                <Text style={styles.conversionHint}>
                  ≈ {CURRENCY_SYMBOLS[toCurrency] || ''}{(parseFloat(amount || 0) * previewRate).toFixed(2)} {toCurrency}
                </Text>
              ) : null}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setModalVisible(false); setAmount(''); }}
              >
                <Text style={styles.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, converting && styles.btnDisabled]}
                onPress={handleConvert}
                disabled={converting}
              >
                {converting
                  ? <ActivityIndicator color="#060b10" size="small" />
                  : <Text style={styles.confirmBtnText}>CONVERT </Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── DEPOSIT MODAL ─── */}
      <Modal visible={depositModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>DEPOSIT FUNDS</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CURRENCY</Text>
              <CurrencyPicker
                selected={depositCurrency}
                onSelect={setDepositCurrency}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>AMOUNT</Text>
              <TextInput
                style={styles.input}
                value={depositAmount}
                onChangeText={setDepositAmount}
                placeholder="0.00"
                placeholderTextColor="#3a4a5a"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setDepositModal(false); setDepositAmount(''); }}
              >
                <Text style={styles.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, depositing && styles.btnDisabled]}
                onPress={handleDeposit}
                disabled={depositing}
              >
                {depositing
                  ? <ActivityIndicator color="#060b10" size="small" />
                  : <Text style={styles.confirmBtnText}>DEPOSIT </Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Currency Picker ──────────────────────────────────────────────
function CurrencyPicker({ selected, onSelect, exclude = [] }) {
  const [open, setOpen] = useState(false);
  const options = SUPPORTED_CURRENCIES.filter((c) => !exclude.includes(c));
  return (
    <View>
      <TouchableOpacity
        style={styles.pickerBtn}
        onPress={() => setOpen(!open)}
        activeOpacity={0.8}
      >
        <Text style={styles.pickerBtnText}>{selected}</Text>
        <Text style={styles.pickerArrow}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.pickerDropdown}>
          {options.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.pickerOption, c === selected && styles.pickerOptionActive]}
              onPress={() => { onSelect(c); setOpen(false); }}
            >
              <Text style={[styles.pickerOptionText, c === selected && styles.pickerOptionTextActive]}>
                {c} — {CURRENCY_NAMES[c] || c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}


function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'MORNING';
  if (h < 17) return 'AFTERNOON';
  return 'EVENING';
}

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060b10' },
  loadingContainer: {
    flex: 1, backgroundColor: '#060b10',
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  loadingText: { color: '#00ff88', fontSize: 11, letterSpacing: 3 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#0d2020',
  },
  headerGreeting: { color: '#ffffff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  headerSub: { color: '#3a5a4a', fontSize: 12, marginTop: 2 },
  logoutBtn: {
    borderWidth: 1, borderColor: '#1a3a2a',
    paddingHorizontal: 12, paddingVertical: 6,
  },
  logoutText: { color: '#ff4466', fontSize: 10, letterSpacing: 2, fontWeight: '700' },

  summaryBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 14,
    backgroundColor: '#080e14',
    borderBottomWidth: 1, borderBottomColor: '#0d2020',
  },
  statPill: { flex: 1, alignItems: 'center' },
  statLabel: { color: '#3a5a4a', fontSize: 9, letterSpacing: 2, fontWeight: '600' },
  statValue: { color: '#00ff88', fontSize: 15, fontWeight: '800', marginTop: 2 },
  summaryDivider: { width: 1, height: 32, backgroundColor: '#0d2020' },

  scroll: { flex: 1, paddingHorizontal: 20 },
  sectionRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 24, marginBottom: 16, gap: 12,
  },
  sectionLabel: { color: '#3a5a4a', fontSize: 10, letterSpacing: 3, fontWeight: '700' },
  sectionLine: { flex: 1, height: 1, backgroundColor: '#0d2020' },

  cardsGrid: { gap: 12 },
  balanceCard: {
    backgroundColor: '#0d1620',
    borderWidth: 1, borderColor: '#1a2e2e',
    padding: 20, gap: 8,
  },
  balanceCardMain: {
    borderColor: '#00ff8840',
    backgroundColor: '#0a1a14',
    borderLeftWidth: 3, borderLeftColor: '#00ff88',
  },
  balanceCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  currencyTag: {
    borderWidth: 1, borderColor: '#1a3a2a',
    paddingHorizontal: 10, paddingVertical: 4,
  },
  currencyTagMain: { borderColor: '#00ff8840' },
  currencyCode: { color: '#4a7a6a', fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  currencyCodeMain: { color: '#00ff88' },
  mainDot: { width: 8, height: 8, backgroundColor: '#00ff88', borderRadius: 4 },
  balanceAmount: { color: '#8aaa9a', fontSize: 26, fontWeight: '800' },
  balanceAmountMain: { color: '#ffffff', fontSize: 30 },
  balanceCurrencyFull: { color: '#2a4a3a', fontSize: 11 },

  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyIcon: { color: '#1a3a2a', fontSize: 40 },
  emptyTitle: { color: '#3a5a4a', fontSize: 13, letterSpacing: 3, fontWeight: '700' },
  emptySubtitle: { color: '#2a3a3a', fontSize: 12 },

  actionsRow: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16,
    backgroundColor: '#0d1620', borderWidth: 1, borderColor: '#1a2e2e',
  },
  actionBtnPrimary: { backgroundColor: '#00ff88', borderColor: '#00ff88' },
  actionBtnIcon: { color: '#00ff88', fontSize: 18, fontWeight: '700' },
  actionBtnIconDark: { color: '#060b10' },
  actionBtnLabel: { color: '#00ff88', fontSize: 11, letterSpacing: 2, fontWeight: '800' },
  actionBtnLabelDark: { color: '#060b10' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(6,11,16,0.92)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0a1018',
    borderTopWidth: 1, borderTopColor: '#0d2020',
    padding: 24, paddingBottom: 44, gap: 20,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: '#1a3a2a',
    borderRadius: 2, alignSelf: 'center', marginBottom: 4,
  },
  modalTitle: { color: '#ffffff', fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  ratePreview: {
    backgroundColor: '#0d1e14',
    borderWidth: 1, borderColor: '#1a3a2a',
    padding: 10, alignItems: 'center',
  },
  ratePreviewText: { color: '#00ff88', fontSize: 12, letterSpacing: 1 },
  modalRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  modalField: { flex: 1, gap: 6 },
  swapBtn: {
    width: 40, height: 48, backgroundColor: '#0d1e14',
    borderWidth: 1, borderColor: '#1a3a2a',
    alignItems: 'center', justifyContent: 'center',
  },
  swapBtnText: { color: '#00ff88', fontSize: 16 },
  inputGroup: { gap: 6 },
  label: { color: '#4a7a6a', fontSize: 10, letterSpacing: 3, fontWeight: '600' },
  input: {
    backgroundColor: '#0d1620', borderWidth: 1, borderColor: '#1a2e2e',
    color: '#e0fff0', paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 18, fontWeight: '600',
  },
  conversionHint: { color: '#4a9a6a', fontSize: 12, marginTop: 4 },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 15, alignItems: 'center',
    borderWidth: 1, borderColor: '#1a3a2a',
  },
  cancelBtnText: { color: '#4a7a6a', fontSize: 12, letterSpacing: 2, fontWeight: '700' },
  confirmBtn: {
    flex: 2, paddingVertical: 15, alignItems: 'center',
    backgroundColor: '#00ff88',
  },
  confirmBtnText: { color: '#060b10', fontSize: 13, letterSpacing: 2, fontWeight: '800' },
  btnDisabled: { opacity: 0.5 },

  // Picker
  pickerBtn: {
    backgroundColor: '#0d1620', borderWidth: 1, borderColor: '#1a2e2e',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
  },
  pickerBtnText: { color: '#e0fff0', fontSize: 15, fontWeight: '700', letterSpacing: 1 },
  pickerArrow: { color: '#4a7a6a', fontSize: 10 },
  pickerDropdown: {
    backgroundColor: '#0d1a20', borderWidth: 1, borderColor: '#1a2e2e',
    borderTopWidth: 0, zIndex: 100,
  },
  pickerOption: { paddingHorizontal: 14, paddingVertical: 11 },
  pickerOptionActive: { backgroundColor: '#0a1e14' },
  pickerOptionText: { color: '#6a9a8a', fontSize: 13 },
  pickerOptionTextActive: { color: '#00ff88', fontWeight: '700' },
});
