import { DashboardPage } from "./DashboardPage";

export function DemoPage({ setPage }: { setPage: (p: string) => void }) {
  return (
    <div
      style={{
        pointerEvents: "none",
      }}
    >
      <DashboardPage />
    </div>
  );
}
