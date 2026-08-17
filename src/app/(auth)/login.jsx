import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text, TextInput,
    TouchableOpacity,
    View
} from 'react-native';


export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();
    const styles = createStyles();

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            Alert.alert('Error', 'Please enter your username and password.');
            return;
        }
        setLoading(true);

        try {
            await login(username.trim(), password);
            router.replace('/(tabs)/');
        } catch (e) {
            Alert.alert('Login Failed', e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Background grid lines */}
                <View style={styles.gridOverlay} pointerEvents="none">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <View key={i} style={[styles.gridLine, { top: `${i * 14}%` }]} />
                    ))}
                </View>

                <View style={styles.inner}>
                    {/* Brand */}
                    <View style={styles.brandBlock}>
                        <View style={styles.logoMark}>
                            <Text style={styles.logoChar}>V</Text>
                        </View>
                        <Text style={styles.appName}>VAULT</Text>
                        <Text style={styles.tagline}>MULTI-CURRENCY WALLET</Text>
                    </View>

                    {/* Divider */}
                    <View style={styles.dividerRow}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>SECURE LOGIN</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>USERNAME</Text>
                            <TextInput
                                style={styles.input}
                                value={username}
                                onChangeText={setUsername}
                                placeholder="Enter username"
                                placeholderTextColor="#3a4a5a"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>PASSWORD</Text>
                            <TextInput
                                style={styles.input}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Enter password"
                                placeholderTextColor="#3a4a5a"
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading
                                ? <ActivityIndicator color="#0a0f14" size="small" />
                                : <Text style={styles.loginBtnText}>ACCESS ACCOUNT </Text>
                            }
                        </TouchableOpacity>
                    </View>

                    {/* Register link */}
                    <TouchableOpacity
                        style={styles.registerLink}
                        onPress={() => router.push('/(auth)/register')}
                    >
                        <Text style={styles.registerText}>
                            No account?{' '}
                            <Text style={styles.registerHighlight}>CREATE ONE</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
            {/* Bottom ticker */}
            <View style={styles.ticker}>
                <Text style={styles.tickerText}>
                    EUR/USD 1.0842 ▲  ·  GBP/USD 1.2715 ▼  ·  USD/NGN 1,615 ▲  ·  USD/JPY 149.32 ▼
                </Text>
            </View>
        </View>
    )
}

function createStyles() {
    return (
        StyleSheet.create({
            container: {
                flex: 1,
                backgroundColor: '#060b10',
            },
            gridOverlay: {
                ...StyleSheet.absoluteFillObject,
            },
            gridLine: {
                position: 'absolute',
                left: 0,
                right: 0,
                height: 1,
                backgroundColor: 'rgba(0, 255, 136, 0.04)',
            },
            inner: {
                flex: 1,
                paddingHorizontal: 28,
                paddingTop: 100,
                paddingBottom: 32,
                justifyContent: 'center',
            },
            brandBlock: {
                alignItems: 'center',
                marginBottom: 44,
            },
            logoMark: {
                width: 56,
                height: 56,
                borderWidth: 2,
                borderColor: 'rgba(113, 204, 162, 0.9)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
                transform: [{ rotate: '45deg' }],
            },
            logoChar: {
                color: '#00ff88',
                fontSize: 22,
                fontWeight: '800',
                transform: [{ rotate: '-45deg' }],
            },
            appName: {
                color: '#ffffff',
                fontSize: 28,
                fontWeight: '800',
                letterSpacing: 8,
            },
            tagline: {
                color: '#3a5a4a',
                fontSize: 10,
                letterSpacing: 4,
                marginTop: 4,
            },
            dividerRow: {
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 36,
            },
            dividerLine: {
                flex: 1,
                height: 1,
                backgroundColor: '#1a2a2a',
            },
            dividerText: {
                color: '#00ff88',
                fontSize: 10,
                letterSpacing: 3,
                marginHorizontal: 12,
            },
            form: {
                gap: 20,
                marginBottom: 28,
            },
            inputGroup: {
                gap: 6,
            },
            label: {
                color: '#4a7a6a',
                fontSize: 10,
                letterSpacing: 3,
                fontWeight: '600',
            },
            input: {
                backgroundColor: '#0d1620',
                borderWidth: 1,
                borderColor: '#1a2e2e',
                color: '#e0fff0',
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
                fontWeight: '500',
            },
            loginBtn: {
                backgroundColor: '#00ff88',
                paddingVertical: 16,
                alignItems: 'center',
                marginTop: 8,
            },
            loginBtnDisabled: {
                opacity: 0.5,
            },
            loginBtnText: {
                color: '#060b10',
                fontSize: 13,
                fontWeight: '800',
                letterSpacing: 3,
            },
            registerLink: {
                alignItems: 'center',
                paddingVertical: 8,
            },
            registerText: {
                color: '#3a5a4a',
                fontSize: 13,
                letterSpacing: 1,
            },
            registerHighlight: {
                color: '#00ff88',
                fontWeight: '700',
            },
            ticker: {
                borderTopWidth: 1,
                borderTopColor: '#0d2020',
                paddingTop: 10,
                paddingHorizontal: 28,
            },
            tickerText: {
                color: '#1a5a3a',
                fontSize: 10,
                letterSpacing: 1,
            },
        })
    )
}