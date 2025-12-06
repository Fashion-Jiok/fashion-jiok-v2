// backend/src/controllers/authController.js
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

// ============================================
// 회원가입
// ============================================
exports.signup = async (req, res) => {
    console.log('📝 [Signup Request]:', req.body);
    
    const { username, password, name, phone, age, job, gender, location, education, bio } = req.body;

    // 입력 검증
    if (!username || !password || !name) {
        return res.status(400).json({ 
            success: false, 
            message: '아이디, 비밀번호, 이름은 필수입니다.' 
        });
    }

    if (!age) {
        return res.status(400).json({ 
            success: false, 
            message: '나이는 필수입니다.' 
        });
    }

    try {
        // 중복 아이디 체크
        const [existing] = await pool.query(
            'SELECT user_id FROM users WHERE username = ?', 
            [username]
        );
        
        if (existing.length > 0) {
            console.log('🚫 중복 아이디:', username);
            return res.status(409).json({ 
                success: false, 
                message: '이미 존재하는 아이디입니다.' 
            });
        }

        // 전화번호 중복 체크
        if (phone) {
            const [existingPhone] = await pool.query(
                'SELECT user_id FROM users WHERE phone_number = ?', 
                [phone]
            );
            
            if (existingPhone.length > 0) {
                console.log('🚫 중복 전화번호:', phone);
                return res.status(409).json({ 
                    success: false, 
                    message: '이미 등록된 전화번호입니다.' 
                });
            }
        }

        // 비밀번호 해싱
        const hashedPassword = await bcrypt.hash(password, 10);

        // ⭐️ password_hash 컬럼도 추가!
        const query = `
            INSERT INTO users (
                username, 
                password,
                password_hash,
                phone_number, 
                name, 
                age, 
                gender, 
                location, 
                job, 
                education, 
                bio, 
                profile_completed, 
                is_active
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, TRUE)
        `;
        
        const [result] = await pool.query(query, [
            username,
            hashedPassword,
            hashedPassword,  // password_hash에도 동일한 해시값 저장
            phone || null,
            name,
            parseInt(age),
            gender || 'M',
            location || null,
            job || null,
            education || null,
            bio || null
        ]);

        console.log('✅ 회원가입 성공:', username, '(ID:', result.insertId, ')');

        res.status(201).json({ 
            success: true, 
            message: '회원가입 성공!',
            user: {
                id: result.insertId,
                username,
                name
            }
        });

    } catch (error) {
        console.error('❌ Signup Error:', error);
        res.status(500).json({ 
            success: false, 
            message: '서버 오류가 발생했습니다.' 
        });
    }
};

// ============================================
// 로그인
// ============================================
exports.login = async (req, res) => {
    console.log('🔑 [Login Request]:', req.body);
    
    const { username, password } = req.body;

    // 입력 검증
    if (!username || !password) {
        return res.status(400).json({ 
            success: false, 
            message: '아이디와 비밀번호를 입력해주세요.' 
        });
    }

    try {
        // ⭐️ password 또는 password_hash 둘 다 확인
        const [rows] = await pool.query(
            `SELECT 
                user_id, 
                username, 
                password,
                password_hash,
                name, 
                age, 
                gender, 
                location, 
                job, 
                education, 
                bio, 
                phone_number,
                profile_completed
             FROM users 
             WHERE username = ? AND is_active = TRUE`, 
            [username]
        );

        if (rows.length === 0) {
            console.log('🚫 로그인 실패: 사용자 없음 -', username);
            return res.status(401).json({ 
                success: false, 
                message: '아이디 또는 비밀번호를 확인해주세요.' 
            });
        }

        const user = rows[0];

        // ⭐️ password 또는 password_hash 중 있는 것으로 비교
        const storedPassword = user.password || user.password_hash;
        const isPasswordValid = await bcrypt.compare(password, storedPassword);

        if (!isPasswordValid) {
            console.log('🚫 로그인 실패: 비밀번호 불일치 -', username);
            return res.status(401).json({ 
                success: false, 
                message: '아이디 또는 비밀번호를 확인해주세요.' 
            });
        }

        // 마지막 로그인 시간 업데이트
        await pool.query(
            'UPDATE users SET last_login = NOW() WHERE user_id = ?',
            [user.user_id]
        );

        // 프로필 이미지 조회
        const [images] = await pool.query(
            'SELECT image_url FROM user_images WHERE user_id = ? AND is_primary = TRUE',
            [user.user_id]
        );

        console.log('✅ 로그인 성공:', username);

        res.status(200).json({ 
            success: true, 
            message: '로그인 성공',
            user: {
                id: user.user_id,
                username: user.username,
                name: user.name,
                age: user.age,
                gender: user.gender,
                job: user.job,
                location: user.location,
                education: user.education,
                bio: user.bio,
                phone_number: user.phone_number,
                profile_completed: user.profile_completed,
                profile_image: images[0]?.image_url || null
            }
        });

    } catch (error) {
        console.error('❌ Login Error:', error);
        res.status(500).json({ 
            success: false, 
            message: '서버 오류가 발생했습니다.' 
        });
    }
};

// ============================================
// 전화번호 인증 코드 전송 (기존 기능 유지)
// ============================================
exports.sendVerificationCode = async (req, res) => {
    res.json({ success: true, message: '인증번호가 전송되었습니다.' });
};

// ============================================
// 인증 코드 확인 (기존 기능 유지)
// ============================================
exports.verifyCode = async (req, res) => {
    res.json({ success: true, message: '인증이 완료되었습니다.' });
};