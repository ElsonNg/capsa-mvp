import { Suspense } from "react";
import { getSpacesForCurrentUser } from "@/lib/spaces/queries";
import { isGoogleDriveDisconnected } from "@/lib/connectors/queries";
import { GoogleDriveConnector } from "./GoogleDriveConnector";

export default async function ConnectorsPage() {
  const spaces = await getSpacesForCurrentUser();
  const disconnected = await isGoogleDriveDisconnected();
  const spaceOptions = spaces.map((space) => ({
    id: space.id,
    name: space.name,
    icon: space.icon,
  }));

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <div>
        <h1 className="text-3xl font-semibold text-[#191c1e]">Connectors</h1>
        <p className="mt-2 text-sm text-[#5f666d]">
          Link a source so Capsa can import and monitor its documents.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Suspense>
          <GoogleDriveConnector
            spaces={spaceOptions}
            disconnected={disconnected}
          />
        </Suspense>
      </div>
    </div>
  );
}
