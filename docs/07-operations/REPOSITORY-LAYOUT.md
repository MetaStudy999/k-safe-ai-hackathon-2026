# 저장소와 로컬 작업 구분

## GitHub 기준본

main은 공개 웹과 android/의 P4 개발 소스를 관리합니다. 웹의 기존 공개 안내·음성 재생과 분석 API 배포 차단 동작을 유지합니다. Android를 추가해도 웹의 실행 경로나 환경 변수는 바뀌지 않습니다.

AI 설명 PR #4는 현재 main과 충돌하고 기존 검증 항목이 남아 있어 초안으로 보존합니다. 최신 UI·음성을 유지하는 충돌 해결과 해당 변경 검증을 마친 뒤 별도로 검토합니다. 기존 PR과 소스 브랜치는 이번 정리에서 삭제하지 않습니다.

## WSL 작업 구조

- /home/ubuntu/codyssey/k-safe/web/: main 기준 체크아웃
- /home/ubuntu/codyssey/k-safe/android/: web/android 소스의 고정 진입 경로
- /home/ubuntu/codyssey/k-safe/worktrees/legacy-local/: 전용 로컬 AI 개발 브랜치; 기존 3120 서비스 유지
- /home/ubuntu/codyssey/k-safe/worktrees/: AI·디자인·기존 변경 보존용 작업 폴더
- /home/ubuntu/codyssey/k-safe/archives/: Git bundle, 커밋 전 변경·생성물·Android 이전 버전 보관

로컬 AI 브랜치는 공개 main과 별도로 보존하며, 실행 로그·화면 캡처·큐 데이터·개인 환경 설정을 공개하지 않습니다. worktree의 로컬 브랜치와 보관 자료가 남아 있으므로 원격의 병합 완료 브랜치를 지워도 해당 작업을 복원할 수 있습니다.

## 정리 및 복구 원칙

브랜치 정리 전 원격 head와 병합 PR을 대조하고, 원본 변경 파일과 Git bundle을 로컬 archives/repository-cleanup-20261106/에 보존합니다. 공개 main에 필요한 소스와 문서만 반영하고 빌드 캐시·설치 파일·키는 제외합니다. 공개 저장소의 과거 Git 이력은 재작성하지 않습니다. 새 변경이나 열린 PR이 있는 브랜치는 정리 대상에서 제외합니다.
