import { Inter } from "next/font/google";
import "../style/globals.css";
import ProtectedRoute from "./withAuth";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({ children }) {
  return (
    <ProtectedRoute>
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </ProtectedRoute>
  );
}
