# SQL Helper

SQL 쿼리 포맷팅과 분석을 도와주는 웹 애플리케이션입니다.

## 주요 기능

### 1. SQL 포맷팅
- 정적 포맷팅: 로그인 없이 사용 가능
- AI 기반 포맷팅: 로그인 필요
  - 다양한 SQL 방언 지원 (PostgreSQL, MySQL, SQLite, T-SQL, PL/SQL)
  - GPT-3.5/4를 활용한 지능형 포맷팅

### 2. 토큰 사용량 관리
- 일일 토큰 사용량 제한 (기본 10,000 토큰)
- 사용자별 커스텀 토큰 제한 설정 가능
- DB 기반 사용량 추적
  - 요청 토큰과 응답 토큰 모두 기록
  - 일별 사용량 집계

### 3. 사용자 인증
- NextAuth.js를 활용한 인증 시스템
- 이메일/비밀번호 기반 로그인
- 세션 기반 인증 관리

## 기술 스택

- **프레임워크**: Next.js 14
- **언어**: TypeScript
- **데이터베이스**: PostgreSQL
- **인증**: NextAuth.js
- **AI**: OpenAI API (GPT-3.5/4)
- **스타일링**: Tailwind CSS

## 프로젝트 구조

```
src/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API 라우트
│   │   ├── ai/           # AI 관련 API
│   │   └── format/       # SQL 포맷팅 API
│   └── page.tsx          # 메인 페이지
├── components/           # React 컴포넌트
├── lib/                  # 유틸리티 함수
│   ├── ai.ts            # AI 관련 로직
│   ├── auth.ts          # 인증 관련 로직
│   └── sql/             # SQL 관련 로직
└── types/               # TypeScript 타입 정의
```

## 환경 설정

1. 환경 변수 설정
```env
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

2. 데이터베이스 스키마
```sql
-- users 테이블
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  daily_token_limit INTEGER DEFAULT 10000,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- token_usage 테이블
CREATE TABLE token_usage (
  user_id UUID REFERENCES users(id),
  usage_date DATE,
  request_tokens INTEGER DEFAULT 0,
  response_tokens INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, usage_date)
);
```

## 실행 방법

1. 의존성 설치
```bash
npm install
```

2. 개발 서버 실행
```bash
npm run dev
```

3. 프로덕션 빌드
```bash
npm run build
npm start
```

## 주요 변경사항

### 2024-03-xx
- Redis 제거 및 DB 기반 토큰 사용량 관리로 변경
- 코드 단순화 및 유지보수성 향상
- 데이터 정합성 개선
