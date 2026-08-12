import type { WorkspaceAvailability } from "../domain/workspace";
import { availabilityCopy } from "../core/i18n/messages";

export function UnavailableState({
  availability,
  locale = "en-US",
}: {
  availability: WorkspaceAvailability;
  locale?: string;
}) {
  if (availability.kind === "ready") {
    return null;
  }

  const content = availabilityCopy(availability.kind, locale);

  return (
    <main className="workspace-canvas min-h-screen px-4 py-8">
      <section className="panel mx-auto max-w-xl p-6" role="alert">
        <p className="label-eyebrow">Yaxii Product Workspace</p>
        <h1 className="mt-2 text-lg font-semibold">{content.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{content.message}</p>
      </section>
    </main>
  );
}
