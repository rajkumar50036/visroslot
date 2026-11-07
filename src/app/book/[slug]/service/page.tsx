import { redirect } from "next/navigation";

export default function BookServiceRedirect({ params }: { params: { slug: string } }) {
  redirect(`/book/${params.slug}`);
}
