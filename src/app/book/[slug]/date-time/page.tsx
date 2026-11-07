import { redirect } from "next/navigation";

export default function BookDateTimeRedirect({ params }: { params: { slug: string } }) {
  redirect(`/book/${params.slug}`);
}
