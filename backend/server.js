// server.js - fashionjiok DB용 (수정 완료)
require('dotenv').config(); 

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { pool } = require('./src/config/database');

const app = express();
app.use(cors());
app.use(bodyParser.json());

console.log('---------------------------------');
console.log('카카오 키 로드 성공:', process.env.KAKAO_REST_API_KEY ? 'O' : 'X');
console.log('---------------------------------');
// Gemini AI 설정
const apiKey = process.env.GEMINI_API_KEY;
let genAI;
if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('Gemini 키 로드 성공: O');
} else {
    console.log('Gemini 키 로드 성공: X');
}
const MODEL_NAME = "gemini-2.5-flash";
// ============================================
// API 1: 탐색 화면 - 사용자 목록 (좋아요 상태 포함)
// ============================================
app.get('/api/users/explore', async (req, res) => {
    const myId = parseInt(req.query.userId) || 1;
    
    try {
        const [users] = await pool.query(`
            SELECT 
                u.user_id as id,
                u.name,
                u.age,
                u.gender,
                u.location,
                u.job as style,
                img.image_url as image,
                FLOOR(RAND() * 30 + 70) as styleScore,
                JSON_ARRAY(u.job) as tags,
                -- ⭐️ 내가 이미 좋아요 눌렀는지 확인
                CASE WHEN l.like_id IS NOT NULL THEN 1 ELSE 0 END as isLiked
            FROM users u
            LEFT JOIN user_images img ON u.user_id = img.user_id AND img.is_primary = TRUE
            LEFT JOIN likes l ON l.from_user_id = ? AND l.to_user_id = u.user_id
            WHERE u.is_active = TRUE AND u.user_id != ?
            ORDER BY RAND()
            LIMIT 20
        `, [myId, myId]);
        
        console.log(`✅ [EXPLORE] ${users.length}명 조회 완료`);
        res.json(users);
    } catch (err) {
        console.error('❌ [EXPLORE] 에러:', err);
        res.status(500).json({ error: 'DB 조회 실패' });
    }
});

// ============================================
// API 2: 매칭 카드 - 추천 사용자 (나를 좋아한 사람 우선)
// ============================================
app.get('/api/matches/cards', async (req, res) => {
    const myId = parseInt(req.query.userId) || 1;
    
    try {
        // ⭐️ 1. 나를 좋아한 사람들 (상호 좋아요 아닌 경우만)
        const [likedMe] = await pool.query(`
            SELECT 
                u.user_id as id,
                u.name,
                u.age,
                u.gender,
                u.job as style,
                u.location,
                img.image_url as image,
                'liked_me' as type,
                FLOOR(RAND() * 30 + 70) as styleScore
            FROM users u
            JOIN likes l ON u.user_id = l.from_user_id
            LEFT JOIN user_images img ON u.user_id = img.user_id AND img.is_primary = TRUE
            WHERE l.to_user_id = ?
            -- 내가 아직 좋아요 안 누른 사람만
            AND NOT EXISTS (
                SELECT 1 FROM likes WHERE from_user_id = ? AND to_user_id = u.user_id
            )
            -- 이미 매칭된 사람 제외
            AND NOT EXISTS (
                SELECT 1 FROM chat_rooms 
                WHERE (user_id_1 = ? AND user_id_2 = u.user_id)
                   OR (user_id_1 = u.user_id AND user_id_2 = ?)
            )
        `, [myId, myId, myId, myId]);

        // ⭐️ 2. 랜덤 추천 (내가 좋아요 안 누르고, 나를 좋아요 안 한 사람)
        const [random] = await pool.query(`
            SELECT 
                u.user_id as id,
                u.name,
                u.age,
                u.gender,
                u.job as style,
                u.location,
                img.image_url as image,
                'random' as type,
                FLOOR(RAND() * 30 + 70) as styleScore
            FROM users u
            LEFT JOIN user_images img ON u.user_id = img.user_id AND img.is_primary = TRUE
            WHERE u.user_id != ?
            -- 내가 좋아요 안 누른 사람
            AND NOT EXISTS (
                SELECT 1 FROM likes WHERE from_user_id = ? AND to_user_id = u.user_id
            )
            -- 나를 좋아요 안 한 사람
            AND NOT EXISTS (
                SELECT 1 FROM likes WHERE from_user_id = u.user_id AND to_user_id = ?
            )
            -- 이미 매칭된 사람 제외
            AND NOT EXISTS (
                SELECT 1 FROM chat_rooms 
                WHERE (user_id_1 = ? AND user_id_2 = u.user_id)
                   OR (user_id_1 = u.user_id AND user_id_2 = ?)
            )
            ORDER BY RAND()
            LIMIT 20
        `, [myId, myId, myId, myId, myId]);

        console.log(`✅ [MATCHES] 나를 좋아한 사람: ${likedMe.length}명, 랜덤: ${random.length}명`);
        
        // ⭐️ 나를 좋아한 사람을 먼저 보여줌
        res.json([...likedMe, ...random]);
    } catch (err) {
        console.error('❌ [MATCHES] 에러:', err);
        res.status(500).send("DB Error");
    }
});

