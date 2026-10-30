import LocalAnalyzer from "./local-analyzer";
import PublicDemo from "./public-demo";

/**
 * 공개 프로덕션에서는 입력·분석 기능 대신 가상 사례 데모만 보여준다.
 * 개발 모드에서는 기존 로컬 분석 화면을 유지한다.
 * /api/analyze 차단 게이트는 별도로 유지해야 한다.
 */
export default function HomePage() {
  if (process.env.NODE_ENV === "production") {
    return <PublicDemo />;
  }
  return <LocalAnalyzer />;
}
