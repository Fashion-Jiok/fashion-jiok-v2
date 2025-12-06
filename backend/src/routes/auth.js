// backend/src/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// ============================================
// 기존 전화번호 인증 API (유지)
// ============================================
//router.post('/send-code', authController.sendVerificationCode);
//router.post('/verify-code', authController.verifyCode);

// ============================================
// 새로운 ID/Password 인증 API
// ============================================
router.post('/signup', authController.signup);
router.post('/login', authController.login);

module.exports = router;