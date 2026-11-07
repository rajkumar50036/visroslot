import { redirect } from "next/navigation";

export default function PlatformRootRedirect() {
  redirect("/platform/overview");
}
