import React, { useState, useEffect } from 'react';
import { 
    View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, 
    StatusBar, ScrollView, Platform, ActivityIndicator, Alert, Modal, ImageBackground
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// API 서비스 (경로가 맞는지 확인해주세요)
import { fetchExploreUsers, sendLike } from '../../services/api'; 

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const MY_USER_ID = 1;

export default function ExploreScreen({ navigation }) {
    const [profiles, setProfiles] = useState([]);
    const [likedProfiles, setLikedProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // ⭐️ 모달 관련 상태
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState(null); 

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await fetchExploreUsers(MY_USER_ID);
            setProfiles(data || []); 
            
            const alreadyLiked = data.filter(u => u.isLiked).map(u => u.id);
            setLikedProfiles(alreadyLiked);
        } catch (error) {
            console.error("Error loading users:", error);
            setProfiles([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers(); 
    }, []);
    
    const toggleLike = async (targetUserId) => {
        const isCurrentlyLiked = likedProfiles.includes(targetUserId);
        
        // ⭐️ 좋아요 취소 기능
        if (isCurrentlyLiked) {
            Alert.alert(
                "좋아요 취소",
                "좋아요를 취소하시겠습니까?",
                [
                    { text: "아니오", style: "cancel" },
                    { 
                        text: "취소", 
                        style: "destructive",
                        onPress: () => {
                            setLikedProfiles(likedProfiles.filter(id => id !== targetUserId));
                        }
                    }
                ]
            );
            return;
        }
        
        setLikedProfiles([...likedProfiles, targetUserId]);
        
        try {
            const result = await sendLike(MY_USER_ID, targetUserId);
            
            if (result.isMatch) {
                const targetProfile = profiles.find(p => p.id === targetUserId);
                Alert.alert(
                    "매칭 성공! 🎉",
                    `${targetProfile?.name}님과 매칭되었습니다!`,
                    [
                        { text: "계속 탐색", style: "cancel" },
                        { 
                            text: "채팅하기", 
                            onPress: () => navigation.navigate('ChatList')
                        }
                    ]
                );
            }
        } catch (error) {
            setLikedProfiles(likedProfiles.filter(id => id !== targetUserId));
            Alert.alert("오류", "좋아요 전송에 실패했습니다.");
        }
    };

    const handleRefresh = () => {
        loadUsers(); 
    };
    
    const handleLikedMeCardPress = (profile) => {
        setSelectedProfile(profile);
        setModalVisible(true);
    };
    
    const handleModalLike = async () => {
        if (!selectedProfile) return;
        try {
            const result = await sendLike(MY_USER_ID, selectedProfile.id);
            setModalVisible(false);
            if (result.isMatch) {
                Alert.alert("매칭 성공! 🎉", `${selectedProfile.name}님과 매칭되었습니다!`, [
                    { text: "계속 탐색", style: "cancel" },
                    { text: "채팅하기", onPress: () => navigation.navigate('ChatList') }
                ]);
            } else {
                Alert.alert("좋아요! 💕", `${selectedProfile.name}님에게 좋아요를 보냈습니다.`);
            }
            setLikedProfiles([...likedProfiles, selectedProfile.id]);
            setSelectedProfile(null);
        } catch (error) {
            Alert.alert("오류", "좋아요를 보내는데 실패했습니다.");
        }
    };
    
    const handleModalClose = () => {
        setModalVisible(false);
        setSelectedProfile(null);
    };

    // 하단 탭바 활성 상태 헬퍼
    const activeRouteName = 'Explore';
    const getTabColor = (routeName) => (routeName === activeRouteName ? '#000000' : '#9ca3af');
    const getTabWeight = (routeName) => (routeName === activeRouteName ? '700' : '500');

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* ⭐️ 변경된 헤더 디자인 (Fashion Jiok) */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.headerLeft} 
                    onPress={() => navigation.navigate('MainHome')}
                    activeOpacity={0.7}
                >
                    {/* 뒤로가기 아이콘 추가 */}
                    <Ionicons name="chevron-back" size={24} color="#000" style={{ marginRight: 4 }} />
                    <Image
                        source={{ uri: 'https://i.pinimg.com/736x/12/b4/d5/12b4d59018dd604fc3b5e287595e4a8c.jpg' }}
                        style={styles.logoImage}
                        resizeMode="cover"
                    />
                    <Text style={styles.logoTitle}>Fashion Jiok</Text>
                </TouchableOpacity>

                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.iconButton}>
                         <Ionicons name="search-outline" size={24} color="#000" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="notifications-outline" size={24} color="#000" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView 
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* 기존 제목 섹션 (필요시 유지, 아니면 삭제 가능) */}
                <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                    <Text style={{ fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 }}>
                        스타일 탐색
                    </Text>
                    <Text style={{ fontSize: 14, color: '#6b7280' }}>
                        취향이 맞는 패션 피플을 찾아보세요
                    </Text>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#000000" />
                        <Text style={styles.loadingText}>새로운 프로필을 불러오는 중...</Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.gridContainer}>
                            {profiles.map((profile, index) => {
                                const isLiked = likedProfiles.includes(profile.id);
                                const likedMe = profile.type === 'liked_me';
                                
                                return (
                                    <TouchableOpacity 
                                        key={`profile-${profile.id}-${index}`} 
                                        style={styles.card}
                                        activeOpacity={likedMe ? 0.7 : 1}
                                        onPress={() => likedMe ? handleLikedMeCardPress(profile) : null}
                                    >
                                        <View style={styles.imageContainer}>
                                            <Image 
                                                source={{ uri: profile.image || 'https://via.placeholder.com/300' }} 
                                                style={styles.cardImage} 
                                            />
                                            
                                            {likedMe && (
                                                <View style={styles.likedMeBadge}>
                                                    <Ionicons name="heart" size={12} color="#fff" />
                                                    <Text style={styles.likedMeText}>나를 좋아요!</Text>
                                                </View>
                                            )}
                                            
                                            <View style={styles.matchBadge}>
                                                <Text style={styles.matchText}>{profile.styleScore || 75}%</Text>
                                            </View>

                                            {!likedMe && (
                                                <TouchableOpacity 
                                                    style={styles.likeButton}
                                                    onPress={() => toggleLike(profile.id)}
                                                    activeOpacity={0.9}
                                                >
                                                    <Ionicons 
                                                        name={isLiked ? "heart" : "heart-outline"} 
                                                        size={20}
                                                        color={isLiked ? "#ec4899" : "#ffffff"} 
                                                    />
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        <View style={styles.cardInfo}>
                                            <View style={styles.nameRow}>
                                                <Text style={styles.nameText}>{profile.name}, {profile.age}</Text>
                                            </View>
                                            <View style={styles.locationRow}>
                                                <Ionicons name="location-sharp" size={12} color="#9ca3af" />
                                                <Text style={styles.locationText}>{profile.location || '서울'}</Text>
                                            </View>
                                            
                                            {likedMe && (
                                                <View style={styles.likedMeLabel}>
                                                    <Ionicons name="heart" size={12} color="#ec4899" />
                                                    <Text style={styles.likedMeLabelText}>나를 좋아요했어요!</Text>
                                                </View>
                                            )}
                                            
                                            <View style={styles.tagsRow}>
                                                {(profile.tags || [profile.style || '패션']).map((tag, idx) => (
                                                    <View key={`tag-${index}-${idx}`} style={styles.tag}>
                                                        <Text style={styles.tagText}>#{tag}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        
                        {profiles.length === 0 && (
                             <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>현재 탐색할 프로필이 없습니다. 😭</Text>
                             </View>
                        )}

                        <TouchableOpacity 
                            style={styles.refreshButton}
                            onPress={handleRefresh}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#1a1a1a', '#4b5563']}
                                style={styles.refreshGradient}
                            >
                                <Ionicons name="refresh" size={18} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.refreshText}>새로운 친구 찾기</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>

            {/* 프로필 상세보기 모달 */}
            <Modal
                animationType="slide"
                transparent={false}
                visible={modalVisible}
                onRequestClose={handleModalClose}
            >
                {selectedProfile && (
                    <View style={styles.modalContainer}>
                        <ImageBackground 
                            source={{ uri: selectedProfile.image || 'https://via.placeholder.com/400x600' }} 
                            style={styles.modalBg} 
                            resizeMode="cover"
                        >
                            <LinearGradient 
                                colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.85)']} 
                                style={styles.modalGradient}
                            >
                                <View style={styles.modalHeader}>
                                    <TouchableOpacity 
                                        style={styles.closeButton}
                                        onPress={handleModalClose}
                                    >
                                        <Ionicons name="close" size={28} color="#fff" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.modalInfo}>
                                    <View style={styles.modalBadge}>
                                        <Ionicons name="heart" size={16} color="#fff" />
                                        <Text style={styles.modalBadgeText}>이 분이 나를 좋아요했어요!</Text>
                                    </View>
                                    
                                    <Text style={styles.modalName}>{selectedProfile.name}, {selectedProfile.age}</Text>
                                    <Text style={styles.modalJob}>{selectedProfile.style || selectedProfile.location || '스타일 정보 없음'}</Text>
                                    
                                    <View style={styles.modalBtnRow}>
                                        <TouchableOpacity style={styles.modalPassBtn} onPress={handleModalClose}>
                                            <Ionicons name="close" size={32} color="#ff4b4b" />
                                        </TouchableOpacity>
                                        
                                        <TouchableOpacity style={styles.modalLikeBtn} onPress={handleModalLike}>
                                            <LinearGradient colors={['#ec4899', '#9333ea']} style={styles.modalGradBtn}>
                                                <Ionicons name="heart" size={44} color="#fff" />
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </LinearGradient>
                        </ImageBackground>
                    </View>
                )}
            </Modal>

            {/* Bottom Tab Bar */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('MainHome')}>
                    <Ionicons name="home" size={24} color={getTabColor('MainHome')} />
                    <Text style={[styles.tabText, { color: getTabColor('MainHome'), fontWeight: getTabWeight('MainHome') }]}>홈</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Explore')}>
                    <Ionicons name="compass" size={24} color={getTabColor('Explore')} />
                    <Text style={[styles.tabText, { color: getTabColor('Explore'), fontWeight: getTabWeight('Explore') }]}>탐색</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Map')}>
                    <Ionicons name="heart-outline" size={24} color={getTabColor('Map')} />
                    <Text style={[styles.tabText, { color: getTabColor('Map'), fontWeight: getTabWeight('Map') }]}>종알림</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Matches')}>
                    <Ionicons name="people-outline" size={24} color={getTabColor('Matches')} />
                    <Text style={[styles.tabText, { color: getTabColor('Matches'), fontWeight: getTabWeight('Matches') }]}>매칭</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ChatList')}>
                    <Ionicons name="chatbubbles-outline" size={24} color={getTabColor('ChatList')} />
                    <Text style={[styles.tabText, { color: getTabColor('ChatList'), fontWeight: getTabWeight('ChatList') }]}>채팅</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('MyProfile')}>
                    <Ionicons name="person-outline" size={24} color={getTabColor('MyProfile')} />
                    <Text style={[styles.tabText, { color: getTabColor('MyProfile'), fontWeight: getTabWeight('MyProfile') }]}>나</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    // ⭐️ 헤더 스타일 (제공해주신 스타일 적용)
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    headerLeft: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 8 
    },
    logoImage: { 
        width: 45, // 로고 크기 살짝 조정 (너무 크면 헤더가 뚱뚱해짐)
        height: 30, 
        borderRadius: 8 
    },
    logoTitle: { 
        fontSize: 20, 
        fontWeight: '600', 
        color: '#000000',
        letterSpacing: -0.5,
    },
    headerRight: { 
        flexDirection: 'row', 
        gap: 8 
    },
    iconButton: { 
        width: 40, 
        height: 40, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },

    // Loading & Content
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#6b7280',
    },
    content: {
        flex: 1,
        paddingTop: 20,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        justifyContent: 'space-between',
    },
    card: {
        width: CARD_WIDTH,
        marginBottom: 20,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 3/4,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    likedMeBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: '#ec4899',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        elevation: 5,
    },
    likedMeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    matchBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    matchText: {
        color: '#a855f7',
        fontSize: 11,
        fontWeight: '700',
    },
    likeButton: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    cardInfo: {
        padding: 12,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    nameText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 2,
    },
    locationText: {
        fontSize: 12,
        color: '#9ca3af',
    },
    likedMeLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fce7f3',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 8,
        gap: 4,
    },
    likedMeLabelText: {
        fontSize: 11,
        color: '#ec4899',
        fontWeight: '700',
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
    },
    tag: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    tagText: {
        fontSize: 10,
        color: '#6b7280',
        fontWeight: '500',
    },
    refreshButton: {
        marginHorizontal: 20,
        marginTop: 10,
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
    },
    refreshGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    refreshText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    
    // Bottom Bar
    bottomBar: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 12,
        paddingBottom: 32,
        paddingHorizontal: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        elevation: 10,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    tabText: {
        fontSize: 11,
        marginTop: 4,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#9ca3af',
    },
    
    // Modal
    modalContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    modalBg: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    modalGradient: {
        flex: 1,
        justifyContent: 'space-between',
    },
    modalHeader: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
        alignItems: 'flex-end',
    },
    closeButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalInfo: {
        padding: 24,
        paddingBottom: 40,
    },
    modalBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ec4899',
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 16,
    },
    modalBadgeText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 6,
    },
    modalName: {
        fontSize: 32,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
    },
    modalJob: {
        fontSize: 18,
        color: '#e5e7eb',
        marginBottom: 16,
    },
    modalBtnRow: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        marginTop: 20,
    },
    modalPassBtn: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalLikeBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        overflow: 'hidden',
    },
    modalGradBtn: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
});