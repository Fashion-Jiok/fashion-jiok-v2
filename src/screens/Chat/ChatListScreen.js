import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, Image, 
    TouchableOpacity, Dimensions, StatusBar, Platform, 
    ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';

import { 
    fetchChatList as apiFetchChatList,
    deleteChatRoom,
    SERVER_URL
} from '../../services/api';

const { width } = Dimensions.get('window');
const itemWidth = (width - 64) / 3; 

const MY_USER_ID = 1;

export default function ChatListScreen({ navigation }) {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    // ⭐️ 화면에 포커스될 때마다 데이터 새로고침
    useFocusEffect(
        React.useCallback(() => {
            loadChatData();
        }, [])
    );

    const loadChatData = async () => {
        setLoading(true);
        try {
            const data = await apiFetchChatList(MY_USER_ID);
            console.log('📝 [CHATLIST] 로드된 매칭/대화 수:', data.length);
            setMatches(data);

        } catch (error) {
            console.error('❌ [CHATLIST] 데이터 로드 실패:', error);
            Alert.alert("오류", "채팅 목록을 불러오는데 실패했습니다. 서버 상태를 확인해주세요.");
            setMatches([]);
        } finally {
            setLoading(false);
        }
    };

    const newMatches = matches.filter(m => m.isNew);
    const conversations = matches.filter(m => !m.isNew);

    const activeRouteName = 'ChatList';
    const getTabColor = (routeName) => (routeName === activeRouteName ? '#000000' : '#9ca3af');
    const getTabWeight = (routeName) => (routeName === activeRouteName ? '700' : '500');

    const navigateToChat = (match) => {
        const otherUserId = (match.user_id_1 && match.user_id_1 !== MY_USER_ID)
            ? match.user_id_1
            : match.user_id_2;

        navigation.navigate('Chat', { 
            matchData: match,
            roomId: match.room_id,
            otherUserId: otherUserId
        });
    };

    // ⭐️ 대화방 나가기 처리
    const handleDeleteChat = async (roomId) => {
        Alert.alert(
            '대화방 나가기',
            '이 대화방을 나가면 목록에서 삭제됩니다. 계속할까요?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '나가기',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteChatRoom(roomId);
                            setMatches(prev => prev.filter(m => m.room_id !== roomId));
                            Alert.alert('완료', '대화방을 나갔습니다.');
                        } catch (error) {
                            console.error('❌ [CHATLIST] 대화방 삭제 실패:', error);
                            Alert.alert('오류', '대화방 삭제 중 문제가 발생했습니다.');
                        }
                    }
                }
            ]
        );
    };

    // ⭐ Swipe 시 오른쪽 액션 버튼
    const renderRightActions = (match) => (
        <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteChat(match.room_id)}
            activeOpacity={0.8}
        >
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.deleteText}>나가기</Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#ec4899" />
                    <Text style={styles.loadingText}>매칭 정보를 불러오는 중...</Text>
                </View>
                <BottomTabBar navigation={navigation} getTabColor={getTabColor} getTabWeight={getTabWeight} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.headerLeft} 
                    onPress={() => navigation.navigate('MainHome')}
                    activeOpacity={0.7}
                >
                    <Ionicons name="chevron-back" size={24} color="#000" style={{ marginRight: 4 }} />
                    <Image
                        source={{ uri: 'https://i.pinimg.com/736x/12/b4/d5/12b4d59018dd604fc3b5e287595e4a8c.jpg' }}
                        style={styles.logoImage}
                        resizeMode="cover"
                    />
                    <Text style={styles.logoTitle}>Fashion Jiok</Text>
                </TouchableOpacity>
                
                <View style={styles.matchCountPill}>
                    <Ionicons name="heart" size={14} color="#ec4899" />
                    <Text style={styles.matchCountText}>{matches.length}명</Text>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* --- 새 매칭 --- */}
                {newMatches.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="sparkles" size={18} color="#a855f7" />
                            <Text style={styles.sectionTitle}>새로운 매칭</Text>
                            <View style={styles.newBadge}>
                                <Text style={styles.newBadgeText}>{newMatches.length}</Text>
                            </View>
                        </View>

                        <View style={styles.gridContainer}>
                            {newMatches.map((match) => (
                                <TouchableOpacity
                                    key={match.id}
                                    style={styles.gridItem(itemWidth)}
                                    activeOpacity={0.8}
                                    onPress={() => navigateToChat(match)}
                                >
                                    <View style={styles.imageWrapper}>
                                        <Image source={{ uri: match.image }} style={styles.gridImage} />

                                        <LinearGradient
                                            colors={['transparent', 'rgba(0,0,0,0.6)']}
                                            style={StyleSheet.absoluteFill}
                                        />

                                        <LinearGradient
                                            colors={['#ec4899', '#9333ea']}
                                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                            style={styles.newLabel}
                                        >
                                            <Text style={styles.newLabelText}>NEW</Text>
                                        </LinearGradient>

                                        <View style={styles.gridInfo}>
                                            <Text style={styles.gridName} numberOfLines={1}>
                                                {match.name}, {match.age}
                                            </Text>
                                            <Text style={styles.gridTime}>
                                                {match.timeAgo || '새 매칭'}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* --- 대화 목록 --- */}
                {conversations.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { marginLeft: 0, marginBottom: 16 }]}>
                            대화 목록
                        </Text>

                        <View style={styles.listContainer}>
                            {conversations.map((match) => (
                                <Swipeable
                                    key={match.id}
                                    renderRightActions={() => renderRightActions(match)}
                                    overshootRight={false}
                                >
                                    <TouchableOpacity
                                        style={styles.listItem}
                                        onPress={() => navigateToChat(match)}
                                    >
                                        <View style={styles.avatarContainer}>
                                            <Image source={{ uri: match.image }} style={styles.avatar} />
                                            <LinearGradient
                                                colors={['#ec4899', '#9333ea']}
                                                style={styles.messageIconBadge}
                                            >
                                                <Ionicons name="chatbubble" size={10} color="#fff" />
                                            </LinearGradient>
                                        </View>

                                        <View style={styles.listContent}>
                                            <View style={styles.listHeader}>
                                                <Text style={styles.listName}>
                                                    {match.name}, {match.age}
                                                </Text>
                                            </View>

                                            {match.lastMessage && (
                                                <Text style={styles.lastMessage} numberOfLines={1}>
                                                    {match.lastMessage}
                                                </Text>
                                            )}
                                        </View>

                                        <Text style={styles.listTime}>{match.timeAgo}</Text>
                                    </TouchableOpacity>
                                </Swipeable>
                            ))}
                        </View>
                    </View>
                )}

                {/* --- 빈 화면 --- */}
                {matches.length === 0 && !loading && (
                    <View style={styles.emptyState}>
                        <Ionicons name="heart-dislike-outline" size={48} color="#d1d5db" />
                        <Text style={styles.emptyTitle}>아직 매칭이 없습니다</Text>
                        <Text style={styles.emptySubtitle}>
                            프로필을 탐색하고 마음에 드는 사람을 찾아보세요
                        </Text>

                        <TouchableOpacity
                            style={styles.exploreButton}
                            onPress={() => navigation.navigate('Explore')}
                        >
                            <LinearGradient
                                colors={['#ec4899', '#9333ea']}
                                style={styles.exploreGradient}
                            >
                                <Text style={styles.exploreButtonText}>탐색하기</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* ⭐️ Bottom Tab Bar (수정됨: Map 탭 추가) */}
            <BottomTabBar 
                navigation={navigation}
                getTabColor={getTabColor}
                getTabWeight={getTabWeight}
            />
        </View>
    );
}

