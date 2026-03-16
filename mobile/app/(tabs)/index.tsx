import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Dimensions, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { FileText, Edit3, Eraser, PenTool, Terminal as TerminalIcon, Github } from 'lucide-react-native';
import { useOS, AppId } from '../../context/OSContext';
import DevRewindModal from '../../components/DevRewindModal';

const MODULES = [
  {
    id: 'notes-app' as AppId,
    icon: <FileText color="#ff9800" size={24} />,
    title: 'Broski Board',
    desc: 'Advanced notes, reminders, and todo tracking synchronized to your workflow.',
    tag: 'Productivity',
    color: '#ff9800',
    bg: '#fff3e0',
  },
  {
    id: 'whiteboard' as AppId,
    icon: <Edit3 color="#1976d2" size={24} />,
    title: 'Whiteboard',
    desc: 'Infinite collaborative canvas for sketches, diagrams, and brainstorming.',
    tag: 'Canvas',
    color: '#1976d2',
    bg: '#e3f2fd',
  },
  {
    id: 'neural-eraser' as AppId,
    icon: <Eraser color="#7b1fa2" size={24} />,
    title: 'Neural Eraser',
    desc: 'Remove watermarks and artifacts from images using pixel-level canvas analysis.',
    tag: 'AI Tool',
    color: '#7b1fa2',
    bg: '#f3e5f5',
  },
  {
    id: 'pdf-editor' as AppId,
    icon: <PenTool color="#d32f2f" size={24} />,
    title: 'PDF Editor',
    desc: 'Annotate, draw, highlight, and export PDFs — natively.',
    tag: 'Editor',
    color: '#d32f2f',
    bg: '#ffebee',
  },
];

