import {
  ClaudeCodeTask,
  TaskContext,
  TaskResult,
} from "../../models/interfaces";
import { ModelManager } from "../../models/ModelManager";
import { GitHubClient } from "../../github/GitHubClient";
import * as fs from "fs/promises";
import * as path from "path";
import { logger } from "../../utils/logger";

export class ReportingTask {
  constructor(
    private modelManager: ModelManager,
    private githubClient: GitHubClient
  ) {}

  getTasks(): ClaudeCodeTask[] {
    return [
      this.createGenerateReportTask(),
      this.createMetricsTask(),
      this.createProgressTrackingTask(),
      this.createHealthCheckTask(),
    ];
  }

  private createGenerateReportTask(): ClaudeCodeTask {
    return {
      name: "generate-report",
      description: "Generate comprehensive project health report",
      category: "reporting",
      priority: "low",
      trigger: ["report", "summary", "status", "metrics"],
      execute: async (context: TaskContext): Promise<TaskResult> => {
        try {
          const reportData = await this.gatherReportData(context);
          const modelName =
            context.additionalParams?.selectedModel || "gpt-4o-mini";

          const prompt = `
Generate a comprehensive project report based on this data:

Project: ${context.owner}/${context.repository}
Data Collection Date: ${new Date().toISOString()}

Issue Statistics:
${JSON.stringify(reportData.issues, null, 2)}

Code Metrics:
${JSON.stringify(reportData.codeMetrics, null, 2)}

Dependencies:
${JSON.stringify(reportData.dependencies, null, 2)}

Recent Activity:
${JSON.stringify(reportData.recentActivity, null, 2)}

Create a professional markdown report with:
1. Executive Summary
2. Project Health Score (1-10)
3. Key Metrics Dashboard
4. Issue Analysis
5. Code Quality Assessment
6. Dependency Health
7. Recommendations
8. Action Items

Format as markdown with proper sections and visual elements.
`;

          const aiResult = await this.modelManager.executeWithModel(
            prompt,
            modelName,
            { maxTokens: 6000 }
          );

          const reportPath = path.join(
            context.workingDirectory,
            `project-report-${Date.now()}.md`
          );
          await fs.writeFile(reportPath, aiResult.response);

          return {
            success: true,
            message: "Project report generated successfully",
            data: {
              reportPath,
              reportData,
              healthScore: this.calculateHealthScore(reportData),
            },
            filesModified: [reportPath],
            modelUsed: aiResult.model,
            tokensUsed: aiResult.tokensUsed,
            cost: aiResult.cost,
          };
        } catch (error) {
          return {
            success: false,
            message: `Report generation failed: ${error.message}`,
          };
        }
      },
    };
  }

  private createMetricsTask(): ClaudeCodeTask {
    return {
      name: "metrics",
      description: "Collect and analyze project metrics",
      category: "reporting",
      priority: "medium",
      trigger: ["metrics", "analytics", "stats", "data"],
      execute: async (context: TaskContext): Promise<TaskResult> => {
        try {
          const metrics = await this.collectMetrics(context);

          return {
            success: true,
            message: "Metrics collected successfully",
            data: metrics,
            modelUsed: "system",
            tokensUsed: 0,
            cost: 0
          };
        } catch (error) {
          return {
            success: false,
            message: `Metrics collection failed: ${error.message}`,
          };
        }
      },
    };
  }

  private createProgressTrackingTask(): ClaudeCodeTask {
    return {
      name: "progress-tracking",
      description: "Track progress on issues and milestones",
      category: "reporting",
      priority: "medium",
      trigger: ["progress", "tracking", "milestone", "sprint"],
      execute: async (context: TaskContext): Promise<TaskResult> => {
        try {
          const progress = await this.trackProgress(context);

          return {
            success: true,
            message: "Progress tracking completed",
            data: progress,
            modelUsed: "system",
            tokensUsed: 0,
            cost: 0
          };
        } catch (error) {
          return {
            success: false,
            message: `Progress tracking failed: ${error.message}`,
          };
        }
      },
    };
  }

