import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KBO 올스타 매니저 | 나만의 드림팀",
  description: "선수 카드 영입, 라인업 구성, 훈련과 고유능력 육성으로 만드는 나만의 야구 구단.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ko"><body>{children}</body></html>;
}
