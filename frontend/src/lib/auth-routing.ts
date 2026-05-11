export function getStartedDestination(isAuthenticated: boolean): string {
  return isAuthenticated ? "/workspace" : "/auth/login?next=/workspace";
}
