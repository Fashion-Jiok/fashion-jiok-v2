// services/api.js
// ⭐️ 한 곳에서만 IP 주소를 관리합니다!

// 1️⃣ 여기만 수정하세요!
const SERVER_IP = '172.30.1.61'; // ← ipconfig에서 확인한 IP로 변경
const SERVER_PORT = '3000';
export const SERVER_URL = `http://${SERVER_IP}:${SERVER_PORT}`;

// ============================================
// 사용자 탐색 API
// ============================================
export const fetchExploreUsers = async (userId = 1) => {  // ← userId 파라미터 추가
  try {
    const url = `${SERVER_URL}/api/users/explore?userId=${userId}`;  // ← userId 포함
    console.log('📡 데이터 요청 중:', url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ 탐색 데이터 로드 완료:', data.length, '명');
    return data;
  } catch (error) {
    console.error('❌ 네트워크 에러:', error);
    throw error;
  }
};

// ============================================
// 매칭 카드 API
// ============================================
export const fetchMatchCards = async (userId = 1) => {
  try {
    const url = `${SERVER_URL}/api/matches/cards?userId=${userId}`;
    console.log('🔗 [MATCHES] 요청 URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📝 [MATCHES] 응답 데이터:', data.length, '명');
    return data;
  } catch (error) {
    console.error('❌ [MATCHES] 에러:', error);
    throw error;
  }
};

// ============================================
// 좋아요 보내기 API
// ============================================
export const sendLike = async (myId, targetId) => {
  try {
    console.log(`💕 [MATCHES] 좋아요 보내기: ${myId} → ${targetId}`);
    
    const response = await fetch(`${SERVER_URL}/api/matches/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ myId, targetId })
    });
    
    const result = await response.json();
    console.log('📝 [MATCHES] 좋아요 결과:', result);
    return result;
  } catch (error) {
    console.error('❌ [MATCHES] 좋아요 에러:', error);
    throw error;
  }
};

// ============================================
// 채팅 목록 API
// ============================================
export const fetchChatList = async (userId = 1) => {
  try {
    const url = `${SERVER_URL}/api/chatlist?userId=${userId}`;
    console.log('📡 채팅 목록 요청 중:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ 채팅 목록 로드 완료:', data.length, '개');
    return data;
  } catch (error) {
    console.error('❌ [CHATLIST] 에러:', error);
    throw error;
  }
};

// ============================================
// 채팅 메시지 조회 API
// ============================================
export const fetchChatMessages = async (roomId) => {
  try {
    const url = `${SERVER_URL}/api/chat/messages?roomId=${roomId}`;
    console.log('📡 메시지 요청 중:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ 메시지 로드 완료:', data.length, '개');
    return data;
  } catch (error) {
    console.error('❌ [MESSAGES] 에러:', error);
    throw error;
  }
};

// ============================================
// 메시지 전송 API
// ============================================
export const sendMessage = async (roomId, senderId, text) => {
    try {
        const response = await fetch(`${SERVER_URL}/api/chat/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId, senderId, text })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('sendMessage 에러:', error);
        throw error;
    }
};
// ============================================
// 5. 메시지 조회 (⭐️ 새로 추가)
// ============================================
export const fetchMessages = async (roomId) => {
    try {
        const response = await fetch(`${SERVER_URL}/api/chat/messages?roomId=${roomId}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('fetchMessages 에러:', error);
        throw error;
    }
};
// ============================================
// 지도 사용자 위치 API
// ============================================
export const fetchUserLocations = async (userId = 1, lat, lon) => {
  try {
    const url = `${SERVER_URL}/api/users/locations?userId=${userId}&lat=${lat}&lon=${lon}`;
    console.log('[MAP] 요청 URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('[MAP] 응답 데이터:', data.length, '명');
    return data;
  } catch (error) {
    console.error('[MAP] 에러:', error);
    throw error;
  }
};

// ============================================
// AI 대화 제안 API (Mock - 추후 구현)
// ============================================
export const getAiSuggestions = async (context) => {
  try {
    // TODO: 실제 AI API 연결
    console.log('🤖 AI 제안 요청:', context);
    
    // 임시 Mock 데이터
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [
      "안녕하세요! 프로필 사진이 정말 멋지네요 😊",
      "같은 지역에 계시네요! 자주 가는 카페 있으세요?",
      `${context.otherUserId}님의 스타일이 정말 좋아 보여요!`
    ];
  } catch (error) {
    console.error('❌ [AI] 에러:', error);
    return ["안녕하세요!", "만나서 반갑습니다!"];
  }
};