  private createHealthCheckTask(): ClaudeCodeTask {
    return {
      name: "health-check",
      description: "Perform comprehensive project health check",
      category: "reporting",
      priority: "high",
      trigger: ["health", "check", "status", "overview"],
      execute: async (context: TaskContext): Promise<TaskResult> => {
        try {
          const healthData = await this.performHealthCheck(context);
          const healthScore = this.calculateHealthScore(healthData);

          // Create health check issue if score is low
          if (healthScore < 6) {
            await this.githubClient.createIssue(
              `🏥 Project Health Alert - Score: ${healthScore}/10`,
              this.formatHealthAlert(healthData, healthScore),
              ["health-check", "automated", "priority"]
            );
          }

          return {
            success: true,
            message: `Health check completed. Score: ${healthScore}/10`,
            data: {
              healthScore,
              ...healthData,
            },
            modelUsed: "system",
            tokensUsed: 0,
            cost: 0
          };
        } catch (error) {
          return {
            success: false,
            message: `Health check failed: ${error.message}`,
          };
        }
      },
    };
  }

  // Helper methods
  private async gatherReportData(context: TaskContext): Promise<any> {
    const [issues, codeMetrics, dependencies, recentActivity] =
      await Promise.all([
        this.getIssueStatistics(context),
        this.getCodeMetrics(context),
        this.getDependencyInfo(context),
        this.getRecentActivity(context),
      ]);

    return {
      issues,
      codeMetrics,
      dependencies,
      recentActivity,
      timestamp: new Date().toISOString(),
    };
  }

  private async getIssueStatistics(_context: TaskContext): Promise<any> {
    try {
      const issues = await this.githubClient.getOpenIssues();

      const stats = {
        total: issues.length,
        byLabel: {} as Record<string, number>,
        byPriority: { high: 0, medium: 0, low: 0 },
        oldestIssue: null as any,
        averageAge: 0,
      };

      let totalAge = 0;
      let oldestDate = new Date();

      issues.forEach((issue) => {
        // Count by labels
        issue.labels.forEach((label: any) => {
          const labelName = label.name;
          stats.byLabel[labelName] = (stats.byLabel[labelName] || 0) + 1;
        });

        // Calculate age
        const createdAt = new Date(issue.created_at);
        const age = Date.now() - createdAt.getTime();
        totalAge += age;

        if (createdAt < oldestDate) {
          oldestDate = createdAt;
          stats.oldestIssue = {
            number: issue.number,
            title: issue.title,
            age: Math.floor(age / (1000 * 60 * 60 * 24)), // days
          };
        }

        // Categorize by priority (based on labels)
        const labels = issue.labels.map((l: any) => l.name.toLowerCase());
        if (labels.includes("critical") || labels.includes("high")) {
          stats.byPriority.high++;
        } else if (labels.includes("medium")) {
          stats.byPriority.medium++;
        } else {
          stats.byPriority.low++;
        }
      });

      stats.averageAge =
        issues.length > 0
          ? Math.floor(totalAge / issues.length / (1000 * 60 * 60 * 24))
          : 0;

      return stats;
    } catch (error) {
      logger.error("Failed to get issue statistics:", error);
      return { error: error.message };
    }
  }

  private async getCodeMetrics(context: TaskContext): Promise<any> {
    try {
      // Read package.json for basic info
      const packageJsonPath = path.join(
        context.workingDirectory,
        "package.json"
      );
      let packageInfo = {};

      try {
        const packageJson = JSON.parse(
          await fs.readFile(packageJsonPath, "utf8")
        );
        packageInfo = {
          name: packageJson.name,
          version: packageJson.version,
          dependencies: Object.keys(packageJson.dependencies || {}).length,
          devDependencies: Object.keys(packageJson.devDependencies || {})
            .length,
          scripts: Object.keys(packageJson.scripts || {}).length,
        };
      } catch (error) {
        logger.warn("Could not read package.json:", error);
      }

      // Count files by type
      const fileStats = await this.countFilesByType(context.workingDirectory);

      return {
        package: packageInfo,
        files: fileStats,
        estimatedLinesOfCode: fileStats.totalFiles * 50, // rough estimate
      };
    } catch (error) {
      logger.error("Failed to get code metrics:", error);
      return { error: error.message };
    }
  }

  private async getDependencyInfo(context: TaskContext): Promise<any> {
    try {
      const packageJsonPath = path.join(
        context.workingDirectory,
        "package.json"
      );
      const packageJson = JSON.parse(
        await fs.readFile(packageJsonPath, "utf8")
      );

      return {
        production: Object.keys(packageJson.dependencies || {}),
        development: Object.keys(packageJson.devDependencies || {}),
        total:
          Object.keys(packageJson.dependencies || {}).length +
          Object.keys(packageJson.devDependencies || {}).length,
      };
    } catch (error) {
      return { error: "Could not read package.json" };
    }
  }

  private async getRecentActivity(_context: TaskContext): Promise<any> {
    // This would integrate with Git to get recent commits, etc.
    // For now, return placeholder data
    return {
      recentCommits: 0,
      recentIssues: 0,
      recentPRs: 0,
      lastActivity: new Date().toISOString(),
    };
  }

