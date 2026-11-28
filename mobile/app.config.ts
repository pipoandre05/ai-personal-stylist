import type { ConfigContext, ExpoConfig } from "expo/config";

// Variantes de la app. La de producción espera el bundle ID definitivo (A-05).
const VARIANTS = {
  development: { suffix: " (dev)", id: "cl.aps.app.dev" },
  preview: { suffix: " (preview)", id: "cl.aps.app.preview" },
} as const;

function resolveVariant() {
  const variant: string = process.env.APP_VARIANT ?? "development";
  if (variant === "production") {
    throw new Error("Bundle ID de producción pendiente (A-05)");
  }
  if (variant === "development" || variant === "preview") {
    return VARIANTS[variant];
  }
  throw new Error(
    `APP_VARIANT desconocido: "${variant}". Usa "development" o "preview".`,
  );
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const { suffix, id } = resolveVariant();

  return {
    ...config,
    name: `Prendie${suffix}`,
    slug: "prendie",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "aps",
    // DESIGN.MD: solo el tema Día en el MVP.
    userInterfaceStyle: "light",
    ios: {
      icon: "./assets/expo.icon",
      bundleIdentifier: id,
    },
    android: {
      package: id,
      adaptiveIcon: {
        backgroundColor: "#F2F2EE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: "server",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#F2F2EE",
          image: "./assets/images/splash-icon.png",
          imageWidth: 76,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  };
};
