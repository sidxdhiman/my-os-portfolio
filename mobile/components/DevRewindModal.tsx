import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing, TouchableOpacity, ActivityIndicator } from 'react-native';

const GRADIENTS = [
    ['#f43f5e', '#7c3aed'], // red to purple
    ['#0ea5e9', '#10b981'], // blue to green
    ['#f59e0b', '#ef4444'], // yellow to red
    ['#0f172a', '#312e81'], // dark slate to indigo
    ['#8b5cf6', '#ec4899'], // purple to pink
];

const { width, height } = Dimensions.get('window');

export default function DevRewindModal({ username, onComplete, onClose }: { username: string, onComplete: (s: any) => void, onClose: () => void }) {
    const [step, setStep] = useState(0);
    const [slide, setSlide] = useState(0);
    const [stats, setStats] = useState<any>(null);

    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        let isCommitsDone = false;
        let isUserDone = false;
        let isReposDone = false;
        let cStats = { repos: 0, commits: 0, year: new Date().getFullYear(), followers: 0, stars: 0, forks: 0, topLang: '', secondLang: '', thirdLang: '' };

        fetch(`https://api.github.com/users/${username}`)
            .then(res => res.json())
            .then(data => {
                if (data.public_repos !== undefined) {
                    cStats.repos = data.public_repos;
                    cStats.year = new Date(data.created_at || Date.now()).getFullYear();
                    cStats.followers = data.followers;
                }
                isUserDone = true;
                checkDone();
            }).catch(() => { isUserDone = true; checkDone(); });

        fetch(`https://api.github.com/search/commits?q=author:${username}`, {
            headers: { 'Accept': 'application/vnd.github.cloak-preview' }
        })
            .then(res => res.json())
            .then(data => {
                if (data.total_count !== undefined) {
                    cStats.commits = data.total_count;
                }
                isCommitsDone = true;
                checkDone();
            })
            .catch(() => { isCommitsDone = true; checkDone(); });

        fetch(`https://api.github.com/users/${username}/repos?per_page=100`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    let s = 0; let f = 0; let langs: Record<string, number> = {};
                    data.forEach(r => {
                        s += r.stargazers_count || 0;
                        f += r.forks_count || 0;
                        if (r.language) { langs[r.language] = (langs[r.language] || 0) + 1; }
                    });
                    cStats.stars = s;
                    cStats.forks = f;
                    const sortedLangs = Object.entries(langs).sort((a, b) => b[1] - a[1]).map(x => x[0]);
                    cStats.topLang = sortedLangs[0] || 'Code';
                    cStats.secondLang = sortedLangs[1] || '';
                    cStats.thirdLang = sortedLangs[2] || '';
                }
                isReposDone = true;
                checkDone();
            })
            .catch(() => { isReposDone = true; checkDone(); });

        function checkDone() {
            if (isUserDone && isCommitsDone && isReposDone) {
                setStats(cStats);
                setTimeout(() => setStep(1), 1500);
            }
        }
    }, [username]);

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();
    }, [slide, step]);

    useEffect(() => {
        if (step === 1 && slide < 8) {
            const timer = setTimeout(() => {
                fadeAnim.setValue(0);
                setSlide(s => s + 1);
            }, 4500);
            return () => clearTimeout(timer);
        }
    }, [step, slide]);

    const complete = () => {
        if (stats) onComplete(stats);
        else onClose();
    };

    const bgGradient = GRADIENTS[slide % GRADIENTS.length];

    return (
        <View style={[styles.container, { backgroundColor: bgGradient[0] }]}>
            {/* ProgressBar (Mock) */}
            {step === 1 && (
                <View style={styles.progressRow}>
                    {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                        <View key={i} style={[styles.progressBox, { backgroundColor: i <= slide ? '#fff' : 'rgba(255,255,255,0.3)' }]} />
                    ))}
                </View>
            )}

            {step === 1 && (
                <View style={styles.touchZones}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setSlide(s => Math.max(0, s - 1))} />
                    <TouchableOpacity style={{ flex: 2 }} onPress={() => setSlide(s => Math.min(8, s + 1))} />
                </View>
            )}

            <TouchableOpacity style={styles.skipBtn} onPress={complete} activeOpacity={0.8}>
                <Text style={styles.skipText}>Skip ✕</Text>
            </TouchableOpacity>

            <View style={styles.content}>
                {step === 0 && (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={styles.loadingText}>Accessing neural matrix for</Text>
                        <Text style={styles.userText}>@{username}...</Text>
                    </View>
                )}

                {step === 1 && (
                    <Animated.View style={[styles.centered, { opacity: fadeAnim }]}>
                        {slide === 0 && (
                            <View style={styles.slideCentered}>
                                <Text style={styles.slideSubtitle}>Let's rewind to</Text>
                                <Text style={styles.slideTitleHuge}>{stats?.year}</Text>
                                <Text style={styles.slideDesc}>The year your GitHub journey officially started.</Text>
                            </View>
                        )}
                        {slide === 1 && (
                            <View style={styles.slideLeft}>
                                <Text style={styles.slideTitleLarge}>Since then, you've become a serious builder.</Text>
                                <Text style={styles.slideStatHuge}>{stats?.repos}</Text>
                                <Text style={styles.slideStatLabel}>Public Repositories</Text>
                            </View>
                        )}
                        {slide === 2 && (
                            <View style={styles.slideRight}>
                                <Text style={styles.slideTitleLarge}>Fueled by caffeine and willpower...</Text>
                                <Text style={[styles.slideStatHuge, { color: '#fcd34d' }]}>{stats?.commits.toLocaleString()}</Text>
                                <Text style={styles.slideStatLabel}>Commits</Text>
                            </View>
                        )}
                        {slide === 3 && (
                            <View style={styles.slideCentered}>
                                <Text style={styles.slideSubtitle}>Your native tongue?</Text>
                                <Text style={[styles.slideTitleHuge, { fontSize: width * 0.2 }]}>{stats?.topLang}</Text>
                            </View>
                        )}
                        {slide === 4 && (
                            <View style={styles.slideCentered}>
                                <Text style={styles.slideSubtitle}>But you're multi-lingual.</Text>
                                {stats?.secondLang ? (
                                    <Text style={[styles.slideTitleLarge, { textAlign: 'center' }]}>
                                        <Text style={{ color: '#67e8f9' }}>{stats.secondLang}</Text>
                                        {stats?.thirdLang && <Text> & <Text style={{ color: '#f472b6' }}>{stats.thirdLang}</Text></Text>}
                                    </Text>
                                ) : (
                                    <Text style={styles.slideTitleLarge}>A master of one.</Text>
                                )}
                            </View>
                        )}
                        {slide === 5 && (
                            <View style={styles.slideLeft}>
                                <Text style={styles.slideTitleLarge}>The community noticed.</Text>
                                <Text style={[styles.slideStatHuge, { color: '#fef08a' }]}>{stats?.stars.toLocaleString()}</Text>
                                <Text style={styles.slideStatLabel}>Stars</Text>
                            </View>
                        )}
                        {slide === 6 && (
                            <View style={styles.slideRight}>
                                <Text style={styles.slideTitleLarge}>They even started borrowing your code.</Text>
                                <Text style={[styles.slideStatHuge, { color: '#c084fc' }]}>{stats?.forks.toLocaleString()}</Text>
                                <Text style={styles.slideStatLabel}>Forks</Text>
                            </View>
                        )}
                        {slide === 7 && (
                            <View style={styles.slideCentered}>
                                <Text style={styles.slideTitleLarge}>Finally...</Text>
                                <Text style={styles.slideStatHuge}>{stats?.followers.toLocaleString()}</Text>
                                <Text style={styles.slideStatLabel}>Devs got inspired and followed you.</Text>
                            </View>
                        )}
                        {slide === 8 && (
                            <View style={styles.slideCentered}>
                                <Text style={styles.slideTitleHuge}>What a journey.</Text>
                                <TouchableOpacity style={styles.goBtn} onPress={complete} activeOpacity={0.8}>
                                    <Text style={styles.goBtnText}>Let's Go 🚀</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </Animated.View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 99999,
    },
    progressRow: {
        position: 'absolute',
        top: 40,
        left: 20,
        right: 20,
        flexDirection: 'row',
        gap: 6,
        zIndex: 10,
    },
    progressBox: {
        flex: 1,
        height: 4,
        borderRadius: 2,
    },
    skipBtn: {
        position: 'absolute',
        top: 60,
        right: 20,
        zIndex: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 100,
    },
    skipText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 13,
    },
    touchZones: {
        ...StyleSheet.absoluteFillObject,
        flexDirection: 'row',
        zIndex: 5,
    },
    content: {
        flex: 1,
        padding: 30,
        justifyContent: 'center',
        zIndex: 2,
    },
    centered: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        marginTop: 24,
        textAlign: 'center',
    },
    userText: {
        fontSize: 28,
        fontWeight: '800',
        color: '#38bdf8',
        textAlign: 'center',
    },
    slideCentered: {
        alignItems: 'center',
        textAlign: 'center',
    },
    slideLeft: {
        alignItems: 'flex-start',
        width: '100%',
    },
    slideRight: {
        alignItems: 'flex-end',
        width: '100%',
    },
    slideSubtitle: {
        fontSize: 20,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 10,
    },
    slideTitleHuge: {
        fontSize: width * 0.25,
        fontWeight: '900',
        color: '#fff',
        lineHeight: width * 0.25,
    },
    slideTitleLarge: {
        fontSize: 40,
        fontWeight: '900',
        color: '#fff',
        lineHeight: 46,
        marginBottom: 40,
    },
    slideDesc: {
        fontSize: 18,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.9)',
        marginTop: 20,
        textAlign: 'center',
    },
    slideStatHuge: {
        fontSize: 80,
        fontWeight: '900',
        color: '#fff',
    },
    slideStatLabel: {
        fontSize: 20,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.8)',
    },
    goBtn: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 100,
        marginTop: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
        zIndex: 10,
    },
    goBtnText: {
        color: '#0f172a',
        fontSize: 20,
        fontWeight: '800',
    },
});
