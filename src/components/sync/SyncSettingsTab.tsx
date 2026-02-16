import { useState } from "react";
import { PairingCodeSection } from "./PairingCodeSection";
import { ConnectionList } from "./ConnectionList";
import { PersonSyncControls } from "./PersonSyncControls";
import { ConflictResolution } from "./ConflictResolution";

export function SyncSettingsTab() {
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <PairingCodeSection />
      <ConnectionList onSelect={(id) => setSelectedConnection(id)} />

      {selectedConnection && (
        <>
          <PersonSyncControls connectionId={selectedConnection} />
          <ConflictResolution connectionId={selectedConnection} />
        </>
      )}
    </div>
  );
}
