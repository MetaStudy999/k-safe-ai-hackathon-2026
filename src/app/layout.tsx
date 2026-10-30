import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "K-SAFE | 국민안심 AI",
  description: "의심 메시지의 위험 신호와 상황별 안전행동을 확인하는 해커톤 데모입니다."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
