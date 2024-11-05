import { Inter } from "next/font/google";
import "../style/globals.css";
import ProtectedRoute from "./withAuth";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "mo7tawa",
  description: "created by mahmoud.code",
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
