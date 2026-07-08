import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const logo = require('../assets/images/logo.png');

export default function IndexScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground source={logo} resizeMode="cover" blurRadius={36} style={styles.background}>
        <View style={styles.overlay}>
          <View style={styles.brandPanel}>
            <View style={styles.logoFrame}>
              <Image source={logo} resizeMode="contain" style={styles.logo} />
            </View>
            <Text style={styles.eyebrow}>Soft Darts Training Coach</Text>
            <Text style={styles.title}>DartsSupportApp</Text>
            <Text style={styles.subtitle}>
              今日の練習、記録、分析、フォーム相談をひとつにまとめる iPhone 向けMVP。
            </Text>
          </View>

          <View style={styles.previewCard}>
            <Text style={styles.cardTitle}>今日の処方</Text>
            <Text style={styles.cardMeta}>30分 | 中級 | Cricket強化</Text>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
            <View style={styles.metricsRow}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>7.8</Text>
                <Text style={styles.metricLabel}>RT</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>62%</Text>
                <Text style={styles.metricLabel}>週間達成</Text>
              </View>
            </View>
          </View>

          <Pressable accessibilityRole="button" style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>診断して開始</Text>
          </Pressable>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#071018',
  },
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: 'rgba(7, 16, 24, 0.92)',
  },
  brandPanel: {
    alignItems: 'center',
    paddingTop: 44,
  },
  logoFrame: {
    width: 152,
    height: 152,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#284059',
    backgroundColor: '#101a27',
  },
  logo: {
    width: 116,
    height: 116,
  },
  eyebrow: {
    marginTop: 28,
    color: '#35e0a1',
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    marginTop: 8,
    color: '#f3f7fb',
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 14,
    color: '#98a5b5',
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
  },
  previewCard: {
    gap: 10,
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#253449',
    backgroundColor: '#121c2a',
  },
  cardTitle: {
    color: '#f3f7fb',
    fontSize: 20,
    fontWeight: '800',
  },
  cardMeta: {
    color: '#98a5b5',
    fontSize: 13,
    fontWeight: '600',
  },
  progressTrack: {
    height: 10,
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: '#293547',
  },
  progressFill: {
    width: '62%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#35e0a1',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metric: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#0d1622',
  },
  metricValue: {
    color: '#f3f7fb',
    fontSize: 24,
    fontWeight: '800',
  },
  metricLabel: {
    marginTop: 4,
    color: '#657386',
    fontSize: 12,
    fontWeight: '700',
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    borderRadius: 999,
    backgroundColor: '#35e0a1',
  },
  primaryButtonText: {
    color: '#06120d',
    fontSize: 16,
    fontWeight: '800',
  },
});
