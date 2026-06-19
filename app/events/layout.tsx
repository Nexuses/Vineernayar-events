/** Public event routes always use light theme (ignore system dark mode). */
import { Footer } from "@/app/components/Footer";
import { HeaderBar } from "@/app/components/HeaderBar";

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="public-light flex min-h-screen flex-col bg-white text-zinc-900">
      <HeaderBar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
