export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-2xl font-bold mb-4 shadow-lg">
            ق
          </div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">قافلة</h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">Qawafel</p>
        </div>
        {children}
      </div>
    </div>
  );
}
