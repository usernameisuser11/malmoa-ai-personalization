# Render 최종 배포 체크리스트

이 문서는 코드 작업이 끝난 뒤 **Render 환경변수 입력부터** 사용자가 직접 진행하면 되도록 만든 마지막 인계 문서다. 실제 비밀키와 Neon 비밀번호는 GitHub에 커밋하지 않는다.

## 0. 배포 전에 코드에서 준비된 것

- `render.yaml`에 백엔드/프론트 두 서비스가 정의되어 있다.
- 백엔드는 Docker + Java 21로 빌드된다.
- Flyway가 PostgreSQL 스키마와 기본 AAC 상징 데이터를 생성한다.
- `/api/health`는 프로세스 생존 여부를 확인한다.
- `/api/health/ready`는 PostgreSQL 연결까지 확인하며 DB가 연결되지 않으면 HTTP 503을 반환한다.
- `/api/health/gemini`는 Gemini 키 존재 여부가 아니라 **실제 모델 호출 성공 여부**까지 검사한다. 진단 화면에서 실패 상태를 읽을 수 있도록 진단 응답 자체는 HTTP 200으로 반환한다.
- Gemini 키가 없거나 호출/출력 검증에 실패하면 결과를 `fallback`으로 명확히 표시하고 AAC 자체는 계속 동작한다.
- 프론트 `/status`에서 Backend / Neon / Gemini 설정 및 실제 Gemini 호출을 확인할 수 있다.
- 프론트 `/context?userId=<id>`에서 개인화 AI가 참고하는 즐겨찾기·중요어·사용 빈도·최종 개인 어휘를 확인할 수 있다.
- 보호자 설정은 `/guardian?userId=<id>`, 사용자 AAC는 `/aac?userId=<id>`로 같은 사용자 ID를 유지할 수 있다.
- QR/6자리 코드 연결, AAC/TTS, 긴급어 알림, 추천 A/B 비교, 선택 통계, 생성 출처 통계, CSV 내보내기가 구현되어 있다.

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

Neon이 보여주는 일반 연결 문자열이 `postgresql://...` 형식이라면 Spring에 넣는 `DATABASE_URL`은 이 프로젝트 예시처럼 `jdbc:postgresql://...` 형식이어야 한다. 사용자명/비밀번호는 별도 환경변수에 넣는다. 실제 비밀번호가 포함된 Neon 원본 연결 문자열 전체를 README나 GitHub issue에 붙여넣지 않는다.

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

`NEXT_PUBLIC_*` 값은 Next.js 빌드 시 포함되므로 값을 바꾼 뒤에는 프론트를 다시 배포한다.

프론트를 배포한 뒤 실제 프론트 URL을 복사한다.

## 5. CORS와 QR 목적지 최종 고정

백엔드 `FRONTEND_ORIGIN`을 **실제 프론트 Render URL과 정확히 동일하게** 맞춘 뒤 백엔드를 한 번 재배포한다. 이 값은 CORS 허용 origin과 QR 연결 링크 목적지에 동시에 사용된다.

예:

```text
FRONTEND_ORIGIN=https://malmoa-personalization-web.onrender.com
```

## 6. 배포 직후 연결 상태 점검

프론트 `/status`에서 순서대로 확인한다.

1. Backend: `ready=true`
2. Neon PostgreSQL: `database=ok`
3. Gemini API 설정: 키 설정됨
4. **Gemini 실제 호출 테스트** 버튼 실행
5. 결과가 `status=ok`, `reachable=true`인지 확인

키가 설정되어 있어도 `reachable=false`라면 모델명, 키 권한/제한, Gemini API 통신 문제를 확인해야 한다. 이 경우 아직 실제 AI 연결이 완료된 것으로 보지 않는다.

## 7. 사용자별 데이터 흐름 점검

같은 사용자 ID로 아래 화면을 이어서 테스트한다. 예시는 사용자 `1`이다.

1. `/guardian?userId=1`
   - 사용자 설정 저장
   - AI 의사소통 프로필 저장
   - 카드 별칭/즐겨찾기/중요어 저장
2. `/context?userId=1`
   - 위 프로필과 개인 어휘가 그대로 보이는지 확인
3. `/connect`
   - 사용자 1의 6자리 연결 코드 또는 QR 생성
   - 사용자 기기에서 claim
