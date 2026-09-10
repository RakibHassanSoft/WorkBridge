import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { STUDENTS, studentBySlug } from "@/data/people";
import Passport from "@/components/passport/Passport";

export function generateStaticParams() {
  return STUDENTS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const student = studentBySlug(slug);
  if (!student) return { title: "Proof-of-Work passport" };
  return {
    title: `${student.name.en} — Proof-of-Work passport`,
    description: `${student.verified} tasks scored by a coordinator and signed off by the business that paid for them.`,
  };
}

export default async function PassportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const student = studentBySlug(slug);
  if (!student) notFound();
  return <Passport slug={slug} />;
}
