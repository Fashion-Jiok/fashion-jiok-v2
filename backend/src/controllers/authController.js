const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

// ============================================
// 1. 회원가입 (Signup)
// ============================================
exports.signup = async (req, res) => {
    console.log('📝 [Signup Request]:', req.body);

    // 프론트엔드에서 username, password 등을 보내줍니다.
    // DB에는 phone_number 컬럼이 있으므로, username 값을 phone_number에 넣습니다.
    const { username, password, name, age, job, location, phone } = req.body;

    // 전화번호가 별도로 오면 그걸 쓰고, 없으면 username(아이디)을 전화번호 대용으로 사용
    const phoneNumber = phone || username; 

    try {
        // 1. 중복 확인 (phone_number 컬럼 확인)
        const [existing] = await pool.query(
            `SELECT user_id FROM users WHERE phone_number = ?`,
            [phoneNumber]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: "이미 존재하는 ID(전화번호)입니다." });
        }

        // 2. 비밀번호 암호화
        let passwordHash = password;
        try {
            const salt = await bcrypt.genSalt(10);
            passwordHash = await bcrypt.hash(password, salt);
        } catch (e) {
            console.log("⚠️ 암호화 실패, 평문 저장");
        }

        // 3. DB 저장 (username 컬럼 제거 -> phone_number 사용)
        const [result] = await pool.query(
            `INSERT INTO users 
            (phone_number, password_hash, name, age, job, location, profile_completed, is_active)
            VALUES (?, ?, ?, ?, ?, ?, TRUE, TRUE)`,
            [phoneNumber, passwordHash, name, age || 20, job || 'Student', location || 'Seoul']
        );

        console.log(`✅ 회원가입 성공: ${name} (${phoneNumber})`);
        res.json({ success: true, userId: result.insertId });

    } catch (err) {
        console.error('❌ Signup Error:', err);
        res.status(500).json({ error: "회원가입 중 서버 오류가 발생했습니다." });
    }
};

// ============================================
// 2. 로그인 (Login)
// ============================================
exports.login = async (req, res) => {
    console.log('🔑 [Login Request]:', req.body);
    
    const { username, password } = req.body;
    
    // DB 컬럼에 맞춰 매핑 (입력받은 ID -> phone_number)
    const phoneNumber = username;

    try {
        // 1. 사용자 조회 (username 컬럼이 없으므로 phone_number로 조회)
        const [users] = await pool.query(
            `SELECT * FROM users WHERE phone_number = ?`,
            [phoneNumber]
        );

        if (users.length === 0) {
            console.log("❌ 사용자 없음");
            return res.status(401).json({ error: "존재하지 않는 사용자입니다." });
        }

        const user = users[0];

        // 2. 비밀번호 확인
        let isMatch = false;
        if (user.password_hash && user.password_hash.startsWith('$2b$')) {
            isMatch = await bcrypt.compare(password, user.password_hash);
        } else {
            isMatch = (password === user.password_hash);
        }

        if (!isMatch) {
            console.log("❌ 비밀번호 불일치");
            return res.status(401).json({ error: "비밀번호가 일치하지 않습니다." });
        }

        // 3. 로그인 성공
        console.log(`✅ 로그인 성공: ${user.name}`);
        res.json({
            success: true,
            user: {
                user_id: user.user_id,
                name: user.name,
                job: user.job,
                location: user.location
            }
        });

    } catch (err) {
        console.error('❌ Login Error:', err);
        res.status(500).json({ error: "로그인 중 서버 오류가 발생했습니다." });
    }
};