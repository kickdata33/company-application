import "./globals.css";

export const metadata = {
  title: "สมัครเปิดบริษัท",
  description: "ระบบรับข้อมูลผู้สมัครเปิดบริษัท"
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