  private async countFilesByType(workingDir: string): Promise<any> {
    const fileTypes = {
      typescript: 0,
      javascript: 0,
      json: 0,
      markdown: 0,
      other: 0,
      totalFiles: 0,
    };

    try {
      const countFiles = async (dir: string): Promise<void> => {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          if (
            entry.isDirectory() &&
            !entry.name.startsWith(".") &&
            entry.name !== "node_modules"
          ) {
            await countFiles(path.join(dir, entry.name));
          } else if (entry.isFile()) {
            fileTypes.totalFiles++;
            const ext = path.extname(entry.name).toLowerCase();

            switch (ext) {
              case ".ts":
              case ".tsx":
                fileTypes.typescript++;
                break;
              case ".js":
              case ".jsx":
                fileTypes.javascript++;
                break;
              case ".json":
                fileTypes.json++;
                break;
              case ".md":
                fileTypes.markdown++;
                break;
              default:
                fileTypes.other++;
            }
          }
        }
      };

      await countFiles(workingDir);
    } catch (error) {
      logger.error("Error counting files:", error);
    }

    return fileTypes;
  }

  private async collectMetrics(context: TaskContext): Promise<any> {
    const metrics = await this.gatherReportData(context);

    return {
      ...metrics,
      collected_at: new Date().toISOString(),
      repository: `${context.owner}/${context.repository}`,
    };
  }

  private async trackProgress(_context: TaskContext): Promise<any> {
    const issues = await this.githubClient.getOpenIssues();

    // Group issues by milestones, labels, etc.
    const progress = {
      totalIssues: issues.length,
      completedThisWeek: 0, // Would calculate from closed issues
      inProgress: issues.filter((i) =>
        i.labels.some((l: any) => l.name.includes("in-progress"))
      ).length,
      blocked: issues.filter((i) =>
        i.labels.some((l: any) => l.name.includes("blocked"))
      ).length,
      milestones: {},
    };

    return progress;
  }

  private async performHealthCheck(context: TaskContext): Promise<any> {
    const data = await this.gatherReportData(context);

    const health = {
      ...data,
      checks: {
        hasRecentActivity: data.recentActivity?.recentCommits > 0,
        lowIssueCount: data.issues?.total < 50,
        noCriticalIssues: data.issues?.byPriority?.high < 5,
        upToDateDependencies: true, // Would check with npm outdated
        hasTests: data.codeMetrics?.files?.totalFiles > 0,
        hasDocumentation: data.codeMetrics?.files?.markdown > 0,
      },
    };

    return health;
  }

  private calculateHealthScore(data: any): number {
    if (!data.checks) return 5; // Default score if no checks available

    const checks = data.checks;
    const weights = {
      hasRecentActivity: 2,
      lowIssueCount: 1.5,
      noCriticalIssues: 2.5,
      upToDateDependencies: 1.5,
      hasTests: 1.5,
      hasDocumentation: 1,
    };

    let score = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([check, weight]) => {
      totalWeight += weight;
      if (checks[check]) {
        score += weight;
      }
    });

    return Math.round((score / totalWeight) * 10);
  }

  private formatHealthAlert(healthData: any, healthScore: number): string {
    const issues = [];

    if (!healthData.checks?.hasRecentActivity) {
      issues.push("- No recent activity detected");
    }
    if (!healthData.checks?.lowIssueCount) {
      issues.push("- High number of open issues");
    }
    if (!healthData.checks?.noCriticalIssues) {
      issues.push("- Critical issues need attention");
    }
    if (!healthData.checks?.upToDateDependencies) {
      issues.push("- Dependencies may be outdated");
    }
    if (!healthData.checks?.hasTests) {
      issues.push("- Test coverage may be insufficient");
    }
    if (!healthData.checks?.hasDocumentation) {
      issues.push("- Documentation needs improvement");
    }

    return `# 🏥 Project Health Alert

## Health Score: ${healthScore}/10

### Issues Identified:
${issues.join("\n")}

### Recommendations:
1. Address critical and high-priority issues first
2. Update dependencies to latest stable versions
3. Improve test coverage
4. Update documentation
5. Increase development activity

### Next Steps:
- [ ] Review and prioritize open issues
- [ ] Update outdated dependencies
- [ ] Add missing tests
- [ ] Update documentation
- [ ] Set up regular health monitoring

---
*This alert was generated automatically based on project metrics.*`;
  }
}
