# Render 최종 배포 체크리스트

이 문서는 코드 작업이 끝난 뒤 **Render 환경변수 입력부터** 사용자가 직접 진행하면 되도록 만든 마지막 인계 문서다. 실제 비밀키와 Neon 비밀번호는 GitHub에 커밋하지 않는다.

## 0. 배포 전에 이미 코드에서 준비된 것

- `render.yaml`에 백엔드/프론트 두 서비스가 정의되어 있다.
- 백엔드는 Docker + Java 21로 빌드된다.
- Flyway가 PostgreSQL 스키마와 기본 AAC 상징 데이터를 생성한다.
- `/api/health`는 프로세스 생존 여부를 확인한다.
- `/api/health/ready`는 PostgreSQL 연결까지 확인하며 DB가 연결되지 않으면 HTTP 503을 반환한다.
- Gemini 키가 없거나 호출에 실패하면 결과를 `fallback`으로 명확히 표시하고 AAC 자체는 계속 동작한다.
- 프론트 `/status`에서 Backend / Neon / Gemini 설정 상태를 확인할 수 있다.
- 프론트 `/context`에서 개인화 AI가 참고하는 즐겨찾기·중요어·사용 빈도·최종 개인 어휘를 확인할 수 있다.
- QR/6자리 코드 연결, AAC/TTS, 긴급어 알림, 추천 A/B 비교, 선택 통계, CSV 내보내기가 구현되어 있다.

## 1. Render Blueprint 생성

1. Render에서 **New → Blueprint**를 선택한다.
2. GitHub 저장소 `usernameisuser11/malmoa-ai-personalization`을 연결한다.
3. 저장소 루트의 `render.yaml`을 사용해 Blueprint를 생성한다.
4. `malmoa-personalization-api`, `malmoa-personalization-web` 두 서비스가 잡히는지 확인한다.

## 2. 백엔드 환경변수 입력

`malmoa-personalization-api`에 아래 값을 입력한다.

| Key | 넣을 값 |
|---|---|
| `DATABASE_URL` | `jdbc:postgresql://<Neon host>/<db>?sslmode=require` |
| `DATABASE_USERNAME` | Neon 사용자명 |
| `DATABASE_PASSWORD` | Neon 비밀번호 |
| `GEMINI_API_KEY` | 실제 Gemini API Key |
| `GEMINI_MODEL` | 기본값을 그대로 쓰면 별도 변경 불필요 |
| `FRONTEND_ORIGIN` | 최종 프론트 Render URL |

### Neon URL 주의

Neon이 보여주는 일반 연결 문자열이 `postgresql://...` 형식이라면 Spring에 넣는 `DATABASE_URL`은 이 프로젝트 예시처럼 `jdbc:postgresql://...` 형식이어야 한다. 사용자명/비밀번호는 별도 환경변수에 넣는다.

## 3. 백엔드 먼저 배포

1. 백엔드를 배포한다.
2. 배포 로그에서 Flyway migration 오류가 없는지 확인한다.
3. 백엔드 URL을 복사한다. 예: `https://malmoa-personalization-api.onrender.com`
4. 브라우저에서 `<백엔드 URL>/api/health`를 열어 `status: ok`를 확인한다.
5. `<백엔드 URL>/api/health/ready`에서 아래를 확인한다.
   - `ready: true`
   - `database: ok`
   - `geminiConfigured: true`

`database: error`이거나 HTTP 503이면 프론트를 진행하기 전에 Neon URL/사용자명/비밀번호를 먼저 수정한다.

## 4. 프론트 환경변수 입력 후 배포

`malmoa-personalization-web`에 아래 값을 입력한다.

| Key | 넣을 값 |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | 방금 배포한 백엔드 URL, 끝 `/` 없이 |

프론트를 배포한 뒤 실제 프론트 URL을 복사한다.

## 5. CORS 최종 고정

백엔드 `FRONTEND_ORIGIN`을 **실제 프론트 Render URL과 정확히 동일하게** 맞춘 뒤 백엔드를 한 번 재배포한다.

예:

