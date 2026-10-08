import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { CalButton } from "./cal-button";
import { THEME_INIT } from "./theme";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const TITLE = "Camu Studio | Kits de unboxing e brindes corporativos impressos em 3D";
const DESCRIPTION =
  "Kits de boas-vindas, lançamentos e brindes corporativos personalizados, impressos em 3D no Brasil. Peças com a sua marca que ninguém joga fora. Do briefing à entrega.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Camu Studio",
  keywords: [
    "unboxing personalizado",
    "brindes corporativos",
    "kit de boas-vindas",
    "impressão 3D sob demanda",
    "brindes personalizados para empresas",
    "kit de evento",
    "merchandising",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Camu Studio | Abrir a caixa é parte do produto",
    description:
      "Unboxing e brindes corporativos impressos em 3D para startups, PMEs e agências.",
    siteName: "Camu Studio",
    locale: "pt_BR",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Camu Studio | Abrir a caixa é parte do produto",
    description:
      "Unboxing e brindes corporativos impressos em 3D para startups, PMEs e agências.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  colorScheme: "dark light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="grain">
        {children}
        <CalButton />
      </body>
    </html>
  );
}
