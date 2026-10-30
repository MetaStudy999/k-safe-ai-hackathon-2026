import { notFound } from "next/navigation";
import LocalAnalyzer from "./local-analyzer";

// Preserve the original local tool; production only exposes synthetic scenarios.
export default function LabPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <LocalAnalyzer />;
}
