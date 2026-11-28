import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Tokens de DESIGN.MD §1 y §2 a mano; las fuentes de marca (Bricolage Grotesque, Manrope)
// llegan con packages/tokens. Mientras tanto, fuente del sistema.
const fondo = "#F2F2EE";
const tinta = "#121412";
const tintaSuave = "#5E625D";

export default function Index() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.titular}>
          Prendie
        </Text>
        <Text style={styles.cuerpo}>
          La app está en construcción. Por ahora tu asesor vive en la web.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: fondo,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  // text-titular: 40/1.05, 800, -0.03em
  titular: {
    color: tinta,
    fontSize: 40,
    lineHeight: 42,
    fontWeight: "800",
    letterSpacing: -1.2,
  },
  // text-cuerpo: 15/22, 500
  cuerpo: {
    color: tintaSuave,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
  },
});
