// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase 콘솔 > 프로젝트 설정 > 내 앱 > SDK 설정 및 구성
const firebaseConfig = {
  apiKey: "AIzaSyCWRXZcB9QB_KfrguhsNXaXIGT-soMCWFg",
  authDomain: "fashion-jiok.firebaseapp.com",
  projectId: "fashion-jiok",
  storageBucket: "fashion-jiok.firebasestorage.app",
  messagingSenderId: "682718938751",
  appId: "1:682718938751:android:12578c492b41e22a33a14a"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;