import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ImageBackground, TouchableOpacity, 
  StatusBar, Platform, Alert, ActivityIndicator, ScrollView, Image, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// ⭐️ API import
import { fetchMatchCards, sendLike, SERVER_URL } from '../../services/api';
const MY_USER_ID = 1;

export default function MatchesScreen({ navigation }) {
  const [profiles, setProfiles] = useState([]);
  const [likedMeProfiles, setLikedMeProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // ⭐️ 모달 관련 상태
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  // 탭바 스타일
  const activeRouteName = 'Matches';
  const getTabColor = (routeName) => (routeName === activeRouteName ? '#000000' : '#9ca3af');
  const getTabWeight = (routeName) => (routeName === activeRouteName ? '700' : '500');

  useEffect(() => {
    fetchProfiles();
  }, []);

  // ⭐️ 매칭 카드 불러오기
  const fetchProfiles = async () => {
    try {
      const data = await fetchMatchCards(MY_USER_ID);
      const allProfiles = Array.isArray(data) ? data : [];
      
      const liked = allProfiles.filter(p => p.type === 'liked_me');
      const others = allProfiles.filter(p => p.type !== 'liked_me');
      
      setLikedMeProfiles(liked);
      setProfiles(others);
      setLoading(false);
    } catch (error) {
      console.error('❌ [MATCHES] 프로필 불러오기 에러:', error);
      setProfiles([]);
      setLikedMeProfiles([]);
      setLoading(false);
    }
  };

  // ⭐️ 좋아요 보내기
  const handleLike = async (targetUser = null) => {
    const user = targetUser || profiles[currentIndex];
    if (!user) return;
    
    try {
      const result = await sendLike(MY_USER_ID, user.id);

      if (result.isMatch) {
        const { roomId } = result; 
        if (modalVisible) {
          setModalVisible(false);
          setSelectedProfile(null);
        }
        
        Alert.alert(
          "매칭 성공! 🎉", 
          `${user.name}님과 매칭되었습니다!\n지금 바로 대화를 시작해보세요.`, 
          [
            { text: "계속하기", onPress: () => {
              if (targetUser) {
                setLikedMeProfiles(prev => prev.filter(p => p.id !== user.id));
              } else {
                nextCard();
              }
            }},
            { 
              text: "채팅방 가기", 
              onPress: () => {
                if (roomId) navigation.navigate('Chat', { matchData: user, roomId: roomId });
                else navigation.navigate('ChatList');
              }
            }
          ]
        );
      } else {
        if (modalVisible) {
          setModalVisible(false);
          setSelectedProfile(null);
        }
        
        Alert.alert("좋아요! 💕", `${user.name}님에게 좋아요를 보냈습니다.`);
        
        if (targetUser) {
          setLikedMeProfiles(prev => prev.filter(p => p.id !== user.id));
        } else {
          nextCard();
        }
      }
    } catch (error) {
      Alert.alert("오류", "좋아요를 보내는데 실패했습니다.");
    }
  };

  const handleLikedMePress = (user) => {
    setSelectedProfile(user);
    setModalVisible(true);
  };

  const handleModalPass = () => {
    setModalVisible(false);
    setSelectedProfile(null);
  };

  const nextCard = () => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      Alert.alert("알림", "더 이상 추천할 프로필이 없습니다.", [
        { text: "처음부터", onPress: () => {
          setCurrentIndex(0);
          fetchProfiles();
        }},
        { text: "확인" }
      ]);
    }
  };

  const currentProfile = profiles[currentIndex];

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#ec4899" />
          <Text style={styles.loadingText}>프로필을 불러오는 중...</Text>
        </View>
        <BottomTabBar navigation={navigation} getTabColor={getTabColor} getTabWeight={getTabWeight} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* ⭐️ Header: 다른 페이지와 디자인 통일됨 */}
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

          {/* 오른쪽 아이콘 영역 (매칭화면 편의 기능) */}
          <View style={styles.headerRight}>
              <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="search-outline" size={24} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="notifications-outline" size={24} color="#000" />
              </TouchableOpacity>
          </View>
      </View>

      {/* ⭐️ 상단: 나를 찜한 사람들 */}
      {likedMeProfiles.length > 0 && (
        <View style={styles.likedMeSection}>
          <View style={styles.likedMeHeader}>
            <Ionicons name="heart" size={20} color="#ec4899" />
            <Text style={styles.likedMeTitle}>나를 찜한 사람들</Text>
            <View style={styles.likedMeCount}>
              <Text style={styles.likedMeCountText}>{likedMeProfiles.length}</Text>
            </View>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.likedMeScroll}
          >
            {likedMeProfiles.map((user, index) => (
              <TouchableOpacity 
                key={`liked-${user.id}-${index}`}
                style={styles.likedMeItem}
                onPress={() => handleLikedMePress(user)}
                activeOpacity={0.8}
              >
                <View style={styles.likedMeImageWrapper}>
                  <Image 
                    source={{ uri: user.image || 'https://via.placeholder.com/100' }}
                    style={styles.likedMeImage}
                  />
                  <View style={styles.likedMeHeart}>
                    <Ionicons name="heart" size={12} color="#fff" />
                  </View>
                </View>
                <Text style={styles.likedMeName} numberOfLines={1}>{user.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 나를 찜한 사람이 없을 때 보이는 타이틀 (헤더 바로 아래) */}
      {likedMeProfiles.length === 0 && (
        <View style={styles.pageTitleSection}>
          <Text style={styles.pageTitle}>매칭</Text>
          <Text style={styles.pageSubtitle}>마음에 드는 사람에게 좋아요를 보내세요</Text>
        </View>
      )}

      {/* 메인 카드 영역 */}
      <View style={styles.cardContainer}>
        {!currentProfile ? (
          <View style={styles.emptyCard}>
            <Ionicons name="heart-dislike-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>추천할 프로필이 없습니다</Text>
            <Text style={styles.emptyText}>새로운 사용자들을 곧 만나보실 수 있습니다.</Text>
            <TouchableOpacity onPress={fetchProfiles} style={styles.retryButton}>
              <Text style={styles.retryText}>🔄 다시 불러오기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ImageBackground 
            source={{ uri: currentProfile.image || 'https://via.placeholder.com/400x600' }} 
            style={styles.bg} 
            resizeMode="cover"
            imageStyle={{ borderRadius: 20 }}
          >
            <LinearGradient 
              colors={['rgba(0,0,0,0.2)', 'transparent', 'rgba(0,0,0,0.8)']} 
              style={styles.gradient}
            >
              <View style={styles.cardHeader}>
                <View style={styles.indexBadge}>
                  <Text style={styles.indexText}>{currentIndex + 1} / {profiles.length}</Text>
                </View>
              </View>

              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{currentProfile.name}, {currentProfile.age}</Text>
                </View>
                <Text style={styles.job}>{currentProfile.style || currentProfile.location || '스타일 정보 없음'}</Text>
                
                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.passBtn} onPress={nextCard}>
                    <Ionicons name="close" size={30} color="#ff4b4b" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.likeBtn} onPress={() => handleLike()}>
                    <LinearGradient colors={['#ec4899', '#9333ea']} style={styles.gradBtn}>
                      <Ionicons name="heart" size={40} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        )}
      </View>

      {/* 프로필 상세보기 모달 */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
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
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalInfo}>
                  <View style={styles.modalBadge}>
                    <Ionicons name="heart" size={16} color="#fff" />
                    <Text style={styles.modalBadgeText}>이 분이 나를 찜했어요!</Text>
                  </View>
                  
                  <Text style={styles.modalName}>{selectedProfile.name}, {selectedProfile.age}</Text>
                  <Text style={styles.modalJob}>{selectedProfile.style || selectedProfile.location || '스타일 정보 없음'}</Text>
                  
                  <View style={styles.modalBtnRow}>
                    <TouchableOpacity style={styles.modalPassBtn} onPress={handleModalPass}>
                      <Ionicons name="close" size={32} color="#ff4b4b" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.modalLikeBtn} onPress={() => handleLike(selectedProfile)}>
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

      <BottomTabBar navigation={navigation} getTabColor={getTabColor} getTabWeight={getTabWeight} />
    </View>
  );
}

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
      <Ionicons name="people" size={24} color={getTabColor('Matches')} />
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
);

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#ffffff',
  },
  
  // ⭐️ 헤더 스타일: UserProfileScreen과 동일하게 설정
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

  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },

  // ⭐️ 타이틀 섹션 (헤더 아래)
  pageTitleSection: {
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },

  // ⭐️ 나를 찜한 사람들 섹션
  likedMeSection: {
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  likedMeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  likedMeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 8,
  },
  likedMeCount: {
    backgroundColor: '#ec4899',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  likedMeCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  likedMeScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  likedMeItem: {
    alignItems: 'center',
    marginRight: 12,
  },
  likedMeImageWrapper: {
    position: 'relative',
  },
  likedMeImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#ec4899',
  },
  likedMeHeart: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#ec4899',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  likedMeName: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 6,
    maxWidth: 70,
    textAlign: 'center',
  },

  // 카드 컨테이너
  cardContainer: {
    flex: 1,
    padding: 16,
  },
  emptyCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    padding: 12,
  },
  retryText: {
    color: '#ec4899',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // 카드 스타일
  bg: { 
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradient: { 
    flex: 1, 
    justifyContent: 'space-between',
    borderRadius: 20,
  },

  // 카드 헤더
  cardHeader: { 
    paddingTop: 16, 
    paddingHorizontal: 16, 
    flexDirection: 'row', 
    justifyContent: 'flex-end',
  },
  indexBadge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  indexText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // 정보 영역
  info: { 
    padding: 20,
  },
  nameRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  name: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: '#fff' 
  },
  job: { 
    fontSize: 16, 
    color: '#e5e7eb', 
    marginBottom: 16 
  },

  // 버튼 영역
  btnRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-evenly', 
    alignItems: 'center' 
  },
  passBtn: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    backgroundColor: '#fff', 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  likeBtn: { 
    width: 72, 
    height: 72, 
    borderRadius: 36, 
    overflow: 'hidden', 
    elevation: 10 
  },
  gradBtn: { 
    width: '100%', 
    height: '100%', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },

  // 모달 스타일
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
    marginBottom: 32,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  modalPassBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  modalLikeBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    elevation: 10,
  },
  modalGradBtn: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 하단 탭 바
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