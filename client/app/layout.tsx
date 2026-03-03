import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thread Lens",
  description: "Reddit Deep Research Monitor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        {children}
      </body>
    </html>
  );
}
