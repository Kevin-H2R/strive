import { OnboardingScreen } from "@/components/onboarding";
import { useColorScheme } from "@/components/useColorScheme";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useCallback } from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { TamaguiProvider } from "tamagui";
import config from "../tamagui.config";
import { theme } from "@/constants/theme";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

function useProtectedRoute(navigationEnabled: boolean) {
  const segments = useSegments();
  const router = useRouter();
  const { session, isLoading, setSession } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading || !navigationEnabled) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [session, segments, isLoading, navigationEnabled]);
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { session, isLoading } = useAuthStore();
  const { hasCompletedOnboarding, completeOnboarding } = useOnboardingStore();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useProtectedRoute(!showOnboarding);

  // Check if we should show onboarding — also verify against DB
  useEffect(() => {
    if (isLoading || !session) return;
    if (hasCompletedOnboarding) return;

    // Check if user already has templates in the database
    supabase
      .from('workout_templates')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .then(({ count }) => {
        if (count && count > 0) {
          // Already onboarded on another device — mark locally as done
          completeOnboarding();
        } else {
          setShowOnboarding(true);
        }
      });
  }, [isLoading, session, hasCompletedOnboarding]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  // Show onboarding if needed
  if (showOnboarding && session) {
    return (
      <TamaguiProvider config={config} defaultTheme={colorScheme ?? "light"}>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <OnboardingScreen onComplete={handleOnboardingComplete} />
        </ThemeProvider>
      </TamaguiProvider>
    );
  }

  return (
    <TamaguiProvider config={config} defaultTheme={colorScheme ?? "light"}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen
            name="template/[id]"
            options={{
              title: "Template",
              headerStyle: { backgroundColor: theme.background },
              headerTintColor: theme.text,
            }}
          />
        </Stack>
      </ThemeProvider>
    </TamaguiProvider>
  );
}