// ⭐️ 하단 탭바 컴포넌트 (다른 페이지와 동일하게 수정됨)
const BottomTabBar = ({ navigation, getTabColor, getTabWeight }) => (
  <View style={styles.bottomBar}>
    <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('MainHome')}>
      <Ionicons name="home-outline" size={24} color={getTabColor('MainHome')} />
      <Text style={[styles.tabText, { color: getTabColor('MainHome'), fontWeight: getTabWeight('MainHome') }]}>홈</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Explore')}>
      <Ionicons name="compass-outline" size={24} color={getTabColor('Explore')} />
      <Text style={[styles.tabText, { color: getTabColor('Explore'), fontWeight: getTabWeight('Explore') }]}>탐색</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Map')}>
      <Ionicons name="map-outline" size={24} color={getTabColor('Map')} />
      <Text style={[styles.tabText, { color: getTabColor('Map'), fontWeight: getTabWeight('Map') }]}>위치</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Matches')}>
      <Ionicons name="people-outline" size={24} color={getTabColor('Matches')} />
      <Text style={[styles.tabText, { color: getTabColor('Matches'), fontWeight: getTabWeight('Matches') }]}>매칭</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ChatList')}>
      <Ionicons name="chatbubbles" size={24} color={getTabColor('ChatList')} />
      <Text style={[styles.tabText, { color: getTabColor('ChatList'), fontWeight: getTabWeight('ChatList') }]}>채팅</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('MyProfile')}>
      <Ionicons name="person-outline" size={24} color={getTabColor('MyProfile')} />
      <Text style={[styles.tabText, { color: getTabColor('MyProfile'), fontWeight: getTabWeight('MyProfile') }]}>나</Text>
    </TouchableOpacity>
  </View>
);

