import { Octokit } from "@octokit/rest";
import { logger } from '../utils/logger';

export class GitHubClient {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(token: string, owner: string, repo: string) {
    this.octokit = new Octokit({ auth: token });
    this.owner = owner;
    this.repo = repo;
  }

  async getOpenIssues(): Promise<any[]> {
    try {
      const response = await this.octokit.rest.issues.listForRepo({
        owner: this.owner,
        repo: this.repo,
        state: "open",
        per_page: 100,
      });
      return response.data;
    } catch (error) {
      logger.error("Error fetching issues:", error);
      throw error;
    }
  }

  async getIssue(issueNumber: number): Promise<any> {
    try {
      const response = await this.octokit.rest.issues.get({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
      });
      return response.data;
    } catch (error) {
      logger.error(`Error fetching issue ${issueNumber}:`, error);
      throw error;
    }
  }

  async addComment(issueNumber: number, comment: string): Promise<void> {
    try {
      await this.octokit.rest.issues.createComment({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        body: comment,
      });
      logger.info(`Comment added to issue #${issueNumber}`);
    } catch (error) {
      logger.error(`Error adding comment to issue ${issueNumber}:`, error);
      throw error;
    }
  }

  async addLabels(issueNumber: number, labels: string[]): Promise<void> {
    try {
      await this.octokit.rest.issues.addLabels({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        labels,
      });
      logger.info(`Labels added to issue #${issueNumber}: ${labels.join(', ')}`);
    } catch (error) {
      logger.error(`Error adding labels to issue ${issueNumber}:`, error);
      throw error;
    }
  }

  async assignIssue(issueNumber: number, assignee: string): Promise<void> {
    try {
      await this.octokit.rest.issues.addAssignees({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        assignees: [assignee],
      });
      logger.info(`Issue #${issueNumber} assigned to ${assignee}`);
    } catch (error) {
      logger.error(`Error assigning issue ${issueNumber}:`, error);
      throw error;
    }
  }

  async closeIssue(issueNumber: number, reason?: string): Promise<void> {
    try {
      if (reason) {
        await this.addComment(issueNumber, `Closing issue: ${reason}`);
      }
      
      await this.octokit.rest.issues.update({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        state: "closed",
      });
      logger.info(`Issue #${issueNumber} closed`);
    } catch (error) {
      logger.error(`Error closing issue ${issueNumber}:`, error);
      throw error;
    }
  }

  async createIssue(title: string, body: string, labels?: string[]): Promise<number> {
    try {
      const response = await this.octokit.rest.issues.create({
        owner: this.owner,
        repo: this.repo,
        title,
        body,
        labels: labels || [],
      });
      logger.info(`Created issue #${response.data.number}: ${title}`);
      return response.data.number;
    } catch (error) {
      logger.error("Error creating issue:", error);
      throw error;
    }
  }
}