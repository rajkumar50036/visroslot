import { redirect } from "next/navigation";

export default function SignupRedirect({
  searchParams,
}: {
  searchParams?: { plan?: string; cycle?: string };
}) {
  const plan = searchParams?.plan || "professional";
  const cycle = searchParams?.cycle || "monthly";
  redirect(`/register?plan=${plan}&cycle=${cycle}`);
}
