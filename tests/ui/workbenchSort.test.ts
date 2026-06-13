import { describe, expect, it } from "vitest";
import { sortLocationsForWorkbench } from "../../src/ui/App";
import type { BoardLocation } from "../../src/engine/board";

describe("workbench location sorting", () => {
  const locations: BoardLocation[] = [
    { id: "loc-3", name: "Moria", x: 0.3, y: 0.3 },
    { id: "loc-1", name: "Bree", x: 0.1, y: 0.1 },
    { id: "loc-2", name: "Rivendell", x: 0.2, y: 0.2 },
  ];

  it("sorts locations by name in both directions", () => {
    expect(
      sortLocationsForWorkbench(locations, {}, { field: "name", direction: "asc" })
        .map((location) => location.id),
    ).toEqual(["loc-1", "loc-3", "loc-2"]);

    expect(
      sortLocationsForWorkbench(locations, {}, { field: "name", direction: "desc" })
        .map((location) => location.id),
    ).toEqual(["loc-2", "loc-3", "loc-1"]);
  });

  it("sorts locations by region state in both directions", () => {
    const locationStates = {
      "loc-1": { region: "shire" },
      "loc-2": { region: "eriador" },
      "loc-3": { region: "mordor" },
    };

    expect(
      sortLocationsForWorkbench(locations, locationStates, {
        field: "region",
        direction: "asc",
      }).map((location) => location.id),
    ).toEqual(["loc-2", "loc-3", "loc-1"]);

    expect(
      sortLocationsForWorkbench(locations, locationStates, {
        field: "region",
        direction: "desc",
      }).map((location) => location.id),
    ).toEqual(["loc-1", "loc-3", "loc-2"]);
  });
});
