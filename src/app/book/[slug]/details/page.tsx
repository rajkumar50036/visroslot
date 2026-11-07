import { redirect } from "next/navigation";

export default function BookDetailsRedirect({ params }: { params: { slug: string } }) {
  redirect(`/book/${params.slug}`);
}
