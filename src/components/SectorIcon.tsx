"use client";

import { Calculator, Code2, Megaphone, Palette, PenLine, Ruler, Sprout, Table2, Users, type LucideIcon } from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Code2,
  Calculator,
  Megaphone,
  PenLine,
  Palette,
  Ruler,
  Sprout,
  Users,
  Table2,
};

export default function SectorIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MAP[name] ?? Table2;
  return <Icon className={className} />;
}
