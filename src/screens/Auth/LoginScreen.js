import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('phone');

  const handleSendCode = () => {
    if (phone.length >= 10) {
      setStep('code');
    }
  };

  const handleVerifyCode = () => {
    if (code.length === 6) {
      // 인증 완료 -> Main 화면으로 바로 이동
      navigation.replace('Onboarding');
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
          {/* Logo & Title */}
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

          {/* Form */}
          <View style={styles.form}>
            {step === 'phone' ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>전화번호</Text>
                  <TextInput
                    placeholder="010-0000-0000"
                    placeholderTextColor="#9ca3af" // 연한 회색
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    style={styles.input}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleSendCode}
                  disabled={phone.length < 10}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={phone.length >= 10 ? ['#ec4899', '#9333ea'] : ['#e5e7eb', '#e5e7eb']}
                    style={styles.button}
                  >
                    <Text style={[
                      styles.buttonText, 
                      phone.length < 10 && styles.disabledButtonText
                    ]}>인증번호 받기</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>인증번호</Text>
                  <TextInput
                    placeholder="6자리 인증번호"
                    placeholderTextColor="#9ca3af"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={code}
                    onChangeText={setCode}
                    style={[styles.input, styles.codeInput]}
                  />
                  <Text style={styles.hint}>
                    {phone}로 인증번호를 전송했습니다
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleVerifyCode}
                  disabled={code.length !== 6}
                  activeOpacity={0.8}
                  style={styles.buttonMargin}
                >
                  <LinearGradient
                    colors={code.length === 6 ? ['#ec4899', '#9333ea'] : ['#e5e7eb', '#e5e7eb']}
                    style={styles.button}
                  >
                    <Text style={[
                      styles.buttonText,
                      code.length !== 6 && styles.disabledButtonText
                    ]}>확인</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setStep('phone')}
                  style={styles.backButton}
                  activeOpacity={0.6}
                >
                  <Text style={styles.backButtonText}>번호 다시 입력</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Terms */}
          <View style={styles.terms}>
            <Text style={styles.termsText}>
              가입하면 Fashion Jiok의{'\n'}이용약관 및 개인정보 처리방침에 동의하게 됩니다
            </Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', 
  },
  backgroundContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    marginBottom: 24,
    // 그림자(Box) 제거됨
  },
  logoImage: {
    width: 180, // 로고 크기 확대 
    height: 180,
    borderRadius: 75, // width/2
    backgroundColor: '#f3f4f6',
  },
  title: {
    color: '#000000', // 텍스트 블랙 변경
    fontSize: 36,
    fontWeight: '300',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#6b7280', // 진한 회색 (Gray-500)
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    color: '#374151', 
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f9fafb', 
    borderWidth: 1,
    borderColor: '#e5e7eb', 
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#000000', 
    fontSize: 16,
    height: 52,
  },
  codeInput: {
    textAlign: 'center',
    letterSpacing: 4,
    fontSize: 20,
    fontWeight: '600',
  },
  hint: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 8,
  },
  button: {
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#9ca3af',
  },
  buttonMargin: {
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#6b7280',
    textAlign: 'center',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  terms: {
    marginTop: 48,
  },
  termsText: {
    color: '#9ca3af', // 연한 회색
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});