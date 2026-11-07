import { redirect } from "next/navigation";

export default function BookConfirmationRedirect({ params }: { params: { slug: string } }) {
  redirect(`/book/${params.slug}`);
}
