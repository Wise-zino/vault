import { CURRENCY_SYMBOLS, ENDPOINTS } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';


const TYPE_META = {
  DEPOSIT: { label: 'DEPOSIT', color: '#00ff88', bg: '#0a1e12', icon: 'D', sign: '+' },
  WITHDRAWAL: { label: 'WITHDRAWAL', color: '#ff4466', bg: '#1e0a0a', icon: 'W', sign: '-' },
  CONVERSION: { label: 'CONVERT', color: '#ffa040', bg: '#1e1408', icon: 'C', sign: '⇄' },
};

function TransactionItem({ item }) {
  const meta = TYPE_META[item.transaction_type] || TYPE_META.DEPOSIT;
  const sym = CURRENCY_SYMBOLS[item.currency] || '';
  const amount = parseFloat(item.amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const date = new Date(item.timestamp);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.txItem}>
      {/* Left: icon + type */}
      <View style={[styles.txIconWrap, { backgroundColor: meta.bg }]}>
        <Text style={[styles.txIcon, { color: meta.color }]}>{meta.icon}</Text>
      </View>

      {/* Middle: info */}
      <View style={styles.txInfo}>
        <View style={styles.txTopRow}>
          <Text style={styles.txType}>{meta.label}</Text>
          <View style={[styles.txTypeBadge, { borderColor: meta.color + '40' }]}>
            <Text style={[styles.txTypeBadgeText, { color: meta.color }]}>
              {item.currency}
            </Text>
          </View>
        </View>
        <Text style={styles.txDate}>{dateStr} · {timeStr}</Text>
        {item.note ? <Text style={styles.txNote}>{item.note}</Text> : null}
      </View>

      {/* Right: amount */}
      <View style={styles.txAmountWrap}>
        <Text style={[styles.txSign, { color: meta.color }]}>{meta.sign}</Text>
        <Text style={[styles.txAmount, { color: meta.color }]}>
          {sym}{amount}
        </Text>
      </View>
    </View>
  );
}

function FilterTab({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.filterTab, active && styles.filterTabActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.filterTabText, active && styles.filterTabTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const FILTERS = ['ALL', 'DEPOSIT', 'WITHDRAWAL', 'CONVERSION'];

export default function TransactionsScreen() {
  const { authFetch } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await authFetch(ENDPOINTS.transactions);
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : data.results || data.transactions || []);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authFetch]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const onRefresh = () => { setRefreshing(true); fetchTransactions(); };

  const filtered = filter === 'ALL'
    ? transactions
    : transactions.filter((t) => t.transaction_type === filter);

  // Summary stats
  const totalDeposits = transactions
    .filter((t) => t.transaction_type === 'DEPOSIT')
    .reduce((acc, t) => acc + parseFloat(t.amount), 0);
  const totalConversions = transactions
    .filter((t) => t.transaction_type === 'CONVERSION').length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#00ff88" size="large" />
        <Text style={styles.loadingText}>LOADING HISTORY...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TRANSACTION{'\n'}HISTORY</Text>
        <View style={styles.accentBar} />
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>TOTAL TXN</Text>
          <Text style={styles.statValue}>{transactions.length}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>CONVERSIONS</Text>
          <Text style={styles.statValue}>{totalConversions}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>DEPOSITS</Text>
          <Text style={[styles.statValue, { color: '#00ff88' }]}>
            {transactions.filter((t) => t.transaction_type === 'DEPOSIT').length}
          </Text>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <FilterTab
            key={f}
            label={f === 'CONVERSION' ? 'CONVERT' : f}
            active={filter === f}
            onPress={() => setFilter(f)}
          />
        ))}
      </View>

      {/* Transaction list */}
      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>◉</Text>
          <Text style={styles.emptyTitle}>NO TRANSACTIONS</Text>
          <Text style={styles.emptySubtitle}>
            {filter === 'ALL'
              ? 'Make a deposit or conversion to get started'
              : `No ${filter.toLowerCase()} transactions yet`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, i) => item.id?.toString() || i.toString()}
          renderItem={({ item }) => <TransactionItem item={item} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#00ff88"
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          // Group by date header
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.resultCount}>
                {filtered.length} RECORD{filtered.length !== 1 ? 'S' : ''}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060b10' },
  loadingContainer: {
    flex: 1, backgroundColor: '#060b10',
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  loadingText: { color: '#00ff88', fontSize: 11, letterSpacing: 3 },

  header: {
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: '#0d2020',
  },
  headerTitle: {
    color: '#ffffff', fontSize: 28, fontWeight: '900',
    letterSpacing: 2, lineHeight: 34,
  },
  accentBar: {
    width: 32, height: 3,
    backgroundColor: '#00ff88',
    marginTop: 14,
  },

  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#080e14',
    borderBottomWidth: 1, borderBottomColor: '#0d2020',
    paddingVertical: 14,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { color: '#3a5a4a', fontSize: 9, letterSpacing: 2, fontWeight: '600' },
  statValue: { color: '#ffffff', fontSize: 18, fontWeight: '900', marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: '#0d2020', alignSelf: 'center' },

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16, paddingVertical: 12, gap: 6,
    borderBottomWidth: 1, borderBottomColor: '#0d2020',
  },
  filterTab: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: '#1a2e2e',
  },
  filterTabActive: { backgroundColor: '#00ff88', borderColor: '#00ff88' },
  filterTabText: { color: '#4a7a6a', fontSize: 10, letterSpacing: 1.5, fontWeight: '700' },
  filterTabTextActive: { color: '#060b10' },

  listContent: { paddingBottom: 32 },
  listHeader: {
    paddingHorizontal: 20, paddingVertical: 12,
  },
  resultCount: { color: '#2a4a3a', fontSize: 10, letterSpacing: 2 },

  txItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, gap: 14,
  },
  txIconWrap: {
    width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 0,
  },
  txIcon: { fontSize: 18, fontWeight: '700' },

  txInfo: { flex: 1, gap: 4 },
  txTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  txType: { color: '#ffffff', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  txTypeBadge: {
    borderWidth: 1,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  txTypeBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  txDate: { color: '#3a5a4a', fontSize: 11 },
  txNote: { color: '#4a6a5a', fontSize: 11, fontStyle: 'italic' },

  txAmountWrap: { alignItems: 'flex-end', gap: 2 },
  txSign: { fontSize: 10, fontWeight: '700' },
  txAmount: { fontSize: 15, fontWeight: '800' },

  separator: {
    height: 1,
    backgroundColor: '#0a1414',
    marginHorizontal: 20,
  },

  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  emptyIcon: { color: '#1a3a2a', fontSize: 48 },
  emptyTitle: { color: '#3a5a4a', fontSize: 14, letterSpacing: 3, fontWeight: '700' },
  emptySubtitle: { color: '#2a3a3a', fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },
});