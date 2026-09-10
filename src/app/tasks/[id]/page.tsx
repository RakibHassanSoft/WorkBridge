import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BOARD_TASKS, anyTaskById } from "@/data/marketplace";
import TaskDetail from "@/components/tasks/TaskDetail";

export function generateStaticParams() {
  return BOARD_TASKS.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const task = anyTaskById(id);
  if (!task) return { title: "Task" };
  return { title: task.title.en, description: task.desc.en };
}

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = anyTaskById(id);
  if (!task) notFound();
  return <TaskDetail id={id} />;
}
