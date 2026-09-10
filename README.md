# malmoa-ai-personalization

말모아 AAC의 **사용자 맞춤형 AI 문장 추천**을 실제로 검증하기 위한 독립 통합 실험 저장소입니다. 기존 SMU-SENSE 사용자·보호자 프론트와 Spring Boot 백엔드의 기능을 참고·재사용하면서, 개인화 실험에 필요한 기능을 한 저장소에서 실행하도록 구성합니다.

## 현재 구현 범위

- 보호자 사용자 기본 설정: 이름, 생년월일, 관계, 긴급 연락처
- 사용자별 보호자 설정 페이지: `/guardian?userId=<id>`
- AAC 화면 격자 `2×2 / 3×3 / 4×4`, TTS 음성·속도 설정
- 의사소통 프로필: 연령, 수용/표현 최대 어절, 어휘 수준, 추상 표현/이유 표현 허용 여부
- 실험용 의사소통 프리셋: 단어 중심 / 짧은 문장 / 일반 문장 / 확장 표현
- 상징 카드의 표준어 보존 + 표시어·사용자 별칭·TTS·이미지 커스터마이징
- 즐겨찾기·중요 단어·실제 사용 빈도를 개인 어휘 Context로 활용
- `/context?userId=<id>`에서 Gemini에 들어가는 개인화 Context 확인
- 일반 Gemini와 개인화 Gemini A/B 추천
- 최대 어절 수 및 복수 문장 후검증, 조건 위반 시 재생성
- 개인화 Gemini가 유효 후보 3개를 만들지 못하면 결과 전체를 fallback으로 전환해 출처가 섞이지 않도록 처리
- 실제 Gemini 결과와 로컬 fallback 결과를 UI에서 구분
- 추천 생성 출처(`gemini` / `fallback`)를 DB 기록 및 통계에 분리 집계
- 추천 선택률·평균 어절·개인어휘 반영 수 기록 및 CSV 내보내기
- 고정 긴급어 세트 + 긴급 발화 보호자 알림 기록
- QR / 6자리 코드 기반 사용자 기기 연결, 10분 만료 및 재발급
- Neon PostgreSQL + Flyway 마이그레이션
- Render 프론트/백엔드 분리 배포 Blueprint
- `/status`에서 Backend/Neon/Gemini 설정 및 Gemini 실제 호출 점검
- GitHub Actions에서 프론트 빌드 + PostgreSQL 기반 백엔드 마이그레이션/테스트/패키징 검증

## 기술 스택

- Frontend: Next.js 15.5.2, React 19.1.1, TypeScript 5.9.2
- Backend: Spring Boot 3.5.16, Java 21, Spring Data JPA, Flyway
- DB: Neon PostgreSQL
- AI: Gemini API (`GEMINI_MODEL`, 기본 `gemini-3.8-flash`)
- Deploy: Render

## 로컬 환경변수

실제 비밀값은 저장소에 커밋하지 않습니다. `.env.example`을 기준으로 로컬/Render Secret에만 넣습니다.

```text
DATABASE_URL=jdbc:postgresql://<neon-host>/<db>?sslmode=require
DATABASE_USERNAME=<neon-user>
DATABASE_PASSWORD=<neon-password>
GEMINI_API_KEY=<real-key>
GEMINI_MODEL=gemini-3.8-flash
FRONTEND_ORIGIN=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

Neon이 보여주는 `postgresql://user:password@host/db` 문자열을 그대로 `DATABASE_URL`에 넣는 방식이 아니라, 이 프로젝트에서는 **JDBC URL / username / password를 분리**해 설정합니다.

## Render 배포 체크

상세 순서는 [`docs/RENDER_DEPLOY_CHECKLIST.md`](docs/RENDER_DEPLOY_CHECKLIST.md)를 따릅니다.

1. `render.yaml` Blueprint로 API와 Web 서비스를 생성합니다.
2. Backend에 Neon의 `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`를 설정합니다.
3. Backend에 `GEMINI_API_KEY`를 Secret으로 설정합니다.
4. Frontend 배포 URL을 Backend의 `FRONTEND_ORIGIN`에 넣습니다. 이 값은 CORS뿐 아니라 QR 연결 URL 생성에도 사용됩니다.
5. Backend 배포 URL을 Frontend의 `NEXT_PUBLIC_API_BASE_URL`에 넣고 재배포합니다.
6. `/api/health`가 200인지 확인하고 `/api/health/ready`에서 `ready=true`, `database=ok`, `geminiConfigured=true`를 확인합니다.
7. 프론트 `/status`에서 **Gemini 실제 호출 테스트**를 실행해 `reachable=true`인지 확인합니다.
8. AAC A/B 추천 화면에서 결과 배지가 `Gemini 실시간`인지 확인합니다. `Fallback`이면 API 키/모델/통신 문제를 확인합니다.

## 실험 데이터 해석

추천 기록에는 `generation_source`가 함께 저장됩니다. `gemini`는 실제 Gemini 응답이 최종 후보로 채택된 경우이고, `fallback`은 키 미설정·호출 실패·형식/길이 검증 실패 등으로 로컬 안전 후보를 사용한 경우입니다.

A/B 화면 통계에서도 Gemini 후보 수와 Fallback 후보 수를 별도로 보여줍니다. CSV에도 `generation_source` 열이 포함되므로 **fallback 결과를 AI 성능으로 잘못 집계하지 않아야 합니다.**

## 개인화 설계 원칙

1. 진단명이나 지적장애 등급만으로 사용자의 언어 능력을 추정하지 않습니다.
2. 보호자가 확인한 실제 수용·표현 언어 능력을 AI 생성 제약으로 사용합니다.
3. 연령은 Context 정보로 제공하되, 연령만으로 문장 능력을 자동 결정하지 않습니다.
4. 프리셋의 어절 수는 임상 장애등급 기준이 아니라 실험용 시작값입니다.
5. 카드의 표준어(canonical text)는 보존하고 사용자별 표현은 별도 저장합니다.
6. 즐겨찾기/중요어/사용 이력은 사용자의 개인 어휘로 활용합니다.
7. AI가 사용자가 선택하지 않은 의도·감정·사실을 새로 만들지 않도록 프롬프트에 제한합니다.
8. 개인화 결과는 백엔드 후검증을 통과한 문장만 사용자에게 제공합니다.
9. 긴급 의사소통은 생성형 AI에 의존하지 않고 고정 상징으로 제공합니다.

## 현재 범위의 주의점

이 저장소는 **개인화 기능 검증용 Lab**입니다. 원본 SMU-SENSE의 Google 로그인·세션·CSRF 전체 구조를 아직 이 실험판에 복제하지 않았으므로, 공개 배포에서는 실제 개인정보나 민감정보 대신 테스트 데이터를 사용해야 합니다. URL의 `userId`는 실험 대상을 선택하기 위한 식별값이지 인증 수단이 아닙니다.

디자인 또한 예서님이 전달한 원본 자산이 있는 화면은 그 자산이 기준이며, 이 Lab에 새로 만든 실험 전용 화면을 최종 Figma 디자인으로 간주하지 않습니다.
