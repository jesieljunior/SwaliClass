import { createFileRoute } from "@tanstack/react-router";
import { PortalOverview } from "@/modules/portal/components/PortalOverview";

export const Route = createFileRoute("/_authenticated/app/portal")({
  component: PortalOverview,
});
