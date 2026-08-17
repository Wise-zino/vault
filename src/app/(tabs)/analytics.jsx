import { getHistoricalRates, getLiveRates } from '@/constants/api';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 48;
const CHART_HEIGHT = 180;

// ─── Live Rate Ticker Item ─────────────────────────────────────────
function RateTicker({ base, currency, rate, prevRate }) {
  const change = prevRate ? ((rate - prevRate) / prevRate) * 100 : 0;
  const up = change >= 0;
  return (
    <View style={styles.tickerItem}>
      <Text style={styles.tickerPair}>{base}/{currency}</Text>
      <Text style={styles.tickerRate}>{rate?.toFixed(4)}</Text>
      <View style={[styles.tickerBadge, up ? styles.tickerBadgeUp : styles.tickerBadgeDown]}>
        <Text style={[styles.tickerChange, up ? styles.tickerChangeUp : styles.tickerChangeDown]}>
          {up ? '▲' : '▼'} {Math.abs(change).toFixed(3)}%
        </Text>
      </View>
    </View>
  );
}

// ─── Mini SVG-style Line Chart using Views ─────────────────────────
function LineChart({ data, color = '#00ff88' }) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padH = 24;
  const padV = 16;
  const usableW = CHART_WIDTH - padH * 2;
  const usableH = CHART_HEIGHT - padV * 2;

  const points = data.map((v, i) => ({
    x: padH + (i / (data.length - 1)) * usableW,
    y: padV + (1 - (v - min) / range) * usableH,
  }));

  // Render as a series of line segments using positioned views
  const segments = points.slice(1).map((pt, i) => {
    const prev = points[i];
    const dx = pt.x - prev.x;
    const dy = pt.y - prev.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    return { left: prev.x, top: prev.y, width: length, angle };
  });

  // Gradient fill approximation: stacked horizontal bars
  const fillBars = points.slice(1).map((pt, i) => {
    const prev = points[i];
    const topY = Math.min(prev.y, pt.y);
    const barH = Math.max(prev.y, pt.y) - topY;
    const x = Math.min(prev.x, pt.x);
    const w = Math.abs(pt.x - prev.x) + 1;
    return { left: x, top: topY, width: w, height: barH + (usableH + padV - topY) };
  });

  return (
    <View style={[styles.chartWrap, { width: CHART_WIDTH, height: CHART_HEIGHT }]}>
      {/* Fill */}
      {fillBars.map((bar, i) => (
        <View
          key={`fill-${i}`}
          style={{
            position: 'absolute',
            left: bar.left, top: bar.top,
            width: bar.width, height: bar.height,
            backgroundColor: `${color}08`,
          }}
        />
      ))}
      {/* Line segments */}
      {segments.map((seg, i) => (
        <View
          key={`seg-${i}`}
          style={{
            position: 'absolute',
            left: seg.left, top: seg.top,
            width: seg.width, height: 2,
            backgroundColor: color,
            transformOrigin: 'left center',
            transform: [{ rotate: `${seg.angle}deg` }],
          }}
        />
      ))}
      {/* Last point dot */}
      <View style={{
        position: 'absolute',
        left: points[points.length - 1].x - 5,
        top: points[points.length - 1].y - 5,
        width: 10, height: 10,
        borderRadius: 5,
        backgroundColor: color,
        borderWidth: 2, borderColor: '#060b10',
      }} />
      {/* Price labels */}
      <Text style={[styles.chartLabel, { left: padH, top: padV - 14 }]}>
        {max.toFixed(4)}
      </Text>
      <Text style={[styles.chartLabel, { left: padH, top: usableH + padV + 2 }]}>
        {min.toFixed(4)}
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────
const PAIRS = [
  { base: 'EUR', quote: 'USD' },
  { base: 'GBP', quote: 'USD' },
  { base: 'USD', quote: 'NGN' },
  { base: 'USD', quote: 'JPY' },
];

const RATE_BASES = ['USD', 'EUR', 'GBP'];

export default function AnalyticsScreen() {
  const [liveRates, setLiveRates] = useState({});
  const [prevRates, setPrevRates] = useState({});
  const [selectedBase, setSelectedBase] = useState('USD');
  const [selectedPair, setSelectedPair] = useState(PAIRS[0]);
  const [historicalData, setHistoricalData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  const fetchRates = async (base) => {
    try {
      const data = await getLiveRates(base);
      setPrevRates((prev) => ({ ...prev, [base]: liveRates[base] }));
      setLiveRates((prev) => ({ ...prev, [base]: data.rates }));
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Rate fetch error', e);
    } finally {
      setRatesLoading(false);
    }
  };

  useEffect(() => {
    fetchRates(selectedBase);
    intervalRef.current = setInterval(() => fetchRates(selectedBase), 10000);
    return () => clearInterval(intervalRef.current);
  }, [selectedBase]);

  const fetchHistorical = async (pair) => {
    setChartLoading(true);
    try {
      const data = await getHistoricalRates(pair.base, pair.quote);
      if (data.rates) {
        const values = Object.values(data.rates).map((r) => r[pair.quote]);
        setHistoricalData(values);
      }
    } catch (e) {
      console.error('Historical fetch error', e);
    } finally {
      setChartLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorical(selectedPair);
  }, [selectedPair]);

  const currentRates = liveRates[selectedBase] || {};
  const prevCurrentRates = prevRates[selectedBase] || {};

  const displayCurrencies = Object.keys(currentRates).slice(0, 8);

  const chartChange = historicalData.length >= 2
    ? ((historicalData[historicalData.length - 1] - historicalData[0]) / historicalData[0]) * 100
    : 0;
  const chartUp = chartChange >= 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>MARKET WATCH</Text>
          <Text style={styles.headerSub}>
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString()}`
              : 'Fetching rates...'}
          </Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Base currency selector */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>BASE CURRENCY</Text>
          <View style={styles.sectionLine} />
        </View>
        <View style={styles.baseRow}>
          {RATE_BASES.map((b) => (
            <TouchableOpacity
              key={b}
              style={[styles.baseTab, selectedBase === b && styles.baseTabActive]}
              onPress={() => setSelectedBase(b)}
            >
              <Text style={[styles.baseTabText, selectedBase === b && styles.baseTabTextActive]}>
                {b}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Live rates grid */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>EXCHANGE RATES</Text>
          <View style={styles.sectionLine} />
        </View>
        {ratesLoading ? (
          <ActivityIndicator color="#00ff88" style={{ marginVertical: 24 }} />
        ) : (
          <View style={styles.ratesGrid}>
            {displayCurrencies.map((currency) => (
              <RateTicker
                key={currency}
                base={selectedBase}
                currency={currency}
                rate={currentRates[currency]}
                prevRate={prevCurrentRates[currency]}
              />
            ))}
          </View>
        )}

        {/* Chart section */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>90-DAY CHART</Text>
          <View style={styles.sectionLine} />
        </View>

        {/* Pair selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pairScroll}>
          {PAIRS.map((pair) => {
            const key = `${pair.base}/${pair.quote}`;
            const active = selectedPair.base === pair.base && selectedPair.quote === pair.quote;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.pairTab, active && styles.pairTabActive]}
                onPress={() => setSelectedPair(pair)}
              >
                <Text style={[styles.pairTabText, active && styles.pairTabTextActive]}>
                  {key}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Chart card */}
        <View style={styles.chartCard}>
          <View style={styles.chartCardHeader}>
            <Text style={styles.chartPairLabel}>
              {selectedPair.base}/{selectedPair.quote}
            </Text>
            <View style={[styles.changeChip, chartUp ? styles.changeChipUp : styles.changeChipDown]}>
              <Text style={[styles.changeChipText, chartUp ? styles.changeTextUp : styles.changeTextDown]}>
                {chartUp ? '▲' : '▼'} {Math.abs(chartChange).toFixed(2)}% (90d)
              </Text>
            </View>
          </View>
          {chartLoading ? (
            <View style={styles.chartPlaceholder}>
              <ActivityIndicator color="#00ff88" />
            </View>
          ) : historicalData.length > 0 ? (
            <LineChart
              data={historicalData}
              color={chartUp ? '#00ff88' : '#ff4466'}
            />
          ) : (
            <View style={styles.chartPlaceholder}>
              <Text style={styles.chartPlaceholderText}>NO DATA</Text>
            </View>
          )}

          {/* Current rate display */}
          {historicalData.length > 0 && (
            <View style={styles.currentRateRow}>
              <Text style={styles.currentRateLabel}>CURRENT</Text>
              <Text style={styles.currentRateValue}>
                {historicalData[historicalData.length - 1]?.toFixed(5)}
              </Text>
            </View>
          )}
        </View>

        {/* Market info cards */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>MARKET INFO</Text>
          <View style={styles.sectionLine} />
        </View>
        <View style={styles.infoGrid}>
          <InfoCard title="FOREX HOURS" value="24/5" sub="Mon–Fri, global" />
          <InfoCard title="MAJORS" value="28" sub="Most traded pairs" />
          <InfoCard title="DAILY VOL" value="$7.5T" sub="Global FX market" />
          <InfoCard title="DATA DELAY" value="~10s" sub="Refresh interval" />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function InfoCard({ title, value, sub }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoCardTitle}>{title}</Text>
      <Text style={styles.infoCardValue}>{value}</Text>
      <Text style={styles.infoCardSub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060b10' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#0d2020',
  },
  headerTitle: { color: '#ffffff', fontSize: 20, fontWeight: '900', letterSpacing: 2 },
  headerSub: { color: '#3a5a4a', fontSize: 11, marginTop: 2 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: '#1a4a2a',
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: '#081208',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00ff88' },
  liveText: { color: '#00ff88', fontSize: 10, fontWeight: '800', letterSpacing: 2 },

  scroll: { flex: 1, paddingHorizontal: 24 },
  sectionRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 24, marginBottom: 14, gap: 12,
  },
  sectionLabel: { color: '#3a5a4a', fontSize: 10, letterSpacing: 3, fontWeight: '700' },
  sectionLine: { flex: 1, height: 1, backgroundColor: '#0d2020' },

  baseRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  baseTab: {
    paddingHorizontal: 20, paddingVertical: 9,
    borderWidth: 1, borderColor: '#1a2e2e',
  },
  baseTabActive: { backgroundColor: '#00ff88', borderColor: '#00ff88' },
  baseTabText: { color: '#4a7a6a', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  baseTabTextActive: { color: '#060b10' },

  ratesGrid: { gap: 2 },
  tickerItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: '#0a0f14',
    borderBottomWidth: 1, borderBottomColor: '#0d1a1a',
  },
  tickerPair: { color: '#8aaa9a', fontSize: 13, fontWeight: '700', width: 80, letterSpacing: 1 },
  tickerRate: { color: '#ffffff', fontSize: 14, fontWeight: '700', flex: 1, textAlign: 'center' },
  tickerBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    minWidth: 80, alignItems: 'center',
  },
  tickerBadgeUp: { backgroundColor: '#0a1e12' },
  tickerBadgeDown: { backgroundColor: '#1e0a0a' },
  tickerChange: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  tickerChangeUp: { color: '#00ff88' },
  tickerChangeDown: { color: '#ff4466' },

  pairScroll: { marginBottom: 14 },
  pairTab: {
    paddingHorizontal: 16, paddingVertical: 8, marginRight: 8,
    borderWidth: 1, borderColor: '#1a2e2e',
  },
  pairTabActive: { borderColor: '#00ff88', backgroundColor: '#0a1e14' },
  pairTabText: { color: '#4a7a6a', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  pairTabTextActive: { color: '#00ff88' },

  chartCard: {
    backgroundColor: '#0a0f14',
    borderWidth: 1, borderColor: '#1a2e2e',
    padding: 16, gap: 12,
  },
  chartCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  chartPairLabel: { color: '#ffffff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  changeChip: { paddingHorizontal: 10, paddingVertical: 4 },
  changeChipUp: { backgroundColor: '#0a1e12' },
  changeChipDown: { backgroundColor: '#1e0a0a' },
  changeChipText: { fontSize: 11, fontWeight: '700' },
  changeTextUp: { color: '#00ff88' },
  changeTextDown: { color: '#ff4466' },

  chartWrap: { position: 'relative' },
  chartLabel: {
    position: 'absolute',
    color: '#3a5a4a', fontSize: 9, letterSpacing: 0.5,
  },
  chartPlaceholder: {
    width: CHART_WIDTH, height: CHART_HEIGHT,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#080d12',
  },
  chartPlaceholderText: { color: '#2a4a3a', fontSize: 11, letterSpacing: 3 },

  currentRateRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 8, borderTopWidth: 1, borderTopColor: '#0d2020',
  },
  currentRateLabel: { color: '#3a5a4a', fontSize: 10, letterSpacing: 3 },
  currentRateValue: { color: '#00ff88', fontSize: 18, fontWeight: '800' },

  infoGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  infoCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: '#0a0f14',
    borderWidth: 1, borderColor: '#1a2e2e',
    padding: 16, gap: 4,
  },
  infoCardTitle: { color: '#3a5a4a', fontSize: 9, letterSpacing: 3, fontWeight: '700' },
  infoCardValue: { color: '#ffffff', fontSize: 22, fontWeight: '900' },
  infoCardSub: { color: '#2a4a3a', fontSize: 11 },
});