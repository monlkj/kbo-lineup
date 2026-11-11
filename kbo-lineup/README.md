# KBO 올스타 매니저

첨부된 구단 운영 게임을 Next.js App Router로 옮긴 브라우저 게임입니다.

## 실행

```sh
cd kbo-lineup
npm ci
npm run dev
```

프로덕션 확인: `npm run build` 후 `npm start`.

## 게임

구단 코드와 선호 구단을 입력해 창단합니다. 우편함에서 창단 지원금을 수령하고 보관함에서 선수팩을 개봉하세요. 팀 관리에서 라인업, 훈련, 고유능력, 레전드 스카우트, 시그니처 각성을 사용할 수 있습니다.

진행 기록은 구단 코드별로 현재 브라우저의 localStorage에 자동 저장됩니다. 계정 로그인이나 기기 간 동기화 기능은 없습니다. 한국 시간 기준 일일 보상은 하루 한 번 수령합니다. 선수 연도·능력치·포지션은 게임용 생성 데이터이며 실제 시즌 기록을 재현하지 않습니다. 리그 메뉴는 보상 체험용입니다.

## Vercel

GitHub 저장소 `monlkj/kbo-lineup`을 연결하고 다음 설정을 사용합니다.

- Root Directory: `kbo-lineup`
- Framework Preset: Next.js
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: 기본값 (`.next`)
- 별도 환경 변수 불필요

연결된 프로덕션 브랜치가 `main`이면 해당 브랜치에 푸시한 뒤 Vercel의 배포 결과를 확인합니다.
