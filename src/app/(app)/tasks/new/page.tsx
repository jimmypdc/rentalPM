import type { Metadata } from "next";
import { getTaskFormData } from "@/server/tasks";
import { PageHeader } from "@/components/shared/page-header";
import { BackLink } from "@/components/shared/back-link";
import { TaskForm } from "@/components/task/task-form";

export const metadata: Metadata = { title: "Add Task" };
export const dynamic = "force-dynamic";

export default async function NewTaskPage() {
  const formData = await getTaskFormData();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink href="/tasks" label="Tasks" />
      <PageHeader title="Add Task" description="Create a new to-do item." />
      <TaskForm {...formData} />
    </div>
  );
}
