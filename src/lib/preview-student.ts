import { useEffect, useState } from "react";

const KEY = "bh-preview-student-id";

export function usePreviewStudent(defaultId: string | undefined) {
  const [id, setId] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    return localStorage.getItem(KEY) ?? undefined;
  });

  useEffect(() => {
    if (!id && defaultId) setId(defaultId);
  }, [defaultId, id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (id) localStorage.setItem(KEY, id);
  }, [id]);

  return { studentId: id, setStudentId: setId };
}
