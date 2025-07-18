export interface ParsedGitHubURL {
  owner: string;
  repo: string;
  issueNumber: number;
}

export interface ParsedGitHubRepoURL {
  owner: string;
  repo: string;
}

export function parseGitHubURL(input: string): ParsedGitHubURL | null {
  // Regular expression to match GitHub issue URLs
  const patterns = [
    // https://github.com/owner/repo/issues/123
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)\/?$/,
    // github.com/owner/repo/issues/123
    /^github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)\/?$/,
    // owner/repo/issues/123
    /^([^/]+)\/([^/]+)\/issues\/(\d+)$/,
    // owner/repo#123
    /^([^/]+)\/([^/]+)#(\d+)$/
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2],
        issueNumber: parseInt(match[3], 10)
      };
    }
  }

  return null;
}

export function parseGitHubRepoURL(input: string): ParsedGitHubRepoURL | null {
  // Regular expression to match GitHub repository URLs
  const patterns = [
    // https://github.com/owner/repo
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/?$/,
    // github.com/owner/repo
    /^github\.com\/([^/]+)\/([^/]+)\/?$/,
    // owner/repo
    /^([^/]+)\/([^/]+)$/
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2]
      };
    }
  }

  return null;
}

export function isGitHubURL(input: string): boolean {
  return parseGitHubURL(input) !== null;
}

export function isGitHubRepoURL(input: string): boolean {
  return parseGitHubRepoURL(input) !== null;
}