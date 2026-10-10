import type { Metadata } from "next";
import "@fontsource/newsreader/400.css";
import "@fontsource/newsreader/400-italic.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "./globals.css";
import { LangProvider } from "@/i18n";

export const metadata: Metadata = {
  title: "Ontario Facility Emissions Spine: one factory, five names",
  description:
    "Ontario's MECP greenhouse gas registry and the federal GHGRP name the same facilities differently and share no published key. This project resolves 513 canonical facilities across both registries (2010-2024): 458 anchored on exact normalized name plus same city, 55 honestly unmatched, 30,693 large-building rows quarantined. Explorer, Ontario match map, combined emissions ranking, three unlocked joins, REST API, OpenAPI docs, MCP tools. Open data, MIT licensed.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
