import { useState } from "react";
import { HomePage } from "./components/HomePage";
import { LoginPage } from "./components/LoginPage";
import { DashboardPage } from "./components/DashboardPage";
import { DemoPage } from "./components/DemoPage";
import { Nav } from "./components/Nav";

export default function App() {
  const [page, setPage] = useState("home");

  return (
    <div className="min-h-screen bg-[#1E0B3B]">
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      {page !== "dashboard" && page !== "demo" && <Nav page={page} setPage={setPage} />}
      {page === "home" && <HomePage setPage={setPage} />}
      {page === "login" && <LoginPage setPage={setPage} />}
      {page === "dashboard" && <DashboardPage />}
      {page === "demo" && <DemoPage setPage={setPage} />}
    </div>
  );
}
