/**
 * 배포 전 API 보호장치(보조 게이트).
 *
 * 실제 요청률 제한은 배포 플랫폼(WAF)의 공유 상태에서 수행해야 한다.
 * 이 코드는 공개 배포 환경에서 WAF 규칙 검증을 표시하지 않은 경우 API를 차단한다.
 * 환경변수 설정만으로 WAF가 작동했다는 증명이 되지 않으며 실제 429 시험이 필수다.
 */
export type DeploymentGateEnv = {
  NODE_ENV?: string;
  RATE_LIMIT_RULE_VERIFIED?: string;
};

export function canUseAnalyzeApi(env: DeploymentGateEnv): boolean {
  if (env.NODE_ENV !== "production") return true;
  return env.RATE_LIMIT_RULE_VERIFIED === "true";
}
