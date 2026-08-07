import { redirect } from "next/navigation";

// There's no dedicated home page in this product — a merchant either logs
// in or signs up. Matches the old static-HTML app, which never defined a
// route at "/" at all.
export default function RootPage() {
  redirect("/login");
}
