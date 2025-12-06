// src/screens/Auth/OnboardingScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function OnboardingScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(0);

  const onboardingSteps = [
    {
      icon: '🤖',
      title: 'AI 스타일 분석',
      description: '당신만의 패션 스타일을\nAI가 분석해드립니다',
    },
    {
      icon: '👗',
      title: '스타일 매칭',
      description: '원하는 취향을 가진\n사람들을 만나보세요',
    },
    {
      icon: '💬',
      title: '자연스러운 대화',
      description: 'AI 대화 추천으로\n 더 쉽게 대화를 시작하세요',
    },
  ];

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // 온보딩 완료 - Main(HomeScreen)으로 이동
      navigation.navigate('HomeLoading');
    }
  };

  const handleSkip = () => {
    // 건너뛰기 - 바로 Main(HomeScreen)으로 이동
    navigation.navigate('HomeLoading');
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://i.pinimg.com/1200x/8d/ad/12/8dad1270b17a7a983df87b3813ab08fa.jpg' }}
        style={styles.background}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
          style={styles.gradient}
        >
          {/* Skip Button */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>건너뛰기</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.stepContent}>
              <Text style={styles.icon}>
                {onboardingSteps[currentStep].icon}
              </Text>
              <Text style={styles.title}>
                {onboardingSteps[currentStep].title}
              </Text>
              <Text style={styles.description}>
                {onboardingSteps[currentStep].description}
              </Text>
            </View>

            {/* Indicators */}
            <View style={styles.indicators}>
              {onboardingSteps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentStep && styles.indicatorActive,
                  ]}
                />
              ))}
            </View>

            {/* Next Button */}
            <TouchableOpacity
              onPress={handleNext}
              activeOpacity={0.8}
              style={styles.nextButton}
            >
              <LinearGradient
                colors={['#ffffff', '#f0f0f0']}
                style={styles.nextButtonGradient}
              >
                <Text style={styles.nextButtonText}>
                  {currentStep === onboardingSteps.length - 1
                    ? '시작하기'
                    : '다음'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    alignItems: 'flex-end',
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 60,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 24,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  indicatorActive: {
    width: 24,
    backgroundColor: '#ffffff',
  },
  nextButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});