# 프로모션 페이지 빌더

Claude API를 활용해 프로모션 초안을 자동으로 분석하고, 페이지 섹션 구성을 제안해주는 도구입니다.

## 기능

- 프로모션 초안 텍스트 입력
- 8가지 섹션 모듈 선택 및 드래그&드롭 순서 조정
- Claude가 자동으로 분석 후 3가지 결과물 생성
  - **구성 브리프** — 목표, 타겟, 핵심 메시지, 디자인 주의사항
  - **Figma 프롬프트** — Claude Design이나 Figma에 바로 붙여넣기 가능한 상세 프롬프트
  - **Notion 구조** — 기획서용 페이지 구조

## 사용 방법

### 로컬 실행

별도 빌드 없이 정적 파일로 바로 실행할 수 있어요.

```bash
# 저장소 클론
git clone https://github.com/your-username/promotion-builder.git
cd promotion-builder

# 로컬 서버 실행 (CORS 때문에 파일을 직접 열면 API 호출이 안 돼요)
npx serve .
# 또는
python3 -m http.server 8080
```

브라우저에서 `http://localhost:8080` 열기

### GitHub Pages 배포

1. 이 저장소를 GitHub에 push
2. Settings → Pages → Branch: `main` / `/ (root)` 선택 후 Save
3. 몇 분 후 `https://your-username.github.io/promotion-builder` 접속 가능

### Vercel / Netlify 배포

별도 설정 없이 저장소 연결만 하면 자동 배포돼요.

## API 키 설정

첫 실행 시 화면에서 Anthropic API 키를 입력하면 브라우저 로컬스토리지에 저장돼요.

[Anthropic Console](https://console.anthropic.com/settings/keys)에서 발급받을 수 있어요.

> API 키는 브라우저에만 저장되며 서버로 전송되지 않아요.
> 공용 컴퓨터에서는 사용 후 브라우저 로컬스토리지를 초기화해주세요.

## 파일 구조

```
promotion-builder/
├── index.html   # 앱 구조
├── style.css    # 스타일
├── app.js       # 로직 + Claude API 호출
└── README.md
```

## 사용 모듈

| 모듈 | 설명 |
|------|------|
| 히어로 섹션 | 메인 배너, 핵심 메시지 |
| 오퍼/혜택 | 할인율, 기간, 조건 |
| 상품 쇼케이스 | 추천 상품 그리드/캐러셀 |
| 소셜 프루프 | 후기, 별점, 고객 수 |
| CTA 섹션 | 구매/신청 유도 버튼 |
| FAQ | 자주 묻는 질문 |
| 카운트다운 | 마감 시간 긴박감 |
| 신뢰 배지 | 보안, 환불, 인증 |