// ============================================
// API 3: 좋아요 보내기 (매칭 자동 생성)
// ============================================
app.post('/api/matches/like', async (req, res) => {
    const { myId, targetId } = req.body;
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // ⭐️ 1. 좋아요 저장 (중복 방지)
        await connection.query(
            `INSERT IGNORE INTO likes (from_user_id, to_user_id) VALUES (?, ?)`,
            [myId, targetId]
        );

        // ⭐️ 2. 상호 좋아요 확인
        const [mutual] = await connection.query(
            `SELECT like_id FROM likes WHERE from_user_id = ? AND to_user_id = ?`,
            [targetId, myId]
        );

        let isMatch = false;
        let roomId = null;

        if (mutual.length > 0) {
            isMatch = true;
            
            // ⭐️ 3. 채팅방 생성 (작은 ID를 user_id_1로)
            const user1 = Math.min(myId, targetId);
            const user2 = Math.max(myId, targetId);
            
            await connection.query(
                `INSERT INTO chat_rooms (user_id_1, user_id_2, last_message_at) 
                 VALUES (?, ?, NOW())
                 ON DUPLICATE KEY UPDATE last_message_at = NOW()`,
                [user1, user2]
            );

            // ⭐️ 4. 방 ID 가져오기
            const [room] = await connection.query(
                `SELECT room_id FROM chat_rooms 
                 WHERE user_id_1 = ? AND user_id_2 = ?`,
                [user1, user2]
            );
            
            roomId = room[0]?.room_id;

            console.log(`🎉 [MATCH] ${myId} ↔️ ${targetId} 매칭 성공! 방ID: ${roomId}`);
        }

        await connection.commit();
        
        console.log(`✅ [LIKE] ${myId} → ${targetId}, 매칭: ${isMatch}`);
        res.json({ success: true, isMatch, roomId });
        
    } catch (err) {
        await connection.rollback();
        console.error('❌ [LIKE] 에러:', err);
        res.status(500).json({ error: "Like Error" });
    } finally {
        connection.release();
    }
});

// ============================================
// API 4: 채팅 목록 (매칭된 사람들)
// ============================================
app.get('/api/chatlist', async (req, res) => {
    const userId = parseInt(req.query.userId) || 1;
    
    try {
        const [rows] = await pool.query(`
            SELECT 
                cr.room_id,
                cr.user_id_1,
                cr.user_id_2,
                -- 상대방 정보 추출
                CASE 
                    WHEN cr.user_id_1 = ? THEN u2.user_id
                    ELSE u1.user_id
                END as partner_id,
                CASE 
                    WHEN cr.user_id_1 = ? THEN u2.name
                    ELSE u1.name
                END as name,
                CASE 
                    WHEN cr.user_id_1 = ? THEN u2.age
                    ELSE u1.age
                END as age,
                CASE 
                    WHEN cr.user_id_1 = ? THEN img2.image_url
                    ELSE img1.image_url
                END as image,
                FLOOR(RAND() * 30 + 70) as styleScore,
                msg.message_content as lastMessage,
                msg.created_at as lastMessageTime,
                -- ⭐️ 메시지가 없으면 "새 매칭"
                CASE WHEN msg.message_content IS NULL THEN 1 ELSE 0 END as isNew
            FROM chat_rooms cr
            LEFT JOIN users u1 ON cr.user_id_1 = u1.user_id
            LEFT JOIN users u2 ON cr.user_id_2 = u2.user_id
            LEFT JOIN user_images img1 ON u1.user_id = img1.user_id AND img1.is_primary = TRUE
            LEFT JOIN user_images img2 ON u2.user_id = img2.user_id AND img2.is_primary = TRUE
            LEFT JOIN (
                SELECT room_id, message_content, created_at
                FROM chat_messages
                WHERE message_id IN (
                    SELECT MAX(message_id) FROM chat_messages GROUP BY room_id
                )
            ) msg ON cr.room_id = msg.room_id
            WHERE (cr.user_id_1 = ? OR cr.user_id_2 = ?)
            AND cr.is_active = TRUE
            ORDER BY isNew DESC, COALESCE(msg.created_at, cr.created_at) DESC
        `, [userId, userId, userId, userId, userId, userId]);

        // ⭐️ timeAgo 계산
        const withTimeAgo = rows.map(row => ({
            ...row,
            id: row.room_id,
            timeAgo: row.lastMessageTime ? getTimeAgo(row.lastMessageTime) : '새 매칭'
        }));

        console.log(`✅ [CHATLIST] ${withTimeAgo.length}개 조회 (새 매칭: ${withTimeAgo.filter(r => r.isNew).length}개)`);
        res.json(withTimeAgo);
        
    } catch (err) {
        console.error('❌ [CHATLIST] 에러:', err);
        res.status(500).send("ChatList Error");
    }
});

