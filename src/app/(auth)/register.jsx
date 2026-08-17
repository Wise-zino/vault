import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text, TextInput,
    TouchableOpacity,
    View
} from 'react-native';


export default function RegisterScreen(){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const router = useRouter();
    const styles = createStyles();

    const handleRegister = async () => {
        if (!username.trim() || !password.trim()) {
            Alert.alert('Error', 'All fields are required');
            return;
        }
        if (password != confirm) {
            Alert('Error', 'Passwords do not match');
            return;
        }
        if (password.length < 6){
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }
        setLoading(true);
        try {
            await register(username.trim(), password);
            router.replace('/(tabs)/');
            /*Alert.alert('Success', 'Account created! Please log in', [
                { text: 'OK', onPress: () => router.replace('/(auth)/login') },
            ]);*/
        } catch (e) {
            Alert.alert('Registration Failed', e.message);
        } finally {
            setLoading(false);
        }
    }



    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding': 'height'}
        >
            <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
                {/* Back Button */}
                <TouchableOpacity style={styles.back} onPress={() => router.back()}>
                    <Text style={styles.backText}> BACK</Text>
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>CREATE{'\n'}ACCOUNT</Text>
                    <View style={styles.accentBar} />
                    <Text style={styles.subtitle}>
                        Open your multi-currency wallet in seconds
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>USERNAME</Text>
                        <TextInput
                            style={styles.input}
                            value={username}
                            onChangeText={setUsername}
                            placeholder="Choose a username"
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
                            placeholder="Min. 6 characters"
                            placeholderTextColor="#3a4a5a"
                            secureTextEntry
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>CONFIRM PASSWORD</Text>
                        <TextInput
                            style={[
                                styles.input,
                                confirm.length > 0 && confirm !== password && styles.inputError,
                            ]}
                            value={confirm}
                            onChangeText={setConfirm}
                            placeholder="Repeat password"
                            placeholderTextColor="#3a4a5a"
                            secureTextEntry
                        />

                        {confirm.length > 0 && confirm !== password && (
                            <Text style={styles.errorHint}>Passwords don't match</Text>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.registerBtn, loading && styles.btnDisabled]}
                        onPress={handleRegister}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading
                            ? <ActivityIndicator color="#060b10" size="small" />
                            : <Text style={styles.registerBtnText}>CREATE ACCOUNT </Text>
                        }
                    </TouchableOpacity>

                    {/* Info card */}
                    <View style={styles.infoCard}>
                        <Text style={styles.infoTitle}>WHAT YOU GET</Text>
                        {['Multi-currency wallet (USD, EUR, NGN + more)',
                            'Real-time forex conversion',
                            'Full transaction history',
                            'Live market analytics'].map((item) => (
                            <Text key={item} style={styles.infoItem}>
                                <Text style={styles.bullet}>▸ </Text>{item}
                            </Text>
                        ))}
                    </View>

                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )

}


 function createStyles(){
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: '#060b10' },
        inner: {
            paddingHorizontal: 28,
            paddingTop: 60,
            paddingBottom: 40,
        },
        back: { marginBottom: 32 },
        backText: { color: '#00ff88', fontSize: 11, letterSpacing: 3, fontWeight: '700' },
        header: { marginBottom: 40 },
        title: {
           color: '#ffffff',
            fontSize: 40,
            fontWeight: '900',
            letterSpacing: 2,
            lineHeight: 46,
        },
        accentBar: {
            width: 48,
            height: 3,
            backgroundColor: '#00ff88',
            marginVertical: 16,
        },
        subtitle: {
            color: '#4a6a5a',
            fontSize: 14,
            letterSpacing: 0.5,
        },
        form: { gap: 20, marginBottom: 32 },
        inputGroup: { gap: 6 },
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
        inputError: {
            borderColor: '#ff4466',
        },
        errorHint: {
            color: '#ff4466',
            fontSize: 11,
            marginTop: 2,
        },
        registerBtn: {
            backgroundColor: '#00ff88',
            paddingVertical: 16,
            alignItems: 'center',
            marginTop: 8,
        },
        btnDisabled: { opacity: 0.5 },
        registerBtnText: {
            color: '#060b10',
            fontSize: 13,
            fontWeight: '800',
            letterSpacing: 3,
        },
        infoCard: {
            backgroundColor: '#0d1620',
            borderWidth: 1,
            borderColor: '#1a2e2e',
            borderLeftWidth: 3,
            borderLeftColor: '#00ff88',
            padding: 18,
            gap: 8,
        },
        infoTitle: {
            color: '#00ff88',
            fontSize: 10,
            letterSpacing: 3,
            fontWeight: '700',
            marginBottom: 6,
        },
        infoItem: { color: '#6a9a8a', fontSize: 13 },
        bullet: { color: '#00ff88' },
    });
}