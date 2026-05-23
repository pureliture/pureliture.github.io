# GitHub Blog Content Model

이 문서는 확정된 `docs/github-blog-design.html` 구조를 실제 GitHub 블로그로 옮기기 위한 공개 콘텐츠 모델이다.

## 방향

- 블로그가 중심이고 이력서는 보조 섹션이다.
- Notion 이력서는 archive 원본으로만 보관하고, 공개 블로그의 원본은 GitHub repo의 JSON/MDX로 관리한다.
- 공개 페이지는 `AI Agent 개발`, `Application Architecture`, `Backend 운영 경험`, `최근 GitHub repository 활동`이 같이 보이도록 구성한다.
- private repo, raw memory, 지원 현황, 휴대폰 번호, 자격증 식별번호, 비공개 시스템 세부정보는 공개 데이터에 넣지 않는다.

## Source Inputs

| Source | 용도 | 공개 반영 방식 |
| --- | --- | --- |
| Notion archive export | 경력, 프로젝트, 기술 스택, 글 링크 | 이력서 전체가 아니라 러프한 career 흐름만 sanitize 후 `careerTimeline`, `careerCaseStudies`, `writing`으로 분리 |
| GitHub public repository metadata | 최근 active repositories | public/source repo만 `repositories`에 반영 |
| GitHub README/local docs | repository 설명 보강 | 공개 repo의 README 내용만 요약 |
| 기존 wireframe/design | 화면 구조 | `Working Notes`, `Active Repositories`, `Career Case Studies`, `Career Context` 섹션으로 매핑 |

## Collections

### `publicProfile`

블로그 상단과 About rail에 쓰는 공개 프로필이다.

Required fields:

- `name`
- `headline`
- `shortBio`
- `philosophy`
- `focus`
- `publicLinks`
- `sensitiveOmissions`
- `publicReviewStatus`: `needs-review` | `approved` | `redacted`

Rules:

- `publicLinks.email`은 명시 공개 승인 전까지 `null`이거나 생략할 수 있다.
- `publicLinks.email`에 값이 있으면 `publishGate.status=approved`와 항목 단위 `publicReviewStatus=approved`를 통과해야 한다.

### `notes`

블로그의 중심 feed다. 실제 작성 전에는 draft topic으로 둔다.

Required fields:

- `slug`
- `title`
- `kind`
- `status`: `draft` | `published` | `planned`
- `summary`
- `tags`
- `linkedEvidence`
- `publicReviewStatus`: `needs-review` | `approved` | `redacted`

Conditional fields:

- `url`: `status=published`이면 required다.
- `url`: `status=planned` 또는 `status=draft`이면 optional이며 없어도 된다.

Rules:

- `linkedEvidence`는 `repositories.name` 또는 `careerCaseStudies.slug` 중 하나를 참조한다.
- 존재하지 않는 `linkedEvidence` 참조는 build 실패 조건이다.
- `publishGate.status=approved` 상태에서 배포되는 `status=published` 항목은 `publicReviewStatus=approved` 또는 `redacted`여야 한다.

### `repositories`

GitHub 최신 활동 기반 프로젝트 카드다.

Required fields:

- `name`
- `url`
- `visibility`
- `language`
- `updatedAt`
- `role`
- `summary`
- `tags`
- `displayPriority`
- `publicReviewStatus`: `needs-review` | `approved` | `redacted`

Rules:

- `visibility`는 공개 블로그에서 기본 `public`만 허용한다.
- private repo는 이름이 공개되어도 되는지 별도 승인 전까지 제외한다.
- fork repo는 기본 제외한다.
- 승인 전에는 실제 프로젝트명 대신 추상화된 `title` 또는 `displayName`만 공개한다.

### `careerCaseStudies`

Notion 이력서의 프로젝트 database를 공개용 case study로 정규화한 데이터다.

Required fields:

