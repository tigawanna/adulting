import { createFileRoute, redirect } from "@tanstack/react-router";
import { defaultSearch } from "@/lib/search";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/calendar", search: defaultSearch() });
  },
});
