import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Calendar, Lock, Globe, Key } from 'lucide-react-native';
import { useOS } from '../../context/OSContext';

const CASINO_QUOTE = {
  text: `"In Vegas, everybody's gotta watch everybody else. Since the players are
trying to cheat the casino and the dealers are trying to cheat the players...
and the casino is watching everybody to keep them all honest.
All the way up, I'm being watched like a hawk."`,
  attribution: '— Sam "Ace" Rothstein · Casino, 1995',
};

export default function ProfileScreen() {
  const os = useOS();
  const [eggRevealed, setEggRevealed] = useState(false);
  const user = os.user || { name: 'User', accessLevel: 'DEVELOPER' };

  const joinDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.headerStrip} />

        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name[0]?.toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <View style={styles.roleWrapper}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{user.accessLevel}</Text>
            </View>
            <Text style={styles.domainText}>· devlab.local</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Calendar color="#4a4f6a" size={18} />
            <Text style={styles.infoLabel}>Session started</Text>
            <Text style={styles.infoValue}>{joinDate}</Text>
          </View>
          <View style={styles.infoRow}>
            <Lock color="#4a4f6a" size={18} />
            <Text style={styles.infoLabel}>Clearance level</Text>
            <Text style={styles.infoValue}>{user.accessLevel}</Text>
          </View>
          <View style={styles.infoRow}>
            <Globe color="#4a4f6a" size={18} />
            <Text style={styles.infoLabel}>Node</Text>
            <Text style={styles.infoValue}>devlab.local · v3.7.1</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Key color="#4a4f6a" size={18} />
            <Text style={styles.infoLabel}>Stack</Text>
            <Text style={styles.infoValue}>Expo · RN · NativeWind</Text>
          </View>
        </View>

        <View style={styles.eggSection}>
          <View style={styles.eggHeader}>
            <Text style={styles.eggIcon}>🎰</Text>
            <Text style={styles.eggTitle}>Secret Easter Egg</Text>
            <View style={styles.eggTag}>
              <Text style={styles.eggTagText}>hidden</Text>
            </View>
          </View>

          {!eggRevealed ? (
            <TouchableOpacity
              style={styles.scratchArea}
              activeOpacity={0.8}
              onPress={() => setEggRevealed(true)}
            >
              <Text style={styles.scratchTitle}>🪙  Tap to reveal  🪙</Text>
              <Text style={styles.scratchSub}>(Discover the secret phrase)</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.revealedArea}>
              <Text style={styles.quoteText}>{CASINO_QUOTE.text}</Text>
              <Text style={styles.quoteAttr}>{CASINO_QUOTE.attribution}</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  content: {
    padding: 16,
    paddingTop: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e5ef',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 8,
  },
  headerStrip: {
    height: 80,
    backgroundColor: '#6200ea', // Will be gradient conceptually
  },
  avatarSection: {
    paddingHorizontal: 20,
    marginTop: -28,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6200ea',
    borderWidth: 3,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1d2e',
    letterSpacing: -0.4,
  },
  roleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#f5f3ff',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(98, 0, 234, 0.15)',
  },
  chipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6200ea',
    fontFamily: 'Courier',
    textTransform: 'uppercase',
  },
  domainText: {
    fontSize: 11,
    color: '#8b90a8',
    fontFamily: 'Courier',
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e5ef',
    gap: 12,
  },
  infoLabel: {
    flex: 1,
    fontSize: 13,
    color: '#8b90a8',
  },
  infoValue: {
    fontSize: 12,
    color: '#1a1d2e',
    fontWeight: '500',
    fontFamily: 'Courier',
  },
  eggSection: {
    padding: 20,
    paddingTop: 0,
  },
  eggHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  eggIcon: {
    fontSize: 16,
  },
  eggTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4a4f6a',
  },
  eggTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
    backgroundColor: '#fff8e1',
    borderWidth: 1,
    borderColor: 'rgba(245,127,23,0.2)',
  },
  eggTagText: {
    fontSize: 10,
    color: '#f57f17',
    fontFamily: 'Courier',
  },
  scratchArea: {
    height: 120,
    backgroundColor: '#d4d4e8',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scratchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(26,29,46,0.6)',
  },
  scratchSub: {
    fontSize: 12,
    color: 'rgba(26,29,46,0.4)',
    marginTop: 4,
  },
  revealedArea: {
    backgroundColor: '#1a1d2e',
    borderRadius: 12,
    padding: 16,
  },
  quoteText: {
    fontSize: 12,
    color: '#cdd6f4',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  quoteAttr: {
    fontSize: 11,
    color: '#a78bfa',
    marginTop: 10,
    fontFamily: 'Courier',
  },
});