// ============================================
// API 5: 메시지 전송
// ============================================
app.post('/api/chat/send', async (req, res) => {
    const { roomId, senderId, text } = req.body;
    
    try {
        await pool.query(
            `INSERT INTO chat_messages (room_id, sender_id, message_content) 
             VALUES (?, ?, ?)`,
            [roomId, senderId, text]
        );
        
        // 채팅방 업데이트
        await pool.query(
            `UPDATE chat_rooms SET last_message_at = NOW() WHERE room_id = ?`,
            [roomId]
        );

        console.log(`✅ [MESSAGE] 전송 완료: 방${roomId}`);
        res.json({ success: true });
        
    } catch (err) {
        console.error('❌ [MESSAGE] 에러:', err);
        res.status(500).send("Message Send Error");
    }
});

// ============================================
// API 6: 메시지 조회
// ============================================
app.get('/api/chat/messages', async (req, res) => {
    const roomId = req.query.roomId;
    
    try {
        const [rows] = await pool.query(
            `SELECT 
                message_id as id,
                sender_id,
                message_content as text,
                created_at as timestamp
             FROM chat_messages 
             WHERE room_id = ? 
             ORDER BY created_at ASC`,
            [roomId]
        );
        
        console.log(`✅ [MESSAGES] ${rows.length}개 조회`);
        res.json(rows);
        
    } catch (err) {
        console.error('❌ [MESSAGES] 에러:', err);
        res.status(500).send("Get Messages Error");
    }
});

// ============================================
// API 7: 지도 - 주변 사용자
// ============================================
app.get('/api/users/locations', async (req, res) => {
    const { userId, lat, lon } = req.query;
    
    try {
        const [users] = await pool.query(`
            SELECT 
                u.user_id,
                u.name,
                u.gender,
                u.job as primary_style,
                loc.latitude,
                loc.longitude,
                loc.location_name
            FROM users u
            JOIN user_locations loc ON u.user_id = loc.user_id
            WHERE u.user_id != ?
            AND u.is_active = TRUE
            LIMIT 20
        `, [userId || 1]);

        console.log(`✅ [MAP] ${users.length}명 조회`);
        res.json(users);
        
    } catch (err) {
        console.error('❌ [MAP] 에러:', err);
        res.status(500).send("Location Error");
    }
});

// ============================================
// 헬퍼 함수
// ============================================
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return '방금 전';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
}

// ============================================
// 서버 실행
// ============================================
const PORT = process.env.PORT || 3000;

// ============================================
// API 8: AI 대화 추천 (Gemini)
// ============================================
app.post('/api/ai/suggestions', async (req, res) => {
    console.log('--- 🤖 AI 추천 요청 받음 ---');
    console.log('요청 데이터:', JSON.stringify(req.body));  // ⭐️ 추가
    
    const { userProfile, partnerProfile, chatHistory } = req.body;

    if (!genAI) {
        return res.status(503).json({ error: 'AI 서비스를 사용할 수 없습니다.' });
    }

    try {
        const profileInfo = JSON.stringify(userProfile || {});
        const partnerInfo = JSON.stringify(partnerProfile || {});
        const historyText = chatHistory && chatHistory.length > 0
            ? chatHistory.slice(-8).map(msg => `${msg.role || 'user'}: ${msg.text}`).join('\n')
            : '아직 대화 없음';

        const prompt = `당신은 소개팅 어플을 사용하는 사용자의 대화를 돕는 센스있고 전문적인 AI 어시스턴트입니다. 

상대방: ${partnerInfo}
대화내역: ${historyText}

위 정보를 바탕으로 대화를 이어나갈 수 있도록 사용자에게 추천할 3개의 짧은 다음 메시지를 각 줄마다 하나씩 작성해주세요.
각 메시지는 한 문장으로 작성하고, 줄바꿈으로 구분해주세요.`;

        console.log('📝 프롬프트 전송 중...');  // ⭐️ 추가
        
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        console.log('📥 Gemini 원본 응답:', text);  // ⭐️ 추가 - 이게 중요!

        const suggestions = text.trim().split('\n').filter(s => s.trim()).slice(0, 3);
        
        console.log('🤖 AI 추천 완료:', suggestions);
        res.json({ suggestions });

    } catch (error) {
        console.error('❌ AI 오류:', error);
        res.status(500).json({ error: 'AI 처리 중 오류 발생' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 서버 실행됨 (포트: ${PORT})`);
    console.log(`📊 DB: fashionjiok`);
});