/* ---------- 스타일 ---------- */
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
    loadingText: { marginTop: 10, fontSize: 16, color: '#666' },

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
       zIndex: 10,
    },
    headerLeft: { 
       flexDirection: 'row', 
       alignItems: 'center', 
       gap: 8 
    },
    logoImage: { 
        width: 45, 
        height: 30, 
        borderRadius: 8 
    },
    logoTitle: { 
        fontSize: 20, 
        fontWeight: '600', 
        color: '#000000',
        letterSpacing: -0.5,
    },

    matchCountPill: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fee2e2', borderRadius: 20,
        paddingHorizontal: 10, paddingVertical: 5,
    },

    matchCountText: { fontSize: 14, fontWeight: '600', color: '#ef4444', marginLeft: 4 },

    content: { flex: 1, backgroundColor: '#f9fafb' },

    section: { paddingHorizontal: 16, paddingVertical: 16 },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },

    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginLeft: 8 },

    newBadge: {
        backgroundColor: '#f9a8d4', borderRadius: 10,
        paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8,
    },
    newBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },

    gridItem: (width) => ({
        width, height: width * 1.3, marginBottom: 8,
        borderRadius: 12, overflow: 'hidden', elevation: 3, backgroundColor: '#fff',
    }),

    imageWrapper: { flex: 1, position: 'relative' },
    gridImage: { ...StyleSheet.absoluteFillObject, resizeMode: 'cover' },

    newLabel: {
        position: 'absolute', top: 8, left: 8,
        borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, zIndex: 10,
    },
    newLabelText: { color: '#fff', fontSize: 10, fontWeight: '900' },

    gridInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8, zIndex: 5 },

    gridName: { color: '#fff', fontSize: 14, fontWeight: '700' },
    gridTime: { color: '#e5e7eb', fontSize: 10, marginTop: 2 },

    listContainer: {
        backgroundColor: '#ffffff', borderRadius: 12, overflow: 'hidden',
        borderWidth: 1, borderColor: '#e5e7eb',
    },

    listItem: {
        flexDirection: 'row', alignItems: 'center',
        padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
    },

    avatarContainer: { position: 'relative' },
    avatar: { width: 56, height: 56, borderRadius: 28, resizeMode: 'cover' },

    messageIconBadge: {
        position: 'absolute', bottom: 0, right: 0,
        width: 18, height: 18, borderRadius: 9, alignItems: 'center',
        justifyContent: 'center', borderWidth: 2, borderColor: '#fff',
    },

    listContent: { flex: 1, marginLeft: 12 },

    listHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },

    listName: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginRight: 8 },

    lastMessage: { fontSize: 13, color: '#6b7280' },
    listTime: { fontSize: 12, color: '#9ca3af' },

    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 50, padding: 20 },

    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 16 },
    emptySubtitle: { fontSize: 14, color: '#999', marginTop: 8, textAlign: 'center' },

    exploreButton: { marginTop: 24, borderRadius: 25, overflow: 'hidden', elevation: 5 },

    exploreGradient: { paddingVertical: 12, paddingHorizontal: 30, alignItems: 'center', justifyContent: 'center' },

    exploreButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    // ⭐ Swipe "나가기" 버튼
    deleteButton: {
        width: 80, backgroundColor: '#ef4444',
        justifyContent: 'center', alignItems: 'center',
    },
    deleteText: {
        color: '#fff', fontWeight: '700',
        marginTop: 4, fontSize: 12,
    },

    // ⭐️ Bottom Bar Style
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
        shadowRadius: 10,
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
});