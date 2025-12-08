import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, 
  ActivityIndicator, Alert, ScrollView, Platform, Linking 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

// ⭐️ 본인 컴퓨터 IP로 변경 (현재 설정된 IP 유지)
const SERVER_URL = "http://172.30.1.40:8000/predict";

export default function AnalysisScreen({ navigation }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  // ====================================================
  // 1. 화면 진입 시 자동 실행
  // ====================================================
  useEffect(() => {
    // 화면 로딩이 안정화되면(0.1초 후) 프로세스 시작
    const timer = setTimeout(() => {
      startAnalysisProcess();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // ====================================================
  // 2. 프로세스 시작 (성별 질문 -> 갤러리)
  // ====================================================
  const startAnalysisProcess = () => {
    Alert.alert(
      "모델 성별 선택",
      "분석할 모델의 성별을 먼저 알려주세요.",
      [
        { text: "남성", onPress: () => openGallery('male') },
        { text: "여성", onPress: () => openGallery('female') },
        { text: "취소", style: "cancel", onPress: () => navigation.goBack() }
      ],
      { cancelable: false }
    );
  };

  // ====================================================
  // 3. 갤러리 열기 (에러 수정 완료)
  // ====================================================
  const openGallery = async (gender) => {
    try {
      // (1) 권한 확인
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.status === 'denied') {
        Alert.alert(
          "권한 필요", 
          "사진을 분석하려면 갤러리 권한이 필요합니다.",
          [
            { text: "취소", style: "cancel" },
            { text: "설정으로 이동", onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      // (2) 갤러리 실행 (버전 호환성 문제 해결)
      // MediaType이 없으면 MediaTypeOptions를 쓰고, 그것도 없으면 문자열 사용
      let mediaTypeSetting;
      if (ImagePicker.MediaType && ImagePicker.MediaType.Images) {
        mediaTypeSetting = ImagePicker.MediaType.Images;
      } else if (ImagePicker.MediaTypeOptions && ImagePicker.MediaTypeOptions.Images) {
        mediaTypeSetting = ImagePicker.MediaTypeOptions.Images;
      } else {
        mediaTypeSetting = 'Images'; // 최후의 수단 (문자열 직접 입력)
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaTypeSetting, // ✅ 에러 수정된 설정 적용
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.5, // 속도 최적화
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        console.log("📸 사진 선택됨:", uri);
        
        setSelectedImage(uri);
        setResult(null);
        
        // 사진 선택 즉시 분석 시작
        analyzeStyle(uri, gender);
      } else {
        // 취소했을 때 뒤로가기? 혹은 가만히 있기
        console.log("📸 사진 선택 취소됨");
      }

    } catch (error) {
      console.error("❌ 갤러리 에러:", error);
      Alert.alert("오류", "갤러리를 여는 중 문제가 발생했습니다.");
    }
  };

  // ====================================================
  // 4. 서버로 전송 및 분석
  // ====================================================
  const analyzeStyle = async (uri, gender) => {
    setAnalyzing(true);
    
    // FormData 생성
    const formData = new FormData();
    formData.append('file', {
      uri: uri,
      type: 'image/jpeg',
      name: 'upload.jpg',
    });
    formData.append('gender', gender);

    console.log(`📡 서버 전송 시작 (${gender}): ${SERVER_URL}`);

    try {
      const response = await fetch(SERVER_URL, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const json = await response.json();
      console.log("✅ 분석 결과:", json);

      if (json.result) {
        setResult(json.result);
      } else {
        Alert.alert("실패", "분석 결과를 가져오지 못했습니다.");
      }
    } catch (error) {
      console.error("❌ 통신 에러:", error);
      Alert.alert("연결 실패", "서버와 연결할 수 없습니다.\nIP 주소와 서버 실행 여부를 확인하세요.");
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
        {/* 이미지 영역 */}
        <View style={styles.imageContainer}>
          {selectedImage ? (
            <Image source={{ uri: selectedImage }} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="image-outline" size={60} color="#ccc" />
              <Text style={styles.placeholderText}>자동으로 분석이 시작됩니다</Text>
            </View>
          )}
          
          {/* 로딩 표시 */}
          {analyzing && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#ec4899" />
              <Text style={styles.loadingText}>스타일 분석 중...</Text>
            </View>
          )}
        </View>

        {/* 결과 영역 */}
        {result && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>분석 결과</Text>
            <Text style={styles.resultText}>{result}</Text>
            <Text style={styles.resultDesc}>
              이 스타일은 {result} 룩입니다.
            </Text>
          </View>
        )}

        {/* 다시하기 버튼 */}
        <TouchableOpacity 
          style={styles.button} 
          onPress={startAnalysisProcess}
          disabled={analyzing}
        >
          <LinearGradient
            colors={['#8b5cf6', '#ec4899']}
            style={styles.gradient}
          >
            <Ionicons name="camera" size={24} color="#fff" />
            <Text style={styles.buttonText}>
              다시 분석하기
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