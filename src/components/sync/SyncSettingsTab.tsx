import { useState, useCallback } from "react";
import { PairingCodeSection } from "./PairingCodeSection";
import { ConnectionList } from "./ConnectionList";
import { PersonSyncControls } from "./PersonSyncControls";
import { ConflictResolution } from "./ConflictResolution";

export function SyncSettingsTab() {
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePaired = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="space-y-6">
      <PairingCodeSection onPaired={handlePaired} />
      <ConnectionList
        key={refreshKey}
        onSelect={(id) => setSelectedConnection(id)}
        onLoaded={(connections) => {
          // Auto-select first active connection if none selected
          if (!selectedConnection && connections.length > 0) {
            const active = connections.find((c) => c.status === "active");
            if (active) setSelectedConnection(active.id);
          }
        }}
      />

      {selectedConnection && (
        <>
          <PersonSyncControls connectionId={selectedConnection} />
          <ConflictResolution connectionId={selectedConnection} />
        </>
      )}
    </div>
  );
}
