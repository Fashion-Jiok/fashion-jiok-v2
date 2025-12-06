// src/services/dataFetcher.js

// Firebase 초기화 설정 파일 경로에 맞게 수정해주세요.
import { db } from '../firebaseConfig'; 
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

// --- (주의: 이 코드를 사용하려면 src/firebaseConfig.js가 있어야 합니다.) ---

/**
 * 👩‍💼 사용자 프로필 정보를 가져오는 함수
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} 사용자 프로필 데이터
 */
export async function fetchUserProfile(userId) {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      // 서버에서 userProfile.id를 사용하기 때문에 명시적으로 추가
      return { id: userId, ...userDocSnap.data() }; 
    } else {
      console.warn(`User profile not found for ID: ${userId}`);
      // 데이터가 없을 경우 서버 오류를 막기 위해 기본 객체를 반환
      return { id: userId, stylePreference: "Unknown", recentActivity: "None" }; 
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    // 오류 발생 시 서버가 멈추는 것을 방지
    return { id: userId, error: error.message }; 
  }
}

/**
 * 💬 최근 채팅 이력을 가져오는 함수
 * @param {string} chatId - 채팅방 ID (예: userId)
 * @param {number} count - 가져올 메시지 수
 * @returns {Promise<Array<Object>>} 메시지 배열
 */
export async function fetchChatHistory(chatId, count = 10) {
  try {
    const messagesCollectionRef = collection(db, 'chats', chatId, 'messages');
    
    // 시간순으로 가져오기
    const q = query(messagesCollectionRef, orderBy('createdAt', 'asc'), limit(count));
    
    const querySnapshot = await getDocs(q);
    const history = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      history.push({ 
        id: doc.id, 
        sender: data.sender || 'user', // 서버에서 sender 필드 사용함
        text: data.text || 'No message content' 
      });
    });

    return history; 

  } catch (error) {
    console.error('Error fetching chat history:', error);
    return []; // 오류 발생 시 빈 배열 반환하여 서버 오류 방지
  }
}