import PublicDemo from "./public-demo";

/**
 * 메인페이지는 개발·운영 모두 공개 디자인의 가상 사례 데모를 보여준다.
 * 입력·분석 화면은 개발 전용 /lab에서 제공한다.
 * /lab 및 /api/analyze의 운영 차단은 각 경로에서 유지한다.
 */
export default function HomePage() {
  return <PublicDemo />;
}
