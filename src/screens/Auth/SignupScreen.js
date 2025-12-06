// src/screens/Auth/SignupScreen.js
import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { signupUser } from '../../services/api';

export default function SignupScreen({ navigation }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    phone: '',
    age: '',
    job: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleSignup = async () => {
    // 1. 유효성 검사
    if (!formData.username || !formData.password || !formData.name) {
      Alert.alert('알림', '필수 정보를 모두 입력해주세요.');
      return;
    }

    if (!formData.age) {
      Alert.alert('알림', '나이를 입력해주세요.');
      return;
    }

    if (formData.username.length < 4) {
      Alert.alert('알림', '아이디는 4자 이상이어야 합니다.');
      return;
    }

    if (formData.password.length < 4) {
      Alert.alert('알림', '비밀번호는 4자 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    try {
      console.log('📝 회원가입 시도:', formData.username);
      
      // 2. 서버 요청
      const result = await signupUser(formData);

      console.log('📝 서버 응답:', result);

      // 3. 결과 처리
      if (result.success) {
        console.log('✅ 회원가입 성공:', result.user);
        
        // ⭐️ 회원가입 성공 Alert
        Alert.alert(
          '회원가입 성공!', 
          `${formData.name}님, 환영합니다!\n로그인하여 서비스를 이용해보세요.`, 
          [
            { 
              text: '로그인하러 가기', 
              onPress: () => {
                // ⭐️ 로그인 화면으로 이동
                navigation.navigate('Login');
              }
            }
          ]
        );
      } else {
        Alert.alert('가입 실패', result.message || '다시 시도해주세요.');
      }
    } catch (error) {
      console.error('❌ 회원가입 에러:', error);
      Alert.alert('오류', error.message || '서버와 통신 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
          disabled={loading}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>회원가입</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>기본 정보 입력</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>아이디 *</Text>
          <TextInput
            style={styles.input}
            placeholder="4자 이상의 아이디"
            value={formData.username}
            onChangeText={(text) => handleChange('username', text)}
            autoCapitalize="none"
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>비밀번호 *</Text>
          <TextInput
            style={styles.input}
            placeholder="4자 이상의 비밀번호"
            secureTextEntry
            value={formData.password}
            onChangeText={(text) => handleChange('password', text)}
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>이름 *</Text>
          <TextInput
            style={styles.input}
            placeholder="실명"
            value={formData.name}
            onChangeText={(text) => handleChange('name', text)}
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>전화번호</Text>
          <TextInput
            style={styles.input}
            placeholder="010-0000-0000"
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={(text) => handleChange('phone', text)}
            editable={!loading}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>나이 *</Text>
            <TextInput
              style={styles.input}
              placeholder="예: 25"
              keyboardType="number-pad"
              value={formData.age}
              onChangeText={(text) => handleChange('age', text)}
              editable={!loading}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>직업</Text>
            <TextInput
              style={styles.input}
              placeholder="예: 디자이너"
              value={formData.job}
              onChangeText={(text) => handleChange('job', text)}
              editable={!loading}
            />
          </View>
        </View>

        <TouchableOpacity 
          onPress={handleSignup} 
          activeOpacity={0.8} 
          style={{ marginTop: 20 }}
          disabled={loading}
        >
          <LinearGradient 
            colors={loading ? ['#e5e7eb', '#e5e7eb'] : ['#ec4899', '#9333ea']} 
            style={styles.button}
          >
            {loading ? (
              <ActivityIndicator color="#9ca3af" />
            ) : (
              <Text style={styles.buttonText}>가입하기</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>이미 계정이 있으신가요? </Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
          >
            <Text style={styles.loginLink}>로그인</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    paddingTop: 50, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f3f4f6' 
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', marginLeft: 8 },
  scrollContent: { padding: 24 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 24, color: '#1f2937' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#4b5563', marginBottom: 8 },
  input: { 
    backgroundColor: '#f9fafb', 
    borderWidth: 1, 
    borderColor: '#e5e7eb', 
    borderRadius: 12, 
    padding: 14, 
    fontSize: 16 
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  button: { borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  loginText: {
    color: '#6b7280',
    fontSize: 14,
  },
  loginLink: {
    color: '#ec4899',
    fontSize: 14,
    fontWeight: '600',
  },
});