- `slug`
- `title`
- `organization`
- `period`
- `summary`
- `proof`
- `tags`
- `source`
- `publicReviewStatus`: `needs-review` | `approved` | `redacted`

Rules:

- 비공개 구현명, 비공개 URL, 민감한 시스템 식별자는 공개 전 점검한다.
- 승인 전에는 실제 시스템명이나 프로젝트명 대신 추상화된 `title` 또는 `displayName`만 공개한다.
- 숫자 성과는 이미 공개 가능한 수준으로 확인된 항목만 사용한다.

### `careerTimeline`

Career Context 섹션용 데이터다.

Required fields:

- `period`
- `organization`
- `role`
- `summary`
- `tags`
- `publicReviewStatus`: `needs-review` | `approved` | `redacted`

Rules:

- 승인 전에는 실제 시스템명이나 프로젝트명 대신 추상화된 `title` 또는 `displayName`만 공개한다.

### `writing`

외부 발행 글과 블로그로 옮길 글 주제를 관리한다. 현재 화면에 Writing 섹션이 없으면 backlog collection으로 유지하고, 화면 매핑에서는 optional로 취급한다.

Required fields:

- `title`
- `kind`: `external` | `draft`
- `summary`
- `tags`
- `linkedCaseStudy`
- `publicReviewStatus`: `needs-review` | `approved` | `redacted`

Conditional fields:

- `url`: `kind=external`이고 발행 글이면 required다.
- `url`: `kind=draft`이면 optional이며 없어도 된다.

Rules:

- `linkedCaseStudy`는 `careerCaseStudies.slug`를 참조한다.
- 존재하지 않는 `linkedCaseStudy` 참조는 build 실패 조건이다.

## Publish Gate

Publish Gate는 체크리스트가 아니라 공개 배포를 차단하는 fail-closed 계약이다.

Required fields:

- `publishGate.status`: `blocked` | `approved`
- `blockingReasons`
- `requiredApprovals`
- `needsHumanReview`

Optional fields:

- `denyPatternCategories`: 공개 데이터 검증에서 차단할 표현군이다. 공개 콘텐츠 파일에는 민감한 원문 표현을 직접 넣지 않고 category로만 둔다.

Fail-closed rules:

- `publishGate.status=blocked`이면 publish 불가다.
- `blockingReasons`가 비어 있지 않으면 publish 불가다.
- `requiredApprovals`가 남아 있으면 publish 불가다.
- `needsHumanReview=true`이면 publish 불가다.
- 공개 collection의 모든 항목은 `publicReviewStatus`를 가진다.
- `publicReviewStatus=needs-review`인 항목은 publish 대상에서 제외하거나 `publishGate.status=blocked`로 전환한다.
- `publicReviewStatus=redacted`인 항목은 redaction 결과가 build input에 반영된 경우에만 publish 가능하다.
- 휴대폰 번호, 자격증 식별번호, raw memory, 지원 현황, 인터뷰 기록, non-public repository URL, Notion signed asset URL, secret, token, credential이 발견되면 `blockingReasons`에 기록하고 build를 실패시킨다.
- 비공개 세부정보가 추상화된 `title` 또는 `displayName`으로 치환되지 않았으면 `needsHumanReview=true`로 둔다.

## Screen Mapping

| 화면 섹션 | 사용 collection |
| --- | --- |
| `/` Hero | `publicProfile` |
| `/` Field Notes | `notes` |
| `/` About rail | `publicProfile`, `publicProfile.philosophy` |
| `/` Publish Gate rail | `publishGate` |
| `/` Active Repositories | `repositories` |
| `/` Career Case Studies | `careerCaseStudies` |
| `/notes/`, `/notes/[slug]/` | `notes`, `repositories`, `careerCaseStudies` |
| `/projects/`, `/projects/[name]/` | `repositories`, `notes` |
| `/career/` | `careerTimeline`, `careerCaseStudies`, `publishGate` |
| `/archive/` | `writing` optional/backlog |
