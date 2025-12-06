// src/screens/Auth/LoginScreen.js
import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, Image, StatusBar, Alert, ActivityIndicator 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser } from '../../services/api';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // 입력 확인
    if (!username.trim() || !password.trim()) {
      Alert.alert('알림', '아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    
    try {
      console.log(`📡 [FRONT] 로그인 시도: ${username}`);
      
      const result = await loginUser(username.trim(), password);
      
      console.log('📡 [FRONT] 서버 응답:', JSON.stringify(result, null, 2));

      if (result && result.success) {
        console.log('✅ [FRONT] 로그인 성공! 사용자 정보:', result.user);
        
        try {
          // ⭐️ 사용자 정보 저장
          console.log('💾 [FRONT] AsyncStorage 저장 시작...');
          await AsyncStorage.setItem('userId', String(result.user.id));
          await AsyncStorage.setItem('username', result.user.username);
          await AsyncStorage.setItem('userName', result.user.name || '사용자');
          console.log('✅ [FRONT] AsyncStorage 저장 완료');
          
          // global 변수에도 저장
          global.userId = result.user.id;
          console.log('✅ [FRONT] global.userId 설정 완료:', global.userId);
          
        } catch (storageError) {
          console.error('❌ [FRONT] AsyncStorage 저장 실패:', storageError);
        }
        
        // ⭐️ 바로 화면 이동 (Alert 없이)
        console.log('🚀 [FRONT] Onboarding 화면으로 이동 시도...');
        navigation.replace('Onboarding');
        console.log('✅ [FRONT] navigation.replace 실행 완료');
        
      } else {
        console.log('❌ [FRONT] 로그인 실패:', result.message);
        Alert.alert(
          '로그인 실패', 
          result.message || '아이디 또는 비밀번호를 확인해주세요.'
        );
      }
    } catch (error) {
      console.error('❌ [FRONT] 로그인 에러:', error);
      Alert.alert(
        '오류', 
        '서버 연결에 실패했습니다.\n서버 주소를 확인해주세요.'
      );
    } finally {
      setLoading(false);
      console.log('🏁 [FRONT] handleLogin 완료');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.backgroundContainer}>
        <View style={styles.content}>
          
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={{ uri: 'https://i.pinimg.com/736x/12/b4/d5/12b4d59018dd604fc3b5e287595e4a8c.jpg' }}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.title}>Fashion Jiok</Text>
            <Text style={styles.subtitle}>
              패션과 라이프스타일로 만나는{'\n'}새로운 인연
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>아이디</Text>
              <TextInput
                placeholder="아이디를 입력하세요"
                placeholderTextColor="#9ca3af"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                style={styles.input}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>비밀번호</Text>
              <TextInput
                placeholder="비밀번호를 입력하세요"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
                style={styles.input}
                editable={!loading}
                onSubmitEditing={handleLogin}
                returnKeyType="done"
              />
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              activeOpacity={0.8}
              style={styles.buttonMargin}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? ['#e5e7eb', '#e5e7eb'] : ['#ec4899', '#9333ea']}
                style={styles.button}
              >
                {loading ? (
                  <ActivityIndicator color="#9ca3af" />
                ) : (
                  <Text style={styles.buttonText}>로그인</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Signup')}
              style={styles.backButton}
              activeOpacity={0.6}
              disabled={loading}
            >
              <Text style={styles.backButtonText}>
                계정이 없으신가요? <Text style={{fontWeight: '700', color: '#9333ea'}}>회원가입</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.terms}>
            <Text style={styles.termsText}>
              로그인하면 Fashion Jiok의{'\n'}이용약관 및 개인정보 처리방침에 동의하게 됩니다
            </Text>
          </View>

        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  backgroundContainer: { flex: 1, backgroundColor: '#ffffff' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  header: { alignItems: 'center', marginBottom: 48 },
  logoContainer: { marginBottom: 24 },
  logoImage: { width: 180, height: 180, borderRadius: 90, backgroundColor: '#f3f4f6' },
  title: { color: '#000000', fontSize: 36, fontWeight: '300', marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { color: '#6b7280', fontSize: 16, fontWeight: '400', textAlign: 'center', lineHeight: 24 },
  form: { marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { color: '#374151', marginBottom: 8, fontSize: 14, fontWeight: '500' },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#000000', fontSize: 16, height: 52 },
  button: { borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  buttonMargin: { marginTop: 24, marginBottom: 16 },
  backButton: { paddingVertical: 12 },
  backButtonText: { color: '#6b7280', textAlign: 'center', fontSize: 14 },
  terms: { marginTop: 48 },
  termsText: { color: '#9ca3af', fontSize: 12, textAlign: 'center', lineHeight: 18 },
});