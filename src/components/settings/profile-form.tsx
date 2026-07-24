"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { updateProfile } from "@/server/settings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField, FormGrid } from "@/components/shared/form-field";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z.string().trim().optional(),
});
type ProfileInput = z.infer<typeof profileSchema>;

export function ProfileForm({
  initial,
}: {
  initial: { name: string; email: string; phone: string };
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: initial.name, phone: initial.phone },
  });

  async function onSubmit(values: ProfileInput) {
    setPending(true);
    const fd = new FormData();
    fd.set("name", values.name);
    fd.set("phone", values.phone ?? "");
    const result = await updateProfile(fd);
    if (result.ok) {
      toast.success("Profile updated");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <FormGrid>
        <FormField label="Name" required error={errors.name?.message}>
          <Input {...register("name")} placeholder="Your name" />
        </FormField>
        <FormField label="Email" hint="Email is managed by your login and can't be changed here.">
          <Input value={initial.email} readOnly disabled />
        </FormField>
        <FormField label="Phone" error={errors.phone?.message}>
          <Input {...register("phone")} placeholder="(305) 555-0100" />
        </FormField>
      </FormGrid>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save profile
        </Button>
      </div>
    </form>
  );
}
