export default function POSLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen bg-gray-100 overflow-hidden">
      {children}
    </div>
  );
}
