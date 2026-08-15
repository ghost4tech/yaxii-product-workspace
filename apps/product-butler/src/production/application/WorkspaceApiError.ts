export class WorkspaceApiError extends Error {
  public constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly fields: Record<string, string[]> = {},
    public readonly outcomeUncertain = false,
  ) {
    super(message);
    this.name = "WorkspaceApiError";
  }
}
