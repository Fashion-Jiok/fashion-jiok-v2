import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, 
  ActivityIndicator, Alert, ScrollView, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

// ★ 서버 주소 (API.js에서 가져오거나 직접 입력)
const SERVER_URL = "http://172.30.1.61:8000/predict";

export default function AnalysisScreen({ navigation }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  // 1. 사진 선택 (성별 팝업)
  const pickImage = () => {
    Alert.alert(
      "모델 성별 선택",
      "분석할 사진의 모델 성별을 선택해주세요.",
      [
        { text: "남성", onPress: () => openGallery('male') },
        { text: "여성", onPress: () => openGallery('female') },
        { text: "취소", style: "cancel" }
      ]
    );
  };

  // 2. 갤러리 열기
  const openGallery = async (gender) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setResult(null); // 이전 결과 초기화
      analyzeStyle(result.assets[0].uri, gender);
    }
  };

  // 3. 서버 분석 요청
  const analyzeStyle = async (uri, gender) => {
    setAnalyzing(true);
    const formData = new FormData();
    formData.append('file', {
      uri: uri,
      type: 'image/jpeg',
      name: 'upload.jpg',
    });
    formData.append('gender', gender);

    try {
      const response = await fetch(SERVER_URL, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const json = await response.json();
      if (json.result) {
        setResult(json.result);
      } else {
        Alert.alert("실패", "분석 결과를 가져오지 못했습니다.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("오류", "서버 연결 실패. IP를 확인해주세요.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI 스타일 분석</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 이미지 표시 영역 */}
        <View style={styles.imageContainer}>
          {selectedImage ? (
            <Image source={{ uri: selectedImage }} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="image-outline" size={60} color="#ccc" />
              <Text style={styles.placeholderText}>사진을 선택해주세요</Text>
            </View>
          )}
          
          {/* 로딩 인디케이터 */}
          {analyzing && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#ec4899" />
              <Text style={styles.loadingText}>분석 중...</Text>
            </View>
          )}
        </View>

        {/* 결과 표시 영역 */}
        {result && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>분석 결과</Text>
            <Text style={styles.resultText}>{result}</Text>
            <Text style={styles.resultDesc}>
              이 스타일은 {result} 룩에 가깝습니다.{"\n"}
              관련된 아이템을 추천해드릴까요?
            </Text>
          </View>
        )}

        {/* 버튼 */}
        <TouchableOpacity 
          style={styles.button} 
          onPress={pickImage}
          disabled={analyzing}
        >
          <LinearGradient
            colors={['#8b5cf6', '#ec4899']}
            style={styles.gradient}
          >
            <Ionicons name="camera" size={24} color="#fff" />
            <Text style={styles.buttonText}>
              {selectedImage ? "다른 사진 분석하기" : "사진 선택하기"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 24, alignItems: 'center' },
  imageContainer: {
    width: '100%', aspectRatio: 3/4, backgroundColor: '#f9fafb',
    borderRadius: 20, overflow: 'hidden', marginBottom: 30,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb'
  },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholder: { alignItems: 'center' },
  placeholderText: { marginTop: 10, color: '#9ca3af' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center', alignItems: 'center'
  },
  loadingText: { marginTop: 10, color: '#ec4899', fontWeight: '600' },
  resultContainer: {
    width: '100%', padding: 20, backgroundColor: '#fdf2f8',
    borderRadius: 16, marginBottom: 30, alignItems: 'center',
    borderWidth: 1, borderColor: '#fbcfe8'
  },
  resultLabel: { fontSize: 14, color: '#db2777', fontWeight: '700', marginBottom: 8 },
  resultText: { fontSize: 28, color: '#831843', fontWeight: '800', marginBottom: 8 },
  resultDesc: { textAlign: 'center', color: '#9d174d', lineHeight: 20 },
  button: { width: '100%', borderRadius: 16, overflow: 'hidden', elevation: 5 },
  gradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, gap: 10
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});