```text
FRONTEND_ORIGIN=https://malmoa-personalization-web.onrender.com
```

## 6. 배포 직후 화면 점검

프론트에서 순서대로 연다.

1. `/status`
   - Backend 연결 성공
   - Neon DB 성공
   - Gemini 설정됨
2. `/context`
   - 사용자 ID 1의 프로필/개인 어휘 데이터 로드
3. `/guardian`
   - 사용자 설정 저장
   - AI 의사소통 프로필 저장
   - 카드 별칭/즐겨찾기/중요어 저장
4. `/connect`
   - 6자리 연결 코드 발급
   - 코드 또는 QR 토큰으로 연결
5. `/aac?userId=1`
   - 해당 사용자 설정으로 격자/TTS 로드
   - A/B 문장 생성

## 7. 최종 기능 인수 테스트

아래가 전부 통과해야 “완전히 배포됨”으로 본다.

- [ ] 보호자에서 사용자 이름/격자/TTS 설정 저장 후 새로고침해도 유지된다.
- [ ] 의사소통 프로필의 최대 어절/어휘 수준/추상 표현/이유 표현 설정이 유지된다.
- [ ] 카드 별칭·표시문구·TTS·즐겨찾기·중요어가 저장된다.
- [ ] AAC 사용 기록이 누적되고 `/context`의 자주 사용한 말에 반영된다.
- [ ] `/context`의 `실제 AI 입력 개인 어휘`에 즐겨찾기/중요어/사용 빈도 기반 단어가 나타난다.
- [ ] 6자리 연결 코드가 발급되고 10분 만료가 적용된다.
- [ ] 같은 연결 코드는 두 번 사용할 수 없다.
- [ ] 연결 성공 후 올바른 `aacUserId`의 AAC 화면으로 이동한다.
- [ ] A/B 생성 결과에서 실제 Gemini 호출 성공 시 `Gemini 실시간`으로 표시된다.
- [ ] Gemini 호출 실패/키 문제 시 `Fallback`으로 표시되어 AI 성공처럼 오인되지 않는다.
- [ ] 개인화 결과가 설정한 최대 어절 수를 넘지 않는다.
- [ ] 긴급 상징 발화 시 보호자 알림 DB 레코드가 생성된다.
- [ ] 보호자 알림을 읽으면 읽음 상태로 변경된다.
- [ ] 추천 문장 선택 시 선택 통계가 증가한다.
- [ ] 실험 CSV가 정상 다운로드된다.
- [ ] 모바일 폭에서도 `/connect`, `/aac`, `/guardian`, `/context`, `/status`가 깨지지 않는다.

## 8. 문제가 생겼을 때 확인 순서

1. `/api/health`도 안 열림 → Render 백엔드 프로세스/빌드 로그 확인
2. `/api/health`는 열리지만 `/api/health/ready`가 503 → Neon 환경변수 확인
3. 백엔드는 정상인데 프론트 API 호출 실패 → `NEXT_PUBLIC_API_BASE_URL`과 `FRONTEND_ORIGIN` 확인
4. A/B 결과가 계속 `Fallback` → `GEMINI_API_KEY`, 모델명, Render 로그 확인
5. 연결 코드가 안 됨 → 코드 만료 여부와 백엔드 `/device-pairings` 응답 확인
6. DB 저장이 안 됨 → Render 로그의 Flyway/JPA/SQL 오류 확인

## 9. 보안 원칙

- 실제 `GEMINI_API_KEY`, Neon 비밀번호, 전체 비밀 연결 문자열을 GitHub issue/commit/README에 쓰지 않는다.
- 비밀값은 Render Environment에만 넣는다.
- 프론트에 Gemini 키를 `NEXT_PUBLIC_*`로 넣지 않는다.
- 테스트 중 노출된 키가 있다면 배포 전 폐기하고 새 키로 교체한다.

---

여기까지 코드와 체크가 준비되면 다음 단계는 사용자가 Render에 실제 환경변수를 입력하고 배포하는 작업이다. 배포가 끝난 뒤에는 위 인수 테스트를 실제 URL에서 한 번 더 수행한다.
