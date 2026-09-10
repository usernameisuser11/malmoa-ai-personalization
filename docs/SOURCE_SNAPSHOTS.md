# Source snapshots

이 독립 실험판은 기존 SMU-SENSE 작업을 참고/재구성하며, 아래 시점을 통합 기준으로 기록한다.

## Frontend sources
- Guardian: `SMU-SENSE/frontend` / `feature/dongseok`
  - snapshot commit: `0a5705e6319ec79b08ce0463d732510c8403b12d`
  - 담당 범위: 보호자 로그인/온보딩, 사용자 관리, 문장/추천 화면, 알림 UI/API 연결, 디자인 소스 정책
- User AAC: `SMU-SENSE/frontend` / `feature/jian`
  - snapshot commit: `d8210b0be3edb4bf3d8aa00900f79d95156123ca`
  - 담당 범위: AAC 사용자 메인/카테고리 화면, 최대 3개 카드 기반 AI 문장 생성, TTS, QR/코드 연결 UI

## Backend source
- `SMU-SENSE/backend` / `feature/yunji-gardian-alarm`
  - snapshot commit: `1e9a16c60e0a94c3be101e3602b1144eb292f3c2`
  - 담당 범위: Spring Boot API, PostgreSQL/Flyway, AAC 사용 기록/즐겨찾기, 보호자 긴급 알림 흐름

## Design source rule
예서님이 전달한 Figma export가 존재하는 화면/아이콘은 그것을 source of truth로 본다. Guardian 원본의 `DESIGN_SOURCE.md`에 기록된 foundation은 Navy `#06054F`, Green `#149E69`, Light Green `#E6F7F1` 등이다.

현재 이 저장소에서 새로 만든 `/guardian` 개인화 실험 화면과 `/aac` A/B 테스트 화면은 기획 검증을 위한 **새 프로토타입 UI**이며, 예서님이 별도 시안을 제공한 화면인 것처럼 취급하지 않는다. 기존 인증/온보딩 화면을 이식할 때는 원본 Figma export와 제공 자산을 그대로 우선 적용한다.

## Why reconstruction instead of blind copy
Guardian/User 프론트는 서로 다른 Next.js 버전과 디렉터리 구조를 사용하고, 기존 백엔드는 팀 전체 인증/도메인 구조를 포함한다. 이 실험판은 핵심 개인화 가설을 빠르게 검증하기 위해 기존 기능 흐름을 유지하면서 하나의 Next.js 15 + Spring Boot 3.5 + Neon PostgreSQL 구조로 재구성한다. 팀 메인 저장소는 변경하지 않는다.