4. `/aac?userId=1`
   - 같은 사용자 설정으로 격자/TTS/상징이 로드되는지 확인
   - A/B 문장 생성

## 8. AI 개인화 인수 테스트

아래가 전부 통과해야 개인화 추천이 제대로 연결된 것으로 본다.

- [ ] 보호자에서 설정한 표현 최대 어절이 `/context`와 AAC 개인화 결과에 동일하게 반영된다.
- [ ] 즐겨찾기·중요어가 `/context`의 `실제 AI 입력 개인 어휘`에 포함된다.
- [ ] AAC를 사용한 뒤 자주 사용한 말의 횟수가 증가한다.
- [ ] 개인화 결과가 설정한 최대 어절 수를 넘지 않는다.
- [ ] 한 후보에 복수 문장이 섞인 Gemini 결과는 최종 사용자 후보로 노출되지 않는다.
- [ ] Gemini가 유효한 개인화 후보 3개를 만들지 못하면 결과 출처가 `Fallback`으로 전환된다.
- [ ] 실제 Gemini 후보와 Fallback 후보가 한 결과 안에서 섞여 모두 Gemini인 것처럼 표시되지 않는다.
- [ ] 통계의 `Gemini` 후보 수와 `Fallback` 후보 수가 별도로 증가한다.
- [ ] CSV의 `generation_source` 열이 `gemini`/`fallback`을 구분한다.
- [ ] 추천 문장을 누르면 선택 통계가 증가한다.

## 9. AAC/긴급/연결 인수 테스트

- [ ] 사용자 이름/격자/TTS 설정 저장 후 새로고침해도 유지된다.
- [ ] 카드 별칭·표시문구·TTS·즐겨찾기·중요어·커스텀 이미지가 저장된다.
- [ ] 6자리 연결 코드가 발급되고 10분 만료가 적용된다.
- [ ] 새 코드를 발급하면 이전 ACTIVE 코드는 취소된다.
- [ ] 같은 연결 코드는 두 번 사용할 수 없다.
- [ ] 연결 성공 후 올바른 `aacUserId`의 AAC 화면으로 이동한다.
- [ ] 긴급 상징은 Gemini 없이 항상 표시된다.
- [ ] 긴급 상징 발화 시 보호자 알림 DB 레코드가 생성된다.
- [ ] 보호자 알림을 읽으면 읽음 상태로 변경된다.
- [ ] 모바일 폭에서도 `/connect`, `/aac`, `/guardian`, `/context`, `/status`가 깨지지 않는다.

## 10. 문제가 생겼을 때 확인 순서

1. `/api/health`도 안 열림 → Render 백엔드 프로세스/빌드 로그 확인
2. `/api/health`는 열리지만 `/api/health/ready`가 503 → Neon 환경변수 확인
3. 백엔드는 정상인데 프론트 API 호출 실패 → `NEXT_PUBLIC_API_BASE_URL`과 `FRONTEND_ORIGIN` 확인 후 해당 서비스 재배포
4. `/status`에서 Gemini `configured=true`, `reachable=false` → `GEMINI_API_KEY`, `GEMINI_MODEL`, 키 제한/권한, Render 로그 확인
5. A/B 결과가 계속 `Fallback` → 실제 호출 상태와 Gemini 응답 형식/문장 길이 조건 확인
6. 연결 코드가 안 됨 → 코드 만료/재발급/이미 사용됨 여부 확인
7. DB 저장이 안 됨 → Render 로그의 Flyway/JPA/SQL 오류 확인

## 11. 보안 원칙

- 실제 `GEMINI_API_KEY`, Neon 비밀번호, 전체 비밀 연결 문자열을 GitHub issue/commit/README에 쓰지 않는다.
- 비밀값은 Render Environment에만 넣는다.
- 프론트에 Gemini 키를 `NEXT_PUBLIC_*`로 넣지 않는다.
- 이 Lab의 `userId`는 인증 수단이 아니므로 공개 URL에는 실제 개인정보/민감정보를 넣지 않는다.
- 테스트 중 노출된 키가 있다면 배포 전 폐기하고 새 키로 교체한다.

---

여기까지 코드와 체크가 준비되면 다음 단계는 사용자가 Render에 실제 환경변수를 입력하고 배포하는 작업이다. 배포가 끝난 뒤에는 위 인수 테스트를 실제 URL에서 한 번 더 수행한다.
