import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

function AuthGuard(){
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)'; // checks if the user is in any auth groups or auth pages
    if (!user && !inAuthGroup) {
      // if user is not authenticated and is not in any auth groups then redirect to login
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // redirect to index in tabs
      router.replace('/(tabs)');
    }
  }, [user, loading, segments])

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AuthProvider>
  );  
}