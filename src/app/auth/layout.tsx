export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="light" data-theme="light">
      {children}
    </div>
  );
}
