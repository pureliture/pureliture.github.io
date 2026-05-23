# 이상혁의 개발 기록

Astro 기반 GitHub Pages 블로그입니다. Notion archive export에서 정리한 공개 콘텐츠 계약과 seed를 GitHub repo 안의 데이터로 이관해, 글과 프로젝트를 source-of-truth로 관리합니다.

## Local Commands

```bash
npm install
npm run validate
npm run build:local
npm run dev
```

## Publish Gate

- `src/data/content-seed.json`의 `publishGate.status`가 `approved`가 아니면 `npm run validate:publish`는 실패해야 합니다.
- `npm run build`는 공개 배포 기준 명령이므로 `publishGate`가 닫혀 있으면 실패해야 합니다.
- 로컬 확인용 정적 빌드는 `npm run build:local`을 사용합니다.
- GitHub Pages workflow는 `npm run build:publish`를 실행해 공개 승인 전 배포를 막습니다.

## Career Private Source

- Free plan에서는 GitHub Pages repo를 private로 유지하기 어렵기 때문에 career 원본은 public repo 밖에서 관리합니다.
- `private/` 또는 `career-private/`는 `.gitignore`로 막고, 공개 가능한 요약만 `src/data/content-seed.json`에 반영합니다.

## GitHub Pages

이 repo는 username Pages repo 이름인 `pureliture.github.io`를 기준으로 구성했습니다. 따라서 `astro.config.mjs`에는 `site: 'https://pureliture.github.io'`만 두고 `base`는 설정하지 않습니다.
