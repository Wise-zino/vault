import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

function TabIcon({ label, focused, symbol }) {
  return (
    <View style={[styles.tabIconWrap, focused && styles.tabIconFocused]}>
      <Text style={[styles.tabSymbol, focused && styles.tabSymbolFocused]}>
        {symbol}
      </Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="WALLET" focused={focused} symbol="◈" />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="HISTORY" focused={focused} symbol="◉" />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="MARKETS" focused={focused} symbol="◎" />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="ACCOUNT" focused={focused} symbol="◌" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#080e14',
    borderTopWidth: 1,
    borderTopColor: '#0d2020',
    height: 72,
    paddingBottom: 0,
    paddingTop: 0,
  },
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    gap: 3,
    minWidth: 60,
  },
  tabIconFocused: {},
  tabSymbol: {
    fontSize: 20,
    color: '#2a4a3a',
  },
  tabSymbolFocused: {
    color: '#00ff88',
  },
  tabLabel: {
    fontSize: 8,
    letterSpacing: 2,
    color: '#2a4a3a',
    fontWeight: '700',
  },
  tabLabelFocused: {
    color: '#00ff88',
  },
});