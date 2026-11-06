# 하이보안관 Android P4 개발 소스

K-SAFE 공개 안내 웹을 여는 WebView와, 앱을 연 상태에서 사용자가 시작하는 기기 내 음성 인식 실험을 포함합니다. 이 디렉터리는 웹과 같은 GitHub 저장소에서 버전 관리합니다.

| 항목 | 현재 값 |
| --- | --- |
| 앱 이름 | 하이보안관 2.0 개발 |
| applicationId / namespace | kr.ksafe.hisecurity.dev / kr.ksafe.hisecurity |
| versionName / versionCode | 2.0.0-dev.p4 / 20003 |
| Android 최소 / 대상 SDK | API 26 / 35 |
| JDK / Gradle / AGP | 17 / 8.11.1 / 8.9.2 |
| SDK Build Tools | 35.0.0 |
| 선언 권한 | INTERNET, RECORD_AUDIO |

## 현재 동작 범위

WebView는 지정된 HTTPS 안내 페이지를 열고 내부·외부·전화 링크를 구분합니다. 음성 대기는 시작 버튼으로 한 번 실행하며 중지하거나 앱을 벗어나면 해제합니다. 호출어 문구는 로컬 matcher에서 확인합니다. 음성 인식은 Android 12 이상에서 기기 내 인식 기능을 제공하는 환경이 필요하며, 기기와 한국어 모델의 지원 상태에 따라 사용할 수 없습니다. 일반 클라우드 음성 인식으로 전환하거나 모델을 자동 다운로드하지 않습니다.

잠금화면에서 항상 대기하는 호출 기능, 백그라운드 상시 청취, 인식 정확도의 실기기 보증은 포함하지 않습니다. P4는 개발 소스 버전이며 정식 배포 승인이나 기기 검증 완료를 뜻하지 않습니다.

## 빌드와 검사

Android Studio에서 이 디렉터리를 엽니다. JDK 17과 Android SDK 35/Build Tools 35.0.0이 준비된 환경에서는 아래 검사를 실행할 수 있습니다. 로컬 SDK 위치는 추적하지 않는 local.properties의 sdk.dir 또는 ANDROID_HOME으로 설정합니다.

```sh
./gradlew --no-daemon --console=plain :app:policyTest :app:wakewordMatcherTest
./gradlew --no-daemon --console=plain :app:lintDebug :app:assembleDebug
```

policyTest와 wakewordMatcherTest는 실제 URL 정책·호출어 matcher를 JVM에서 검사합니다. 앱 화면·마이크 권한·한국어 모델·오인식·중지·화면 잠금 동작은 지원되는 실제 기기에서 별도로 확인해야 합니다. 이 저장소 정리 작업은 기기 설치나 새 APK 배포를 수행하지 않습니다.

## Git에 포함하는 파일

Java 소스, Android 리소스, Manifest, Gradle 설정과 Wrapper를 포함합니다. SDK·JDK 복사본, .build-env, .gradle, build, verification 실행 결과, local.properties, APK/AAB 및 모든 서명 키는 제외합니다. 서명 키를 저장소에 추가하지 말고 기기 설치에 사용하는 기존 서명은 로컬에서 별도 관리합니다.

WSL 작업 환경의 /home/ubuntu/codyssey/k-safe/android는 이 소스 디렉터리로 연결하는 고정 진입 경로로 사용합니다. 이전 버전과 정리 전 소스는 같은 K Safe 상위 경로의 archives/에 보관합니다.
