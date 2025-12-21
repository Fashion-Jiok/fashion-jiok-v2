# Fashion Jiok
패션 스타일 분석 및 매칭 플랫폼

<br /> 


## 1. 프로젝트 개요 
본 프로젝트는 사용자의 패션 스타일을 AI 스타일 분류 모델로 정밀하게 분석하여 개인의 취향과 조화를 이루는 이성을 매칭하고, 

AI 에이전트가 대화 시작과 데이트 장소 추천까지 자연스럽게 지원하는 새로운 경험의 소개팅 플랫폼 개발을 목표로 합니다.

<br /> 

## 2. 프로젝트 목표
- AI 기반 정교한 패션 스타일 분석을 통한 사용자 취향에 최적화된 매칭 시스템 제공
- 개인의 스타일 취향과 라이프스타일을 공유하는 '취향 공동체' 형성
- 피상적인 프로필을 넘어 개인의 스타일과 개성을 반영한 만족도 높은 매칭 경험 구축

<br />

## 3. 주요 타겟층
- 패션피플: 패션에 관심 많은 유저
- 단순한 조건 만남이 아닌, '취향과 '스타일'이 맞는 사람을 찾고 싶은 사용자

<br /> 

## 4. 주요기능

### (1) AI Style 분석
#### AI 스타일 분류 모델 구축

### (2) 취향 기반 추천
#### [스타일 기반 사용자 탐색]
- 필터 조건 포함 사용자 목록 동적 로딩
- 카드 UI 내 좋아요/ 좋아요 취소/ 매칭 Aert 처리
#### [AI 추천 시스템]
- 사용자가 좋아요를 누른 스타일 분석(과반수 기준)
- 이성을 'AI 추천!' 배지로 우선 노출
#### [나를 찜 기능]
- 나를 좋아요한 사용자를 '나를 찜!' 배치로 노출
- 클릭 시 상세 모달 + 좋아요 기능 


### (3) AI 대화 지원
#### [Gemini 기반 대화 추천 기능]
- Gemini API를 사용해 다음 대화 멘트 추천
- 기존 대화 흐름을 분석해 다음에 추천 멘트 3개 자동 생성
- 프로필 정보 + 최근 메시지 N개를 AI 서버에 넘김
- 컨텍스트 기반 프롬프트 구성
- 추천 메시지를 클릭하면 입력창에 자동 삽입되는 UI 구현


### (4) 직관적 탐색 UX


<br />


## 5. AI 스타일 분류 모델 고도화 과정
### [Phase1]

- 무신사/ 핀터레스트 데이터 크롤링 및 데이터 라벨링, 데이터 구축
- 단순 Efficient- Net CNN 모델 시도 

### [Phase2]
- YOLO FashionPedia + CLIP


### [Phase3]
- YOLO + CLIP + Hybrid(NN + KNN)
- Gemini Api 연동으로 분석된 스타일 태그를 바탕으로 감성적인 멘트 생성 

<br />



## 5. [핵심 구현 기능 화면]
테스트 화면은 미드저니로 생성한 AI 이미지를 활용했습니다.

![Demo GIF](https://github.com/Fashion-Jiok/fashion-jiok-v2/blob/32747cfa70a71da38974ac3d799f6abc3263f4d0/static/AIstyle.gif?raw=true)




## 6. [파일 구조]

```
fashion-jiok/
├── .gitignore
├── android/
├── assets/
│   ├── adaptive-icon.png
│   ├── favicon.png
│   ├── icon.png
│   └── splash-icon.png
├── ios/
├── src/
│   ├── screens/
│   │   ├── Auth/
│   │   │   ├── LoginScreen.js
│   │   │   └── PhoneVerifyScreen.js
│   │   ├── Main/
│   │   │   ├── ExploreScreen.js
│   │   │   ├── MapScreen.js
│   │   │   ├── MatchesScreen.js
│   │   │   └── MyProfileScreen.js
│   │   └── Chat/
│   │       ├── ChatListScreen.js
│   │       └── ChatRoomScreen.js
│   ├── navigation/
│   │   ├── AppNavigator.js
│   │   ├── AuthNavigator.js
│   │   └── MainTabNavigator.js
│   ├── context/
│   │   └── AuthContext.js
│   ├── services/
│   │   └── firebase.js
│   └── constants/
│       └── styles.js
├── App.js
├── app.json
├── babel.config.js
├── google-services.json   
├── index.js
├── package.json
└── tailwind.config.js
```

**[실행방법]**

🚀백엔드와 프론트엔드는 각각 다른 폴더에서, 동시에 실행되어야 합니다.

**1️⃣ 터미널 1: 백엔드 실행 (서버 켜기)**
```
# 1. 터미널을 열고 백엔드 폴더로 이동
cd backend

# 2. 서버 실행
npm run dev
(성공 시: 🚀 서버가 실행되었습니다... 메시지가 뜸. 이 터미널은 켜두세요.)
```


**2️⃣ 터미널 2: 프론트엔드 실행 (앱 켜기 : expo 실행)**
**새로운 터미널 창(Tab)**을 열어서 진행하세요.


```
# 1. 프로젝트 최상위 폴더(FJ_new)로 이동
cd ..

# 2. 앱 실행
npx expo start -c

```

**3️⃣ 터미널 3:모델 실행**
**새로운 터미널 창(Tab)**을 열어서 진행하세요.
```
cd server

python app.py

```
✅ CLIP 로드 완료

🔄 남자 모델 로딩 시도 중...

✅ 남자 모델: LightStyleNet 구조로 로딩 성공!

🔄 여자 모델 로딩 시도 중...

✅ 여자 모델: StyleNet 구조로 로딩 성공!

-> 이렇게 나오면 모델 로드 성공!



