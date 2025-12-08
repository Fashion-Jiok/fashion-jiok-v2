// services/api.js
// ⭐ IP 주소는 여기 한 곳에서만 관리!
const SERVER_IP = '172.30.1.55';
const SERVER_PORT = '3000';
export const SERVER_URL = `http://${SERVER_IP}:${SERVER_PORT}`;
export const fetchExploreUsers = async (userId = 1, styles = []) => {
  try {
    // ✅ 배열을 콤마로 연결해서 전송
    const styleQuery = styles.length > 0 
      ? `&style=${encodeURIComponent(styles.join(','))}` 
      : "";
    const url = `${SERVER_URL}/api/users/explore?userId=${userId}${styleQuery}`;

    console.log('📡 [EXPLORE] 요청 URL:', url);

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

    const data = await response.json();
    console.log(`✅ [EXPLORE] 사용자 ${data.length}명 로드 완료`);
    return data;
  } catch (error) {
    console.error('❌ [EXPLORE] 네트워크 에러:', error);
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
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    console.log('📝 [MATCHES] 응답:', data.length, '명');
    return data;
  } catch (error) {
    console.error('❌ [MATCHES] 에러:', error);
    throw error;
  }
};

// ============================================
// 좋아요 보내기
// ============================================
export const sendLike = async (myId, targetId) => {
  try {
    console.log(`💕 [LIKE] ${myId} → ${targetId}`);
    
    const response = await fetch(`${SERVER_URL}/api/matches/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ myId, targetId })
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ [LIKE] 에러:', error);
    throw error;
  }
};

// ============================================
// 채팅 목록
// ============================================
export const fetchChatList = async (userId = 1) => {
  try {
    const url = `${SERVER_URL}/api/chatlist?userId=${userId}`;
    console.log('📡 [CHATLIST] 요청:', url);
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    
    const data = await response.json();
    console.log('📨 [CHATLIST] 로드 완료:', data.length);
    return data;
  } catch (error) {
    console.error('❌ [CHATLIST] 에러:', error);
    throw error;
  }
};

// ============================================
// 메시지 조회
// ============================================
export const fetchChatMessages = async (roomId) => {
  try {
    const response = await fetch(`${SERVER_URL}/api/chat/messages?roomId=${roomId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ [MESSAGES] 에러:', error);
    throw error;
  }
};

// ============================================
// 메시지 전송
// ============================================
export const sendMessage = async (roomId, senderId, text) => {
  try {
    const response = await fetch(`${SERVER_URL}/api/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, senderId, text })
    });
    return await response.json();
  } catch (error) {
    console.error('❌ sendMessage 에러:', error);
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
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    console.log('[MAP] 로드 완료:', data.length);
    return data;
  } catch (error) {
    console.error('[MAP] 에러:', error);
    throw error;
  }
};

// ============================================
// AI 대화 추천 (Gemini)
// ============================================
export const getAiSuggestions = async (context) => {
  try {
    console.log('🤖 [AI] 요청:', context);
    
    const response = await fetch(`${SERVER_URL}/api/ai/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(context)
    });

    const data = await response.json();
    return data.suggestions || [];
  } catch (error) {
    console.error('❌ [AI] 에러:', error);
    return ["안녕하세요!", "반갑습니다!"];
  }
};

// ============================================
// 🔐 인증 API
// ============================================
export const loginUser = async (username, password) => {
  try {
    const response = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return await response.json();
  } catch (error) {
    console.error('Login API Error:', error);
    return { success: false, message: '네트워크 오류' };
  }
};

export const signupUser = async (userData) => {
  try {
    const response = await fetch(`${SERVER_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '회원가입 실패');
    }
    return await response.json();

  } catch (error) {
    console.error('Signup API Error:', error);
    throw error;
  }
};
export const fetchMessages = fetchChatMessages;

