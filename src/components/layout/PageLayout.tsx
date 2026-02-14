import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface PageLayoutProps {
  isLoggedIn?: boolean;
  userName?: string;
}

export function PageLayout({ isLoggedIn, userName }: PageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header isLoggedIn={isLoggedIn} userName={userName} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
