import { parseGitHubURL, isGitHubURL } from './urlParser';

describe('urlParser', () => {
  describe('parseGitHubURL', () => {
    it('should parse full GitHub URL', () => {
      const result = parseGitHubURL('https://github.com/owner/repo/issues/123');
      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        issueNumber: 123
      });
    });

    it('should parse GitHub URL without protocol', () => {
      const result = parseGitHubURL('github.com/owner/repo/issues/456');
      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        issueNumber: 456
      });
    });

    it('should parse short format', () => {
      const result = parseGitHubURL('owner/repo/issues/789');
      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        issueNumber: 789
      });
    });

    it('should parse hash format', () => {
      const result = parseGitHubURL('owner/repo#111');
      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        issueNumber: 111
      });
    });

    it('should return null for invalid URLs', () => {
      expect(parseGitHubURL('not-a-url')).toBeNull();
      expect(parseGitHubURL('123')).toBeNull();
      expect(parseGitHubURL('https://example.com')).toBeNull();
    });
  });

  describe('isGitHubURL', () => {
    it('should return true for valid GitHub URLs', () => {
      expect(isGitHubURL('https://github.com/owner/repo/issues/123')).toBe(true);
      expect(isGitHubURL('github.com/owner/repo/issues/456')).toBe(true);
      expect(isGitHubURL('owner/repo#789')).toBe(true);
    });

    it('should return false for non-GitHub URLs', () => {
      expect(isGitHubURL('123')).toBe(false);
      expect(isGitHubURL('not-a-url')).toBe(false);
      expect(isGitHubURL('https://example.com')).toBe(false);
    });
  });
});