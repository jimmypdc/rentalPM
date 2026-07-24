export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      {/* Decorative gradient panel */}
      <div className="pointer-events-none absolute inset-0 opacity-90">
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
      </div>
      <div className="relative z-10 w-full">
        <div className="mx-auto flex justify-center">{children}</div>
      </div>
    </div>
  );
}
