/** Public event routes always use light theme (ignore system dark mode). */
export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="public-light min-h-screen bg-white text-zinc-900">{children}</div>
  );
}
