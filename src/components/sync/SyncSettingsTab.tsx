import { useState, useCallback } from "react";
import { PairingCodeSection } from "./PairingCodeSection";
import { ConnectionList } from "./ConnectionList";
import { PeopleMappingSection } from "./PeopleMappingSection";
import { ConflictResolution } from "./ConflictResolution";

interface Connection {
  id: string;
  status: string;
}

export function SyncSettingsTab() {
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [hasActiveConnection, setHasActiveConnection] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePaired = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="space-y-6">
      {!hasActiveConnection && <PairingCodeSection onPaired={handlePaired} />}
      <ConnectionList
        key={refreshKey}
        onSelect={(id) => setSelectedConnection(id)}
        onLoaded={(connections: Connection[]) => {
          const active = connections.find((c) => c.status === "active");
          setHasActiveConnection(!!active);
          if (!selectedConnection && active) {
            setSelectedConnection(active.id);
          }
        }}
      />

      {selectedConnection && (
        <>
          <PeopleMappingSection connectionId={selectedConnection} />
          <ConflictResolution connectionId={selectedConnection} />
        </>
      )}
    </div>
  );
}