const SKILLS = [
  { label: 'Next.js / React', pct: 95 },
  { label: 'React Native', pct: 90 },
  { label: 'TypeScript', pct: 88 },
  { label: 'Framer / Reanimated', pct: 82 },
  { label: 'Node.js', pct: 78 },
  { label: 'Python / AI', pct: 72 },
];

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const os = useOS();
  const router = useRouter();

  const [gitUsername, setGitUsername] = useState('');
  const [rewindOpen, setRewindOpen] = useState(false);
  const [activeUser, setActiveUser] = useState('');
  const [ghStats, setGhStats] = useState<any>(null);

  const handleGenerate = () => {
    if (gitUsername) setRewindOpen(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Modal visible={rewindOpen} transparent animationType="fade">
        <DevRewindModal
          username={gitUsername}
          onClose={() => setRewindOpen(false)}
          onComplete={(s) => {
            setGhStats(s);
            setActiveUser(gitUsername);
            setRewindOpen(false);
          }}
        />
      </Modal>

      {/* Hero section */}
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>SYSTEM ONLINE</Text>
        </View>
        <Text style={styles.heroTitle}>
          Good to see you, <Text style={styles.brandText}>{os.user?.name}</Text> 👋
        </Text>
        <Text style={styles.heroDesc}>
          Your interactive lab is ready. Launch any module below or open the terminal for native access.
        </Text>

        {!activeUser ? (
          <View style={styles.rewindBox}>
            <Text style={styles.rewindTitle}>Developer Rewind</Text>
            <Text style={styles.rewindDesc}>Connect a GitHub profile to uncover your coding story & heatmap calendar.</Text>
            <TextInput
              style={styles.rewindInput}
              placeholder="GitHub username"
              placeholderTextColor="#8b90a8"
              value={gitUsername}
              onChangeText={setGitUsername}
              autoCapitalize="none"
              onSubmitEditing={handleGenerate}
            />
            <TouchableOpacity
              style={[styles.rewindBtn, !gitUsername && { opacity: 0.6 }]}
              disabled={!gitUsername}
              onPress={handleGenerate}
            >
              <Text style={styles.rewindBtnText}>Generate Wrapped ✨</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.rewindBox}>
            <View style={styles.rewindHeader}>
              <Github color="#4a4f6a" size={20} />
              <Text style={styles.rewindTitleSmall}>@{activeUser}</Text>
              <TouchableOpacity onPress={() => setActiveUser('')} style={styles.changeBtn}>
                <Text style={styles.changeBtnText}>Change</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.ghStatsGrid}>
              <View style={styles.ghStatItem}>
                <Text style={styles.ghStatIcon}>📦</Text>
                <Text style={styles.ghStatValue}>{ghStats?.repos}</Text>
                <Text style={styles.ghStatLabel}>Repos</Text>
              </View>
              <View style={styles.ghStatItem}>
                <Text style={styles.ghStatIcon}>🔥</Text>
                <Text style={styles.ghStatValue}>{ghStats?.commits}</Text>
                <Text style={styles.ghStatLabel}>Commits</Text>
              </View>
              <View style={styles.ghStatItem}>
                <Text style={styles.ghStatIcon}>⭐</Text>
                <Text style={styles.ghStatValue}>{ghStats?.stars}</Text>
                <Text style={styles.ghStatLabel}>Stars</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Lab Modules</Text>

      {/* Modules List */}
      <View style={styles.modulesContainer}>
        {MODULES.map((mod) => (
          <TouchableOpacity
            key={mod.id}
            style={styles.moduleCard}
            onPress={() => os.pushApp(mod.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: mod.bg, borderColor: `${mod.color}22` }]}>
              {mod.icon}
            </View>
            <View style={styles.moduleInfo}>
              <View style={styles.moduleTitleRow}>
                <Text style={styles.moduleTitle}>{mod.title}</Text>
                <View style={[styles.moduleTagBox, { backgroundColor: mod.bg, borderColor: `${mod.color}30` }]}>
                  <Text style={[styles.moduleTagText, { color: mod.color }]}>{mod.tag}</Text>
                </View>
              </View>
              <Text style={styles.moduleDesc} numberOfLines={2}>{mod.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Terminal Button */}
        <TouchableOpacity
          style={styles.terminalBtn}
          onPress={() => os.openTerminal()}
          activeOpacity={0.7}
        >
          <View style={styles.terminalIconBox}>
            <Text style={styles.terminalIconText}>$_</Text>
          </View>
          <View>
            <Text style={styles.terminalTitle}>Open Terminal</Text>
            <Text style={styles.terminalDesc}>Command-line interface</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={{ height: 16 }} />

      {/* Skills Proficiency */}
      <View style={styles.sideCard}>
        <Text style={styles.sideCardTitle}>Skill Proficiency</Text>
        {SKILLS.map((sk) => (
          <View key={sk.label} style={styles.skillRow}>
            <View style={styles.skillHeader}>
              <Text style={styles.skillLabel}>{sk.label}</Text>
              <Text style={styles.skillPct}>{sk.pct}%</Text>
            </View>
            <View style={styles.skillTrack}>
              <View style={[styles.skillFill, { width: `${sk.pct}%` }]} />
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 16 }} />

      {/* Session Info */}
      <View style={styles.sideCard}>
        <Text style={styles.sideCardTitle}>Session Info</Text>
        <View style={styles.sessionRow}>
          <Text style={styles.sessionLabel}>User</Text>
          <Text style={styles.sessionValue}>{os.user?.name}</Text>
        </View>
        <View style={styles.sessionRow}>
          <Text style={styles.sessionLabel}>Access</Text>
          <Text style={styles.sessionValue}>{os.user?.accessLevel}</Text>
        </View>
        <View style={styles.sessionRow}>
          <Text style={styles.sessionLabel}>Session</Text>
          <Text style={styles.sessionValue}>Local · Secure</Text>
        </View>
        <View style={[styles.sessionRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.sessionLabel}>Lab version</Text>
          <Text style={styles.sessionValue}>v3.7.1</Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
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
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e5ef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 24,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00897b',
  },
  statusText: {
    fontFamily: 'Courier',
    fontSize: 11,
    color: '#8b90a8',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1a1d2e',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  brandText: {
    color: '#6200ea',
  },
  heroDesc: {
    fontSize: 14,
    color: '#4a4f6a',
    lineHeight: 22,
    marginBottom: 24,
  },
  rewindBox: {
    backgroundColor: '#f8f9fc',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e5ef',
    alignItems: 'center',
  },
  rewindTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1d2e',
    marginBottom: 6,
  },
  rewindDesc: {
    fontSize: 13,
    color: '#4a4f6a',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  rewindInput: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c8cde0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Courier',
    marginBottom: 10,
  },
  rewindBtn: {
    width: '100%',
    backgroundColor: '#6200ea',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  rewindBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  rewindHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    width: '100%',
  },
  rewindTitleSmall: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1d2e',
    flex: 1,
  },
  changeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f1f3f9',
    borderRadius: 6,
  },
  changeBtnText: {
    fontSize: 11,
    color: '#4a4f6a',
    fontWeight: '600',
  },
  ghStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  ghStatItem: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e5ef',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  ghStatIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  ghStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1d2e',
  },
  ghStatLabel: {
    fontSize: 11,
    color: '#8b90a8',
    marginTop: 2,
    fontFamily: 'Courier',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4a4f6a',
    marginBottom: 12,
    marginLeft: 4,
  },
  modulesContainer: {
    gap: 12,
  },
  moduleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e5ef',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  moduleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1d2e',
    letterSpacing: -0.2,
  },
  moduleTagBox: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
    borderWidth: 1,
  },
  moduleTagText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Courier',
  },
  moduleDesc: {
    fontSize: 13,
    color: '#4a4f6a',
    lineHeight: 18,
  },
  terminalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#f8f9fc',
    borderWidth: 1.5,
    borderColor: '#e2e5ef',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 16,
  },
  terminalIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f1f3f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  terminalIconText: {
    fontFamily: 'Courier',
    fontWeight: '700',
    fontSize: 14,
    color: '#4a4f6a',
  },
  terminalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1d2e',
    marginBottom: 2,
  },
  terminalDesc: {
    fontSize: 12,
    color: '#8b90a8',
    fontFamily: 'Courier',
  },
  sideCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e5ef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sideCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4a4f6a',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  skillRow: {
    marginBottom: 12,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  skillLabel: {
    fontSize: 13,
    color: '#1a1d2e',
    fontWeight: '500',
  },
  skillPct: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#8b90a8',
    fontWeight: '600',
  },
  skillTrack: {
    height: 5,
    backgroundColor: '#f1f3f9',
    borderRadius: 100,
  },
  skillFill: {
    height: '100%',
    backgroundColor: '#6200ea',
    borderRadius: 100,
    opacity: 0.8,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e5ef',
  },
  sessionLabel: {
    fontSize: 12,
    color: '#8b90a8',
  },
  sessionValue: {
    fontSize: 12,
    color: '#4a4f6a',
    fontWeight: '500',
    fontFamily: 'Courier',
  },
});
