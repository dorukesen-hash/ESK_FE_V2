export default function StorefrontLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 p-4">
        <p className="font-semibold">ESK Packaging</p>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="border-t border-slate-200 p-4 text-sm text-slate-500">
        © ESK Packaging
      </footer>
    </div>
  );
}
