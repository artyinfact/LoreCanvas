export interface HarnessValidationResult {
  errors: string[];
  warnings: string[];
}

export interface AgentRoleDefinition {
  id: string;
  mode: "read" | "write";
}

export interface WriteSetHarness {
  maxParallelWriteAgents: number;
  sharedFiles: string[];
  roles: AgentRoleDefinition[];
}

export interface WorkPacketClaim {
  id: string;
  owner: string;
  status: string;
  writeSet: string[];
}

export function validateRepositoryState(root?: string): HarnessValidationResult;
export function printValidationResult(result: HarnessValidationResult): void;
export function pathPatternsOverlap(left: string, right: string): boolean;
export function getWriteSetErrors(
  harness: WriteSetHarness,
  packets: WorkPacketClaim[],
): string[];
