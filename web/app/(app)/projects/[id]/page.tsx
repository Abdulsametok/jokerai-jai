import { Suspense } from "react";
import { ProjectScreen } from "@/components/project/project-screen";
import { Spinner } from "@/components/ui";

export default function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="p-8">
          <Spinner label="Proje yükleniyor..." />
        </div>
      }
    >
      {params.then(({ id }) => (
        <ProjectScreen id={Number(id)} />
      ))}
    </Suspense>
  );
}
