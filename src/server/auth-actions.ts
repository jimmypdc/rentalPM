"use server";

import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";
import type { ActionResult } from "@/types";
import { ok, fail } from "@/types";
import { loginSchema } from "@/lib/validations/auth";

export async function loginAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return fail("Please enter a valid email and password.");
  }
  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirect: false,
    });
    return ok(undefined);
  } catch (error) {
    if (error instanceof AuthError) {
      return fail("Invalid email or password.");
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
