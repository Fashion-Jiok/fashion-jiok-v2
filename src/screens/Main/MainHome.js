import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  Image,
  StatusBar,
  Alert,              // ★ 추가됨
  ActivityIndicator   // ★ 추가됨 (로딩바)
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker'; // ★ 추가됨 (갤러리 기능)

// ★ 서버 주소 (핫스팟 IP: 172.20.10.2 확인!)
const SERVER_URL = "http://172.30.1.61:8000/predict";

export default function MainHome({ navigation }) {
  const activeRouteName = 'MainHome'; 
  const [analyzing, setAnalyzing] = useState(false); // ★ 분석 중 로딩 상태

  // ============================================================
  // ★ 1. 성별 선택 팝업 -> 갤러리 열기
  // ============================================================
  const pickImage = async () => {
    Alert.alert(
      "AI 스타일 분류기",
      "분석할 모델의 성별을 선택해주세요.",
      [
        { text: "남성 패션", onPress: () => openGallery('male') },
        { text: "여성 패션", onPress: () => openGallery('female') },
        { text: "취소", style: "cancel" }
      ]
    );
  };

  const openGallery = async (selectedGender) => {
    // 권한 요청
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
      return;
    }

    // 갤러리 열기
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // 자르기 허용
      aspect: [3, 4],     
      quality: 1,
    });

    if (!result.canceled) {
      // 사진 선택 완료 -> 서버로 전송
      analyzeStyle(result.assets[0].uri, selectedGender);
    }
  };

  // ============================================================
  // ★ 2. 서버로 사진 전송 및 결과 받기
  // ============================================================
  const analyzeStyle = async (photoUri, userGender) => {
    setAnalyzing(true); // 로딩 시작

    const formData = new FormData();
    formData.append('file', {
      uri: photoUri,
      type: 'image/jpeg',
      name: 'upload.jpg',
    });
    formData.append('gender', userGender);

    try {
      // 서버 요청
      const response = await fetch(SERVER_URL, {
        method: 'POST',
        body: formData,
        headers: {},
      });

      const json = await response.json();
      
      if (json.result) {
        Alert.alert("분석 완료!", `당신의 스타일은\n[ ${json.result} ] 입니다.`);
      } else {
        Alert.alert("오류", "분석 결과를 가져오지 못했습니다.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("연결 실패", "서버가 켜져있는지 확인해주세요.\n(IP: 172.20.10.2)");
    } finally {
      setAnalyzing(false); // 로딩 끝
    }
  };

  // 탭바 스타일 함수
  const getTabColor = (routeName) => (routeName === activeRouteName ? '#000000' : '#9ca3af');
  const getTabWeight = (routeName) => (routeName === activeRouteName ? '700' : '500');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* ★ 로딩 화면 (분석 중일 때만 보임) */}
      {analyzing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={{color: 'white', marginTop: 10, fontWeight:'bold'}}>AI가 스타일을 분석 중입니다...</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={{ uri: 'https://i.pinimg.com/736x/12/b4/d5/12b4d59018dd604fc3b5e287595e4a8c.jpg' }}
            style={styles.logoImage}
            resizeMode="cover"
          />
          <Text style={styles.logoTitle}>Fashion Jiok</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Explore')}>
            <Ionicons name="chatbubble-outline" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scroll} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          {/* Greeting */}
          <View style={styles.greetingSection}>
            <Text style={styles.greetingText}>안녕하세요,</Text>
            <Text style={styles.greetingName}>수민님 👋</Text>
            <View style={styles.divider} />
          </View>

          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>
              오늘의 추천 매칭
            </Text>
            <Text style={styles.heroSubtitle}>
              12명의 새로운 프로필이 당신을 기다리고 있습니다
            </Text>

            <TouchableOpacity
              style={styles.heroButton}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Matches')}
            >
              <LinearGradient
                colors={['#000000', '#333333']}
                style={styles.heroButtonGradient}
              >
                <Text style={styles.heroButtonText}>스타일 둘러보기</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Main Cards */}
          <View style={styles.cardsSection}>
            <Text style={styles.sectionTitle}>빠른 메뉴</Text>
            
            <View style={styles.cards}>
              
              {/* ★ [수정됨] AI 스타일 분류기 버튼 */}
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={pickImage} // ★ 여기를 pickImage 함수로 연결했습니다!
              >
                <View style={styles.cardContent}>
                  <View style={[styles.cardIcon, { backgroundColor: '#eef2ff' }]}>
                    <Text style={styles.cardEmoji}>🤖</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>AI 스타일 분류기</Text>
                    <Text style={styles.cardSubtitle}>내 패션 스타일 찾기</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#d1d5db" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('MyProfile')}
              >
                <View style={styles.cardContent}>
                  <View style={[styles.cardIcon, { backgroundColor: '#fdf2f8' }]}>
                    <Text style={styles.cardEmoji}>👤</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>내 프로필 수정</Text>
                    <Text style={styles.cardSubtitle}>완성도: 80%</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#d1d5db" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => {}}
              >
                <View style={styles.cardContent}>
                  <View style={[styles.cardIcon, { backgroundColor: '#f0fdf4' }]}>
                    <Text style={styles.cardEmoji}>⚙️</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>매칭 설정</Text>
                    <Text style={styles.cardSubtitle}>선호도 조정하기</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#d1d5db" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Section */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>최근 활동</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={styles.statContent}>
                  <Text style={styles.statIcon}>💬</Text>
                  <Text style={styles.statNumber}>3</Text>
                  <Text style={styles.statLabel}>새 메시지</Text>
                </View>
              </View>
              <View style={styles.statCard}>
                <View style={styles.statContent}>
                  <Text style={styles.statIcon}>❤️</Text>
                  <Text style={styles.statNumber}>5</Text>
                  <Text style={styles.statLabel}>새 좋아요</Text>
                </View>
              </View>
              <View style={styles.statCard}>
                <View style={styles.statContent}>
                  <Text style={styles.statIcon}>👥</Text>
                  <Text style={styles.statNumber}>12</Text>
                  <Text style={styles.statLabel}>새 매칭</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Custom Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('MainHome')}>
          <Ionicons name="home" size={24} color={getTabColor('MainHome')} />
          <Text style={[styles.tabText, { color: getTabColor('MainHome'), fontWeight: getTabWeight('MainHome') }]}>홈</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Explore')}>
          <Ionicons name="compass-outline" size={24} color={getTabColor('Explore')} />
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
  container: { flex: 1, backgroundColor: '#ffffff' },
  // ★ 로딩 오버레이 스타일 추가
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoImage: { width: 60, height: 40, borderRadius: 12 },
  logoTitle: { fontSize: 20, fontWeight: '600', color: '#000000' },
  headerRight: { flexDirection: 'row', gap: 12 },
  iconButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: { flexGrow: 1 },
  content: { padding: 24 },
  greetingSection: { marginBottom: 40 },
  greetingText: { fontSize: 16, color: '#4b5563', fontWeight: '400', marginBottom: 4 },
  greetingName: { fontSize: 32, fontWeight: '700', color: '#000000', marginBottom: 16 },
  divider: { height: 2, backgroundColor: '#f3f4f6', width: 60 },
  heroSection: { marginBottom: 48 },
  heroTitle: { fontSize: 26, fontWeight: '300', color: '#000000', marginBottom: 12 },
  heroSubtitle: { fontSize: 15, color: '#6b7280', marginBottom: 24, lineHeight: 22, maxWidth: 300 },
  heroButton: { borderRadius: 12, overflow: 'hidden', alignSelf: 'flex-start', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  heroButtonGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, gap: 8 },
  heroButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  cardsSection: { marginBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#000000', marginBottom: 20 },
  cards: { gap: 12 },
  card: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f3f4f6', borderRadius: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardContent: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  cardIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardEmoji: { fontSize: 24 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#000000', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: '#6b7280' },
  statsSection: { marginBottom: 24 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f3f4f6', borderRadius: 16, padding: 20, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statContent: { alignItems: 'center' },
  statIcon: { fontSize: 28, marginBottom: 12 },
  statNumber: { fontSize: 24, fontWeight: '700', color: '#000000', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6b7280' },
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
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  tabText: { fontSize: 11, color: '#9ca3af', marginTop: 4, fontWeight: '500' },
  tabTextActive: { color: '#000000', fontWeight: '700' },
});