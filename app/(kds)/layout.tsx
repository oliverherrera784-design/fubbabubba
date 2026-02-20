export default function KDSLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen bg-gray-900 overflow-hidden">
      {children}
    </div>
  );
}
