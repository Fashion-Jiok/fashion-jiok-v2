// database.js - 완전한 버전
require('dotenv').config(); 
const mysql = require('mysql2');

// ⭐️ 1. Pool 생성 (이 부분이 빠져있었습니다!)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fashionjiok',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Promise 래퍼 생성
const promisePool = pool.promise();

// 연결 테스트
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ MySQL 연결 실패:', err.message);
    console.error('📝 .env 파일 설정을 확인하세요:');
    console.error('   DB_HOST=localhost');
    console.error('   DB_USER=root');
    console.error('   DB_PASSWORD=your_password');
    console.error('   DB_NAME=fashionjiok');
  } else {
    console.log('✅ MySQL fashionjiok 연결 성공!');
    connection.release();
  }
});

module.exports = { pool: promisePool };