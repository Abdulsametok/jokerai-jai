import { Suspense } from "react";
import { GoalScreen } from "@/components/goal/goal-screen";
import { Spinner } from "@/components/ui";

export default function GoalPage({ params }: PageProps<"/goals/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="p-8">
          <Spinner label="Hedef yükleniyor..." />
        </div>
      }
    >
      {params.then(({ id }) => (
        <GoalScreen id={Number(id)} />
      ))}
    </Suspense>
  );
}
