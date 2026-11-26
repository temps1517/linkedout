import { AuthForm } from "@/components/forms/auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <AuthForm mode="login" error={error} />;
}
