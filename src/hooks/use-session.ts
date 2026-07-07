import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMySession } from "@/lib/session.functions";

export function useSession() {
  const fn = useServerFn(getMySession);
  return useQuery({
    queryKey: ["session"],
    queryFn: () => fn(),
    staleTime: 60_000,
    retry: false,
  });
}