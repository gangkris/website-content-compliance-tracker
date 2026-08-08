import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Content Compliance Tracker",
  description: "Compliance content approval tracker",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <NavBar />
        {children}
      </body>
    </html>
  );
}
