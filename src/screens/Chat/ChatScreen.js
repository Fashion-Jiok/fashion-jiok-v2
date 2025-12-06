import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Image,
  KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet,
  Modal, Alert, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Send, Sparkles, Image as ImageIcon, Smile, Heart } from 'lucide-react-native';

// ⭐️ API 임포트 추가
import { getAiSuggestions, sendMessage, fetchMessages } from '../../services/api';

const { width } = Dimensions.get('window');
const MY_USER_ID = 1;

export default function ChatScreen({ navigation, route }) {
  const { matchData: initialMatchData, roomId: initialRoomId, otherUserId } = route.params || {};
  
  const matchData = initialMatchData || {
    userId: otherUserId || "opponentUserId_Test",
    name: "지우",
    age: 26,
    image: "https://images.unsplash.com/photo-1696435552024-5fc45acf98c4",
    bio: "소개가 없습니다",
    job: "직업 정보 없음"
  };

  const [currentRoomId, setCurrentRoomId] = useState(initialRoomId);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false); // ⭐️ 추가

  // ⭐️ 메시지 불러오기
  useEffect(() => {
    if (currentRoomId) {
      loadMessages();
    }
    fetchOpeningSuggestions();
  }, [currentRoomId]);

  const loadMessages = async () => {
    if (!currentRoomId) return;
    
    setIsLoadingMessages(true);
    try {
      const data = await fetchMessages(currentRoomId);
      
      const formattedMessages = data.map(msg => ({
        id: msg.id,
        text: msg.text,
        sender: msg.sender_id === MY_USER_ID ? 'user' : 'other',
        timestamp: new Date(msg.timestamp).toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }));
      
      setMessages(formattedMessages);
      console.log(`✅ [CHAT] ${formattedMessages.length}개 메시지 로드 완료`);
      
    } catch (error) {
      console.error('❌ [CHAT] 메시지 로드 실패:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const fetchOpeningSuggestions = async () => {
    setIsLoadingSuggestions(true);
    setShowAISuggestions(true);

    const context = {
      userProfile: { id: MY_USER_ID },
      partnerProfile: {
        id: matchData.userId,
        name: matchData.name,
        age: matchData.age
      },
      chatHistory: messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        text: msg.text
      }))
    };

    try {
      const suggestions = await getAiSuggestions(context);
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error("AI 추천 로드 실패:", error);
      setAiSuggestions(["날씨가 좋네요!", "취미가 무엇인가요?"]);
    }
    
    setIsLoadingSuggestions(false);
  };

  const handleSend = async (text) => {
    const messageText = text || inputText;
    if (!messageText.trim()) return;
    if (!currentRoomId) {
      console.error('❌ [CHAT] roomId가 없습니다!');
      return;
    }

    const tempMessage = {
      id: `temp-${Date.now()}`,
      text: messageText,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, tempMessage]);
    setInputText('');
    setShowAISuggestions(false);
    
    try {
      await sendMessage(currentRoomId, MY_USER_ID, messageText);
      console.log('✅ [CHAT] 메시지 전송 완료');
      await loadMessages();
      
      if (navigation.setParams) {
        navigation.setParams({ refresh: Date.now() });
      }
      
    } catch (error) {
      console.error('❌ [CHAT] 메시지 전송 실패:', error);
      setMessages(messages.filter(m => m.id !== tempMessage.id));
    }
  };

  const renderMessage = ({ item }) => (
    <View style={{
      flexDirection: 'row',
      marginBottom: 16,
      justifyContent: item.sender === 'user' ? 'flex-end' : 'flex-start'
    }}>
      <View style={{
        maxWidth: '75%',
        alignItems: item.sender === 'user' ? 'flex-end' : 'flex-start'
      }}>
        {item.sender === 'user' ? (
          <LinearGradient
            colors={['#ec4899', '#9333ea']}
            style={{ borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 }}
          >
            <Text style={{ color: '#ffffff', fontSize: 14 }}>{item.text}</Text>
          </LinearGradient>
        ) : (
          <View style={{
            backgroundColor: '#ffffff',
            borderWidth: 1,
            borderColor: '#e5e7eb',
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 12
          }}>
            <Text style={{ color: '#111827', fontSize: 14 }}>{item.text}</Text>
          </View>
        )}
        <Text style={{
          color: '#9ca3af',
          fontSize: 12,
          marginTop: 4,
          textAlign: item.sender === 'user' ? 'right' : 'left'
        }}>
          {item.timestamp}
        </Text>
      </View>
    </View>
  );

  const renderAISuggestions = () => {
    if (!showAISuggestions) return null;

    if (isLoadingSuggestions) {
      return (
        <View style={{
          backgroundColor: '#faf5ff',
          borderWidth: 1,
          borderColor: '#e9d5ff',
          borderRadius: 16,
          padding: 16,
          marginTop: 16,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 100
        }}>
          <ActivityIndicator color="#a855f7" />
          <Text style={{ color: '#7c3aed', fontSize: 14, marginTop: 8 }}>
            AI가 대화를 제안 중입니다...
          </Text>
        </View>
      );
    }

    if (aiSuggestions.length === 0) {
      return null;
    }

    return (
      <View style={{
        backgroundColor: '#faf5ff',
        borderWidth: 1,
        borderColor: '#e9d5ff',
        borderRadius: 16,
        padding: 16,
        marginTop: 16
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Sparkles color="#a855f7" size={16} />
            <Text style={{ color: '#6b21a8', fontSize: 14 }}>AI 대화 제안</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowAISuggestions(false)}
            style={{ padding: 4 }}
          >
            <Text style={{ color: '#a855f7', fontSize: 18, fontWeight: '300' }}>✕</Text>
          </TouchableOpacity>
        </View>

        {aiSuggestions.map((suggestion, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => setInputText(suggestion)}
            style={{
              backgroundColor: '#ffffff',
              borderWidth: 1,
              borderColor: '#e9d5ff',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginBottom: 8
            }}
            activeOpacity={0.7}
          >
            <Text style={{ color: '#374151', fontSize: 14 }}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          onPress={fetchOpeningSuggestions}
          style={{ marginTop: 4, alignSelf: 'center' }}
          activeOpacity={0.7}
        >
          <Text style={{ color: '#a855f7', fontSize: 12 }}>🔄 다시 추천받기</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#ffffff' }}
    >
      {/* Header */}
      <View style={{
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        padding: 16,
        paddingTop: 48
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft color="#000000" size={24} />
          </TouchableOpacity>
          
          {/* ⭐️ 프로필 사진 터치 가능하게 */}
          <TouchableOpacity onPress={() => setShowProfileModal(true)}>
            <Image
              source={{ uri: matchData.image }}
              style={{ width: 40, height: 40, borderRadius: 20 }}
            />
          </TouchableOpacity>
          
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#111827', fontWeight: '500', fontSize: 16 }}>
              {matchData.name}, {matchData.age}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      {isLoadingMessages ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#ec4899" />
          <Text style={{ marginTop: 10, color: '#6b7280' }}>대화 불러오는 중...</Text>
        </View>
      ) : (
        <FlatList
          data={[...messages].reverse()}
          renderItem={renderMessage}
          keyExtractor={item => item.id.toString()}
          style={{ flex: 1, backgroundColor: '#f9fafb' }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
          inverted
          ListHeaderComponent={renderAISuggestions()}
        />
      )}

      {/* ⭐️ 프로필 모달 */}
      <Modal
        visible={showProfileModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowProfileModal(false)}
        >
          <View style={styles.modalContent}>
            <Image 
              source={{ uri: matchData.image }} 
              style={styles.profileImage}
            />
            <Text style={styles.modalName}>
              {matchData.name}, {matchData.age}
            </Text>
            <Text style={styles.modalInfo}>
              직업: {matchData.job || '정보 없음'}
            </Text>
            <Text style={styles.modalBio}>
              {matchData.bio || '소개가 없습니다'}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalBtnClose}
                onPress={() => setShowProfileModal(false)}
              >
                <Text style={styles.modalBtnCloseText}>닫기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Input */}
      <View style={{
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        padding: 13,
        paddingBottom: 30
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity>
            <ImageIcon color="#9ca3af" size={24} />
          </TouchableOpacity>
          
          <View style={{
            flex: 1,
            backgroundColor: '#f3f4f6',
            borderWidth: 1,
            borderColor: '#e5e7eb',
            borderRadius: 20,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16
          }}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="메시지를 입력하세요..."
              placeholderTextColor="#9ca3af"
              style={{ flex: 1, paddingVertical: 8, color: '#111827' }}
            />
            <TouchableOpacity>
              <Smile color="#9ca3af" size={20} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            onPress={() => handleSend()}
            disabled={!inputText.trim()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={inputText.trim() ? ['#ec4899', '#9333ea'] : ['#e5e7eb', '#e5e7eb']}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Send color="white" size={20} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {messages.length > 0 && !showAISuggestions && (
          <TouchableOpacity
            onPress={() => setShowAISuggestions(true)}
            style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Sparkles color="#a855f7" size={12} />
            <Text style={{ color: '#a855f7', fontSize: 12 }}>AI 대화 제안</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // ⭐️ Modal 스타일
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
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    backgroundColor: '#f0f0f0',
  },
  modalName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  modalBio: {
    fontSize: 13,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  modalBtnClose: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  modalBtnCloseText: {
    color: '#666',
    fontWeight: '600',
  },
});