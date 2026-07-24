import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getTaskFormData } from "@/server/tasks";
import { PageHeader } from "@/components/shared/page-header";
import { BackLink } from "@/components/shared/back-link";
import { TaskForm } from "@/components/task/task-form";

export const metadata: Metadata = { title: "Edit Task" };
export const dynamic = "force-dynamic";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [t, formData] = await Promise.all([
    prisma.task.findFirst({ where: { id, deletedAt: null } }),
    getTaskFormData(),
  ]);
  if (!t) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink href="/tasks" label="Tasks" />
      <PageHeader title="Edit Task" description={t.title} />
      <TaskForm
        {...formData}
        initial={{
          id: t.id,
          title: t.title,
          description: t.description ?? "",
          propertyId: t.propertyId ?? "",
          tenantId: t.tenantId ?? "",
          vendorId: t.vendorId ?? "",
          dueDate: t.dueDate ? t.dueDate.toISOString().slice(0, 10) : "",
          priority: t.priority,
          status: t.status,
          category: t.category,
          reminderAt: t.reminderAt ? t.reminderAt.toISOString().slice(0, 16) : "",
          notes: t.notes ?? "",
        }}
      />
    </div>
  );
}
