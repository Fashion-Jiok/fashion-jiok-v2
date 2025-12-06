import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  StatusBar,
  Alert,
  Platform,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

// ⭐️ BottomTabBar 컴포넌트 import
import BottomTabBar from '../../components/BottomTabBar'; 

// ==========================================
// 1. SQL 데이터 기반 상수 정의 (취향 항목 통일)
// ==========================================

const mbtiOptions = {
  energy: ['E', 'I'],
  information: ['N', 'S'],
  decisions: ['F', 'T'],
  lifestyle: ['P', 'J']
};

const mbtiLabels = {
  energy: { E: 'E - 외향형', I: 'I - 내향형' },
  information: { N: 'N - 직관형', S: 'S - 감각형' },
  decisions: { F: 'F - 감정형', T: 'T - 사고형' },
  lifestyle: { P: 'P - 인식형', J: 'J - 판단형' }
};

// ⭐️ SQL DB와 동일한 관심사 목록 (로블록스 등 포함)
const interestCategories = {
  '게임': ['닌텐도', 'PC방', '로블록스', '오버워치', 'E-sports'],
  '집순이/집돌이': ['독서', '드라마정주행', '베이킹', '보드게임', '식물가꾸기', '온라인게임', '요리', '홈트'],
  '아웃도어': ['등산', '캠핑', '자전거', '러닝', '서핑'],
  '문화생활': ['전시회', '영화', '공연', '페스티벌', '뮤지컬'],
  '음식': ['맛집투어', '카페', '와인'], 
  '운동': ['헬스', '요가', '필라테스', '수영', '테니스']
};

// ⭐️ SQL DB와 동일한 스타일 태그
const allStyleTags = [
  '미니멀', '모던', '캐주얼', '스트리트', '빈티지', '클래식', '페미닌', '스포티',
  '심플', '댄디', '로맨틱', '힙스터', '보헤미안', '프레피', '고프코어', '아메카지'
];

