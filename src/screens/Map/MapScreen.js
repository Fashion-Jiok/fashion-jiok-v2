import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Dimensions, 
  TouchableOpacity, 
  StatusBar,
  Platform,
  Modal,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

import { fetchUserLocations, sendLike, SERVER_URL } from '../../services/api';

const KAKAO_JS_KEY = '0fc98fd0c85dcfcc3f9d6027226db403';

const COORD_BUNDANG = { lat: 37.388836, lon: 127.121544, name: '성남 분당구' };
const COORD_SEONGBUK = { lat: 37.589882, lon: 127.016918, name: '서울 성북구' };

export default function MapScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(COORD_BUNDANG);

  const [selectedUser, setSelectedUser] = useState(null);
  const webViewRef = useRef(null);

  const fetchUsers = async () => {
    setLoading(true);
    const currentUserId = 1;

    try {
      const data = await fetchUserLocations(
        currentUserId,
        currentLocation.lat,
        currentLocation.lon
      );

      console.log('[MAP] 응답 데이터:', data.length, '명');
      setUsers(data);
    } catch (error) {
      console.error('[MAP] 지도 사용자 로딩 에러:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (targetId) => {
    const myId = 1;
    try {
      const result = await sendLike(myId, targetId);

      if (result.isMatch) {
        Alert.alert('🎉 매칭 성공!', '채팅을 시작해보세요!');
      } else {
        Alert.alert('💕 좋아요', '좋아요를 보냈어요!');
      }

      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('좋아요 실패:', error);
      Alert.alert('오류', '좋아요 전송에 실패했습니다.');
      setSelectedUser(null);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentLocation]);

  const generateMapHTML = () => {
    const markersJS = users
      .map((user, index) => {
        const userImage = user.image_url || 'https://via.placeholder.com/100';
        const userJob = user.job || user.primary_style || '미상';
        const userBio = user.bio || '소개가 없습니다.';

        return `
          var markerPosition${index} = new kakao.maps.LatLng(${user.latitude}, ${user.longitude});
          var marker${index} = new kakao.maps.Marker({
            position: markerPosition${index},
            map: map
          });

          var content${index} = '<div style="padding:8px 12px;background:#fff;border-radius:20px;border:2px solid #ec4899;font-size:12px;font-weight:bold;color:#333;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.15);">' +
            '${(user.name || "유저" + user.user_id).replace(/'/g, "\\'")}' +
            '</div>';

          var overlay${index} = new kakao.maps.CustomOverlay({
            content: content${index},
            position: markerPosition${index},
            yAnchor: 2.5
          });
          overlay${index}.setMap(map);

          kakao.maps.event.addListener(marker${index}, 'click', function () {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'markerClick',
              user: {
                id: ${user.user_id},
                name: '${(user.name || "유저" + user.user_id).replace(/'/g, "\\'")}',
                age: ${user.age || 0},
                image: '${userImage.replace(/'/g, "\\'")}',
                style: '${(user.primary_style || user.location_name || "스타일 정보 없음").replace(/'/g, "\\'")}',
                job: '${userJob.replace(/'/g, "\\'")}',
                bio: '${userBio.replace(/'/g, "\\'")}',
                gender: '${user.gender}'
              }
            }));
          });
        `;
      })
      .join('\n');
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false"></script>
  <script>
    kakao.maps.load(function () {
      try {
        var container = document.getElementById('map');
        var options = {
          center: new kakao.maps.LatLng(${currentLocation.lat}, ${currentLocation.lon}),
          level: 5
        };
        var map = new kakao.maps.Map(container, options);

        var zoomControl = new kakao.maps.ZoomControl();
        map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

        var currentPosition = new kakao.maps.LatLng(${currentLocation.lat}, ${currentLocation.lon});
        var currentMarker = new kakao.maps.Marker({
          position: currentPosition,
          map: map
        });

        var currentOverlay = new kakao.maps.CustomOverlay({
          content: '<div style="padding:6px 10px;background:#ec4899;border-radius:15px;font-size:11px;font-weight:bold;color:#fff;">📍 현재 위치</div>',
          position: currentPosition,
          yAnchor: 2.8
        });
        currentOverlay.setMap(map);

        ${markersJS}

        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapLoaded', success: true }));
      } catch (e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapError', error: e.message }));
      }
    });
  </script>
</body>
</html>`;
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'mapLoaded') {
        console.log('[MAP] 카카오맵 로드 완료!');
        setMapReady(true);
      } else if (data.type === 'mapError') {
        console.error('[MAP] 카카오맵 에러:', data.error);
      } else if (data.type === 'markerClick') {
        setSelectedUser(data.user);
      }
    } catch (e) {
      console.log('[MAP] WebView message:', event.nativeEvent.data);
    }
  };

  const handleWebViewError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('[MAP] WebView 에러:', nativeEvent);
  };

  const activeRouteName = 'Map';
  const getTabColor = (routeName) =>
    routeName === activeRouteName ? '#000000' : '#9ca3af';
  const getTabWeight = (routeName) =>
    routeName === activeRouteName ? '700' : '500';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* 카카오맵 WebView */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: generateMapHTML() }}
          style={styles.webview}
          onMessage={handleWebViewMessage}
          onError={handleWebViewError}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          originWhitelist={['*']}
          mixedContentMode="always"
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#ec4899" />
              <Text style={styles.loadingText}>지도를 불러오는 중...</Text>
            </View>
          )}
        />

        {/* 헤더 */}
        <View style={styles.headerContainer}>
          <View style={styles.headerPill}>
            <View style={styles.iconCircle}>
              <Ionicons name="location" size={18} color="#fff" />
            </View>
            <Text style={styles.headerText}>
              {currentLocation.name} 주변{' '}
              <Text style={styles.highlightText}>{users.length}명</Text>의 피플
            </Text>
          </View>
        </View>

        {/* 위치 변경 버튼 */}
        <TouchableOpacity
          style={styles.locationToggleButton}
          activeOpacity={0.8}
          onPress={() => {
            const newLocation =
              currentLocation.name === COORD_BUNDANG.name
                ? COORD_SEONGBUK
                : COORD_BUNDANG;

            setCurrentLocation(newLocation);
            setMapReady(false);
          }}
        >
          <Ionicons name="swap-horizontal" size={22} color="#333" />
        </TouchableOpacity>

        {/* 새로고침 버튼 */}
        <TouchableOpacity
          style={styles.refreshButton}
          activeOpacity={0.8}
          onPress={() => {
            setMapReady(false);
            fetchUsers();
          }}
        >
          <Ionicons name="refresh" size={22} color="#333" />
        </TouchableOpacity>
      </View>
      {/* ⭐️ 사용자 프로필 모달 */}
      <Modal
        visible={selectedUser !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedUser(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedUser(null)}
        >
          <View style={styles.modalContent}>
            {selectedUser && (
              <>
                <Image
                  source={{ uri: selectedUser.image }}
                  style={styles.profileImage}
                />

                <Text style={styles.modalName}>
                  {selectedUser.name}, {selectedUser.age}세
                </Text>

                <Text style={styles.modalInfo}>
                  직업: {selectedUser.job || selectedUser.style}
                </Text>

                <Text style={styles.modalInfo}>
                  성별: {selectedUser.gender === 'F' ? '여성' : '남성'}
                </Text>

                <Text style={styles.modalBio}>{selectedUser.bio}</Text>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalBtnClose}
                    onPress={() => setSelectedUser(null)}
                  >
                    <Text style={styles.modalBtnCloseText}>닫기</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalBtnLike}
                    onPress={() => handleLike(selectedUser.id)}
                  >
                    <Ionicons name="heart" size={16} color="#fff" />
                    <Text style={styles.modalBtnLikeText}> 좋아요</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 하단 탭 바 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate('MainHome')}
        >
          <Ionicons name="home-outline" size={24} color={getTabColor('MainHome')} />
          <Text
            style={[
              styles.tabText,
              { color: getTabColor('MainHome'), fontWeight: getTabWeight('MainHome') },
            ]}
          >
            홈
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate('Explore')}
        >
          <Ionicons name="compass-outline" size={24} color={getTabColor('Explore')} />
          <Text
            style={[
              styles.tabText,
              { color: getTabColor('Explore'), fontWeight: getTabWeight('Explore') },
            ]}
          >
            탐색
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate('Map')}
        >
          <Ionicons name="map" size={24} color={getTabColor('Map')} />
          <Text
            style={[
              styles.tabText,
              { color: getTabColor('Map'), fontWeight: getTabWeight('Map') },
            ]}
          >
            위치
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate('Matches')}
        >
          <Ionicons name="people-outline" size={24} color={getTabColor('Matches')} />
          <Text
            style={[
              styles.tabText,
              { color: getTabColor('Matches'), fontWeight: getTabWeight('Matches') },
            ]}
          >
            매칭
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate('ChatList')}
        >
          <Ionicons
            name="chatbubbles-outline"
            size={24}
            color={getTabColor('ChatList')}
          />
          <Text
            style={[
              styles.tabText,
              { color: getTabColor('ChatList'), fontWeight: getTabWeight('ChatList') },
            ]}
          >
            채팅
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate('MyProfile')}
        >
          <Ionicons name="person-outline" size={24} color={getTabColor('MyProfile')} />
          <Text
            style={[
              styles.tabText,
              { color: getTabColor('MyProfile'), fontWeight: getTabWeight('MyProfile') },
            ]}
          >
            나
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  mapContainer: { flex: 1, position: 'relative' },
  webview: { flex: 1, backgroundColor: '#f5f5f5' },

  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: { marginTop: 10, fontSize: 14, color: '#666' },

  headerContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { fontSize: 15, fontWeight: '600', color: '#333' },
  highlightText: { color: '#ec4899', fontWeight: 'bold', fontSize: 16 },

  locationToggleButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  refreshButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: width * 0.8,
    alignItems: 'center',
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 16,
    backgroundColor: '#eee',
    borderWidth: 3,
    borderColor: '#ec4899',
  },
  modalName: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  modalInfo: { fontSize: 14, color: '#666', marginBottom: 4 },
  modalBio: {
    fontSize: 13,
    color: '#777',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 10,
  },

  modalButtons: { flexDirection: 'row', marginTop: 20, gap: 12 },
  modalBtnClose: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  modalBtnCloseText: { color: '#666', fontWeight: '600' },

  modalBtnLike: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: '#ec4899',
  },
  modalBtnLikeText: { color: '#fff', fontWeight: '600' },

  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
    paddingBottom: 32,
    paddingHorizontal: 8,
    shadowColor: '#000',
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
  tabText: { fontSize: 11, marginTop: 4 },
});