export default function UserProfileScreen({ navigation }) {
  const [isEditing, setIsEditing] = useState(false);
  
  // ⭐️ 데이터: 수민 (기존 데이터 복구)
  const [userProfile, setUserProfile] = useState({
    name: "수민",
    age: 27,
    gender: 'F', // 여성
    location: "서울 용산구",
    job: "프로덕트 디자이너",
    education: "홍익대학교",
    bio: "좋은 디자인과 패션을 사랑하는 사람입니다. 주말에는 전시회나 카페 투어를 즐깁니다.",
    
    images: [
      "https://i.pinimg.com/1200x/bc/87/15/bc8715dc1d75d38ede5745a85ec889fd.jpg",
      "https://i.pinimg.com/736x/95/48/1d/95481d1474b1d10c850034ff686cb01f.jpg",
      "https://i.pinimg.com/1200x/a7/4a/6a/a74a6a03c97c2dc43c8153d7e1f2637f.jpg"
    ],

    mbti: {
      energy: 'E',
      information: 'N',
      decisions: 'F',
      lifestyle: 'P'
    },

    styles: ["미니멀", "모던", "캐주얼"],
    
    // DB 카테고리에 맞춰서 선택된 관심사
    interests: ["전시회", "카페", "독서", "요가"], 

    styleAnalysis: {
      primary: "미니멀",
      secondary: "모던 캐주얼",
      colors: ["블랙", "화이트", "그레이", "베이지"],
      brands: ["COS", "유니클로", "에이랜드"]
    }
  });

  const activeRouteName = 'MyProfile';
  const getTabColor = (routeName) => (routeName === activeRouteName ? '#000000' : '#9ca3af');
  const getTabWeight = (routeName) => (routeName === activeRouteName ? '700' : '500');

  // --- Handlers ---
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진을 선택하려면 갤러리 접근 권한이 필요합니다.');
      return false;
    }
    return true;
  };

  const handleAddPhoto = async () => {
    if (!await requestPermissions()) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setUserProfile({ ...userProfile, images: [...userProfile.images, result.assets[0].uri] });
    }
  };

  const handleChangePhoto = async (index) => {
    if (!await requestPermissions()) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      const newImages = [...userProfile.images];
      newImages[index] = result.assets[0].uri;
      setUserProfile({ ...userProfile, images: newImages });
    }
  };

  const handleDeletePhoto = (index) => {
    Alert.alert('사진 삭제', '이 사진을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => {
          const newImages = userProfile.images.filter((_, i) => i !== index);
          setUserProfile({ ...userProfile, images: newImages });
        }}
    ]);
  };

  const handleMbtiChange = (category, value) => {
    if (!isEditing) return;
    setUserProfile({ ...userProfile, mbti: { ...userProfile.mbti, [category]: value } });
  };

  const handleInterestToggle = (interest) => {
    if (!isEditing) return;
    const current = userProfile.interests;
    if (current.includes(interest)) {
      setUserProfile({ ...userProfile, interests: current.filter(i => i !== interest) });
    } else {
      setUserProfile({ ...userProfile, interests: [...current, interest] });
    }
  };

  const handleStyleToggle = (tag) => {
    if (!isEditing) return;
    const current = userProfile.styles;
    if (current.includes(tag)) {
        setUserProfile({ ...userProfile, styles: current.filter(t => t !== tag) });
    } else {
        if (current.length >= 5) {
            Alert.alert("알림", "스타일 태그는 최대 5개까지 선택 가능합니다.");
            return;
        }
        setUserProfile({ ...userProfile, styles: [...current, tag] });
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    Alert.alert('저장 완료', '프로필이 성공적으로 업데이트되었습니다.');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* ⭐️ Header: Logo & Back Button */}
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

        {/* Edit/Save Button */}
        <TouchableOpacity
          onPress={() => isEditing ? handleSave() : setIsEditing(true)}
          style={styles.editButton}
        >
          <LinearGradient
            colors={isEditing ? ['#8b5cf6', '#ec4899'] : ['#f3f4f6', '#f3f4f6']}
            style={styles.editButtonGradient}
          >
            <Text style={[styles.editButtonText, isEditing && styles.editButtonTextActive]}>
              {isEditing ? '✓ 저장' : '✏️ 편집'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Photo Grid */}
        <View style={styles.photoSection}>
          <View style={styles.photoGrid}>
            {userProfile.images.map((img, idx) => (
              <View key={idx} style={styles.photoItem}>
                <Image source={{ uri: img }} style={styles.photo} resizeMode="cover" />
                {isEditing && (
                  <View style={styles.photoOverlay}>
                    <TouchableOpacity style={styles.photoActionButton} onPress={() => handleChangePhoto(idx)}>
                      <Text>📷</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.photoActionButton} onPress={() => handleDeletePhoto(idx)}>
                      <Text>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {/* Primary Image Badge */}
                {idx === 0 && !isEditing && (
                    <View style={styles.primaryBadge}>
                        <Text style={styles.primaryBadgeText}>대표</Text>
                    </View>
                )}
              </View>
            ))}
            {isEditing && userProfile.images.length < 6 && (
              <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto}>
                <Text style={styles.addPhotoIcon}>+</Text>
                <Text style={styles.addPhotoText}>추가</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Basic Info */}
        <View style={styles.card}>
          <View style={styles.nameSection}>
            {isEditing ? (
              <View style={styles.editNameRow}>
                <TextInput
                  value={userProfile.name}
                  onChangeText={(text) => setUserProfile({ ...userProfile, name: text })}
                  style={styles.nameInput}
                  placeholder="이름"
                />
                <TextInput
                  value={userProfile.age.toString()}
                  onChangeText={(text) => setUserProfile({ ...userProfile, age: parseInt(text) || 0 })}
                  style={styles.ageInput}
                  placeholder="나이"
                  keyboardType="numeric"
                />
              </View>
            ) : (
              <View style={{flexDirection:'row', alignItems:'center'}}>
                  <Text style={styles.nameText}>{userProfile.name}, {userProfile.age}</Text>
                  {/* 성별 아이콘 (여성) */}
                  <Ionicons 
                    name={userProfile.gender === 'M' ? "male" : "female"} 
                    size={20} 
                    color={userProfile.gender === 'M' ? "#3b82f6" : "#ec4899"} 
                    style={{marginLeft:8}} 
                  />
              </View>
            )}
          </View>

          <View style={styles.infoList}>
            <InfoItem icon="location" text={userProfile.location} isEditing={isEditing} 
              onChange={(t) => setUserProfile({...userProfile, location: t})} placeholder="위치" />
            <InfoItem icon="briefcase" text={userProfile.job} isEditing={isEditing} 
              onChange={(t) => setUserProfile({...userProfile, job: t})} placeholder="직업" />
            <InfoItem icon="school" text={userProfile.education} isEditing={isEditing} 
              onChange={(t) => setUserProfile({...userProfile, education: t})} placeholder="학력" />
          </View>
        </View>

        {/* Bio */}
        <View style={styles.card}>
            <Text style={styles.cardTitle}>자기소개</Text>
            {isEditing ? (
                <TextInput
                value={userProfile.bio}
                onChangeText={(text) => setUserProfile({ ...userProfile, bio: text })}
                style={styles.bioInput}
                multiline
                placeholder="자신을 소개해주세요"
                />
            ) : (
                <Text style={styles.bioText}>{userProfile.bio}</Text>
            )}
        </View>

        {/* MBTI */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>MBTI</Text>
            <View style={styles.mbtiResultBadge}>
              <Text style={styles.mbtiResultText}>
                {userProfile.mbti.energy}{userProfile.mbti.information}
                {userProfile.mbti.decisions}{userProfile.mbti.lifestyle}
              </Text>
            </View>
          </View>
          
          {Object.keys(mbtiOptions).map((category) => (
             <View key={category} style={styles.mbtiRow}>
                 {mbtiOptions[category].map((type) => (
                     <TouchableOpacity
                        key={type}
                        onPress={() => handleMbtiChange(category, type)}
                        disabled={!isEditing}
                        style={[
                            styles.mbtiBtn, 
                            userProfile.mbti[category] === type && styles.mbtiBtnActive,
                            !isEditing && userProfile.mbti[category] !== type && {opacity: 0.3}
                        ]}
                     >
                         <Text style={[
                             styles.mbtiBtnText,
                             userProfile.mbti[category] === type && styles.mbtiBtnTextActive
                         ]}>{mbtiLabels[category][type]}</Text>
                     </TouchableOpacity>
                 ))}
             </View>
          ))}
        </View>

        {/* Style Tags (SQL Based) */}
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>스타일 태그</Text>
                <Text style={styles.subtitleSmall}>최대 5개</Text>
            </View>
            
            {isEditing ? (
                 <View style={styles.tagContainer}>
                    {allStyleTags.map((tag) => (
                        <TouchableOpacity 
                            key={tag} 
                            style={[
                                styles.styleTagEdit, 
                                userProfile.styles.includes(tag) && styles.styleTagActive
                            ]}
                            onPress={() => handleStyleToggle(tag)}
                        >
                            <Text style={[
                                styles.styleTagEditText,
                                userProfile.styles.includes(tag) && styles.styleTagTextActive
                            ]}>{tag}</Text>
                        </TouchableOpacity>
                    ))}
                 </View>
            ) : (
                <View style={styles.tagContainer}>
                    {userProfile.styles.map((style, idx) => (
                        <View key={idx} style={styles.styleTag}>
                            <Text style={styles.styleTagText}>#{style}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>

        {/* AI Analysis */}
        <View style={styles.card}>
             <View style={styles.cardHeader}>
                <Ionicons name="sparkles" size={20} color="#8b5cf6" style={{marginRight:6}} />
                <Text style={styles.cardTitle}>AI 스타일 분석</Text>
             </View>
             
             <View style={styles.aiResultRow}>
                 <View>
                     <Text style={styles.aiLabel}>Main Style</Text>
                     <Text style={styles.aiValuePrimary}>{userProfile.styleAnalysis.primary}</Text>
                 </View>
                 <View>
                     <Text style={styles.aiLabel}>Sub Style</Text>
                     <Text style={styles.aiValueSecondary}>{userProfile.styleAnalysis.secondary}</Text>
                 </View>
             </View>

             <View style={styles.aiTagGroup}>
                 <Text style={styles.aiLabel}>Colors</Text>
                 <View style={styles.tagContainer}>
                     {userProfile.styleAnalysis.colors.map((c, i) => (
                         <View key={i} style={styles.colorChip}><Text style={styles.chipText}>{c}</Text></View>
                     ))}
                 </View>
             </View>

             <View style={styles.aiTagGroup}>
                 <Text style={styles.aiLabel}>Brands</Text>
                 <View style={styles.tagContainer}>
                     {userProfile.styleAnalysis.brands.map((b, i) => (
                         <View key={i} style={styles.brandChip}><Text style={styles.chipTextBrand}>{b}</Text></View>
                     ))}
                 </View>
             </View>
        </View>

        {/* Interests (SQL Based: Roblox included) */}
        <View style={styles.card}>
            <Text style={styles.cardTitle}>관심사</Text>
            {Object.entries(interestCategories).map(([category, items]) => (
                <View key={category} style={styles.interestSection}>
                    <Text style={styles.interestCategoryTitle}>{category}</Text>
                    <View style={styles.tagContainer}>
                        {items.map((interest) => {
                            const isSelected = userProfile.interests.includes(interest);
                            return (
                                <TouchableOpacity
                                    key={interest}
                                    onPress={() => handleInterestToggle(interest)}
                                    disabled={!isEditing}
                                    style={[
                                        styles.interestChip,
                                        isSelected && styles.interestChipActive
                                    ]}
                                >
                                    <Text style={[
                                        styles.interestChipText,
                                        isSelected && styles.interestChipTextActive
                                    ]}>{interest}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            ))}
        </View>

        {/* Buttons */}
        <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.aiButton}>
                <LinearGradient
                    colors={['#8b5cf6', '#ec4899']}
                    style={styles.aiButtonGradient}
                >
                    <Ionicons name="refresh" size={18} color="#fff" style={{marginRight:6}} />
                    <Text style={styles.aiButtonText}>스타일 재분석 요청</Text>
                </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingButton}>
                <Text style={styles.settingButtonText}>설정 / 계정 관리</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ⭐️ Bottom Tab Bar */}
      <BottomTabBar navigation={navigation} getTabColor={getTabColor} getTabWeight={getTabWeight} />
    </View>
  );
}

// Helper Component for Info List
const InfoItem = ({ icon, text, isEditing, onChange, placeholder }) => (
    <View style={styles.infoItem}>
        <View style={styles.infoIconBox}>
            <Ionicons name={icon} size={16} color="#6b7280" />
        </View>
        {isEditing ? (
            <TextInput 
                value={text} onChangeText={onChange} 
                style={styles.infoInput} placeholder={placeholder} 
            />
        ) : (
            <Text style={styles.infoText}>{text}</Text>
        )}
    </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  // Header
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
  editButton: { borderRadius: 20, overflow: 'hidden' },
  editButtonGradient: { paddingHorizontal: 16, paddingVertical: 8 },
  editButtonText: { color: '#6b7280', fontSize: 14, fontWeight: '600' },
  editButtonTextActive: { color: '#ffffff' },

  scrollView: { flex: 1, backgroundColor: '#f9fafb' },

  // Photos
  photoSection: { backgroundColor: '#fff', paddingVertical: 20, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10 },
  photoItem: { width: '31%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f3f4f6', position:'relative' },
  photo: { width: '100%', height: '100%' },
  photoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 10 },
  photoActionButton: { width: 30, height: 30, backgroundColor: 'white', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  primaryBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: '#000', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  primaryBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  addPhotoButton: { width: '31%', aspectRatio: 1, borderRadius: 12, borderWidth: 1, borderColor: '#d1d5db', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  addPhotoIcon: { fontSize: 24, color: '#9ca3af' },
  addPhotoText: { fontSize: 12, color: '#9ca3af' },

  // Card Common
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, padding: 20, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  
  // Basic Info
  nameSection: { marginBottom: 20 },
  nameText: { fontSize: 26, fontWeight: '800', color: '#111827' },
  editNameRow: { flexDirection: 'row', gap: 10 },
  nameInput: { flex: 2, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10, fontSize: 16 },
  ageInput: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10, fontSize: 16, textAlign: 'center' },
  infoList: { gap: 12 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoIconBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  infoText: { fontSize: 15, color: '#374151' },
  infoInput: { flex: 1, borderBottomWidth: 1, borderColor: '#e5e7eb', paddingVertical: 4, fontSize: 15 },
  
  bioInput: { backgroundColor: '#f9fafb', padding: 12, borderRadius: 12, height: 100, textAlignVertical: 'top' },
  bioText: { fontSize: 15, color: '#4b5563', lineHeight: 22 },

  // MBTI
  mbtiResultBadge: { backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  mbtiResultText: { fontSize: 16, fontWeight: '800', color: '#8b5cf6', letterSpacing: 1 },
  mbtiRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  mbtiBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  mbtiBtnActive: { borderColor: '#8b5cf6', backgroundColor: '#f5f3ff' },
  mbtiBtnText: { color: '#6b7280', fontSize: 12, fontWeight: '600' },
  mbtiBtnTextActive: { color: '#7c3aed' },

  // Style Tags
  subtitleSmall: { fontSize: 12, color: '#9ca3af' },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  styleTag: { backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  styleTagText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  styleTagEdit: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb' },
  styleTagActive: { backgroundColor: '#111827', borderColor: '#111827' },
  styleTagEditText: { fontSize: 13, color: '#6b7280' },
  styleTagTextActive: { color: '#fff' },

  // AI Analysis
  aiResultRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20, paddingVertical: 10, backgroundColor: '#fafafa', borderRadius: 12 },
  aiLabel: { fontSize: 12, color: '#9ca3af', marginBottom: 4, fontWeight: '600' },
  aiValuePrimary: { fontSize: 16, fontWeight: '700', color: '#8b5cf6' },
  aiValueSecondary: { fontSize: 16, fontWeight: '600', color: '#4b5563' },
  aiTagGroup: { marginBottom: 12 },
  colorChip: { width: 60, paddingVertical: 4, borderRadius: 4, backgroundColor: '#f3f4f6', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  brandChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  chipText: { fontSize: 11, color: '#374151' },
  chipTextBrand: { fontSize: 11, color: '#374151', fontWeight: '600' },

  // Interests
  interestSection: { marginBottom: 16 },
  interestCategoryTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 },
  interestChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  interestChipActive: { borderColor: '#ec4899', backgroundColor: '#fdf2f8' },
  interestChipText: { fontSize: 13, color: '#6b7280' },
  interestChipTextActive: { color: '#db2777', fontWeight: '600' },

  // Buttons
  actionButtons: { padding: 20, gap: 12 },
  aiButton: { borderRadius: 16, overflow: 'hidden', elevation: 4 },
  aiButtonGradient: { paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  aiButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  settingButton: { paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center', backgroundColor: '#fff' },
  settingButtonText: { color: '#4b5563', fontSize: 15, fontWeight: '600' },
});