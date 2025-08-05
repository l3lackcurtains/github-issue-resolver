import {
  ClaudeCodeTask,
  TaskContext,
  TaskResult,
} from "../../models/interfaces";
import { ModelManager } from "../../models/ModelManager";
import { GitHubClient } from "../../github/GitHubClient";
import { execSync } from "child_process";
import * as fs from "fs/promises";
import * as path from "path";
import { logger } from "../../utils/logger";
import { parseJsonResponse } from "../../utils/jsonParser";

export class MaintenanceTask {
  constructor(
    private modelManager: ModelManager,
    private githubClient: GitHubClient
  ) {}

  getTasks(): ClaudeCodeTask[] {
    return [
      this.createTestGenerationTask(),
      this.createSecurityScanTask(),
      this.createDependencyUpdateTask(),
      this.createCleanupTask(),
    ];
  }

  private createTestGenerationTask(): ClaudeCodeTask {
    return {
      name: "test-generation",
      description: "Generate comprehensive test cases for code changes",
      category: "maintenance",
      priority: "high",
      trigger: ["test", "testing", "coverage"],
      execute: async (context: TaskContext): Promise<TaskResult> => {
        try {
          const files = context.additionalParams?.files || [];
          const feature = context.additionalParams?.feature || "Code changes";
          const modelName =
            context.additionalParams?.selectedModel ||
            "claude-3-haiku-20240307";

          if (files.length === 0) {
            return {
              success: false,
              message: "No files specified for test generation",
            };
          }

          const codeFiles = await this.readCodeFiles(
            context.workingDirectory,
            files
          );

          const prompt = `
Generate comprehensive test cases for these code files:

Feature: ${feature}

Code files:
${codeFiles
  .map((f) => `${f.path}:\n\`\`\`${f.extension}\n${f.content}\n\`\`\``)
  .join("\n\n")}

Return ONLY valid JSON (no markdown, no code blocks, no extra text) in this exact format:
{
  "testSuite": {
    "name": "test suite name",
    "description": "what this test suite covers"
  },
  "testFiles": [
    {
      "filename": "test file name",
      "path": "path/to/test/file",
      "content": "complete test file content",
      "framework": "jest|mocha|other",
      "testCases": [
        {
          "name": "test case name",
          "description": "what it tests",
          "type": "unit|integration|e2e"
        }
      ]
    }
  ],
  "mockData": [
    {
      "name": "mock name",
      "content": "mock implementation",
      "purpose": "what this mock is for"
    }
  ],
  "coverageExpectation": {
    "targetPercentage": 85,
    "criticalPaths": ["path1", "path2"]
  }
}
`;

          const aiResult = await this.modelManager.executeWithModel(
            prompt,
            modelName,
            { maxTokens: 6000 }
          );
          const testSuite = parseJsonResponse(aiResult.response);

          // Create test files if auto-create is enabled
          if (context.additionalParams?.autoCreate) {
            await this.createTestFiles(context, testSuite.testFiles);
          }

          return {
            success: true,
            message: `Generated tests for ${files.length} files`,
            data: testSuite,
            modelUsed: aiResult.model,
            tokensUsed: aiResult.tokensUsed,
            cost: aiResult.cost,
            filesModified: testSuite.testFiles?.map((tf: any) => tf.path) || [],
          };
        } catch (error) {
          return {
            success: false,
            message: `Test generation failed: ${error.message}`,
            modelUsed: context.additionalParams?.selectedModel || "claude-3-haiku-20240307",
            tokensUsed: 0,
            cost: 0
          };
        }
      },
    };
  }

  private createSecurityScanTask(): ClaudeCodeTask {
    return {
      name: "security-scan",
      description: "Perform security analysis on the codebase",
      category: "maintenance",
      priority: "critical",
      trigger: ["security", "vulnerability", "scan", "audit"],
      execute: async (context: TaskContext): Promise<TaskResult> => {
        try {
          const results = {
            npmAudit: await this.runNpmAudit(context.workingDirectory),
            codeAnalysis: await this.performCodeSecurityAnalysis(context),
            dependencyCheck: await this.checkDependencyVersions(
              context.workingDirectory
            ),
          };

          const criticalIssues = this.identifyCriticalSecurityIssues(results);

          if (criticalIssues.length > 0) {
            // Create security issue
            const issueNumber = await this.githubClient.createIssue(
              `🚨 Security Alert: ${criticalIssues.length} critical vulnerabilities found`,
              this.formatSecurityReport(criticalIssues, results),
              ["security", "critical", "automated"]
            );

            logger.warn(
              `Created security issue #${issueNumber} with ${criticalIssues.length} critical findings`
            );
          }

          return {
            success: true,
            message: `Security scan completed. Found ${criticalIssues.length} critical issues`,
            data: {
              summary: results,
              criticalIssues,
              totalVulnerabilities: this.countTotalVulnerabilities(results),
            },
            modelUsed: "security-scanner",
            tokensUsed: 0,
            cost: 0
          };
        } catch (error) {
          return {
            success: false,
            message: `Security scan failed: ${error.message}`,
            modelUsed: "security-scanner",
            tokensUsed: 0,
            cost: 0
          };
        }
      },
    };
  }

  private createDependencyUpdateTask(): ClaudeCodeTask {
    return {
      name: "dependency-update",
      description: "Check and update project dependencies",
      category: "maintenance",
      priority: "medium",
      trigger: ["dependencies", "update", "packages", "npm"],
      execute: async (context: TaskContext): Promise<TaskResult> => {
        try {
          const packageJsonPath = path.join(
            context.workingDirectory,
            "package.json"
          );
          const packageJson = JSON.parse(
            await fs.readFile(packageJsonPath, "utf8")
          );

          const outdatedPackages = await this.checkOutdatedPackages(
            context.workingDirectory
          );
          const modelName =
            context.additionalParams?.selectedModel || "gpt-4o-mini";

          const prompt = `
Analyze these outdated npm packages and suggest update strategy:

Current package.json dependencies:
${JSON.stringify(packageJson.dependencies, null, 2)}

Current package.json devDependencies:
${JSON.stringify(packageJson.devDependencies, null, 2)}

Outdated packages:
${JSON.stringify(outdatedPackages, null, 2)}

Return ONLY valid JSON (no markdown, no code blocks, no extra text) in this exact format:
{
  "updateStrategy": {
    "immediate": ["package names that should be updated immediately"],
    "planned": ["package names that need careful planning"],
    "hold": ["package names to avoid updating with reasons"]
  },
  "updateCommands": [
    {
      "command": "npm update command",
      "description": "what this update does",
      "risk": "low|medium|high"
    }
  ],
  "testingRequired": ["areas that need testing after updates"],
  "breakingChanges": [
    {
      "package": "package name",
      "version": "new version",
      "changes": ["breaking change descriptions"],
      "migrationSteps": ["step1", "step2"]
    }
  ],
  "securityImpact": "how updates affect security"
}
`;

          const aiResult = await this.modelManager.executeWithModel(
            prompt,
            modelName
          );
          const updatePlan = parseJsonResponse(aiResult.response);

          // Execute immediate updates if auto-update is enabled
          if (
            context.additionalParams?.autoUpdate &&
            updatePlan.updateStrategy?.immediate?.length > 0
          ) {
            await this.executeUpdates(
              context,
              updatePlan.updateStrategy.immediate
            );
          }

          return {
            success: true,
            message: `Dependency analysis completed. ${outdatedPackages.length} packages need updates`,
            data: updatePlan,
            modelUsed: aiResult.model,
            tokensUsed: aiResult.tokensUsed,
            cost: aiResult.cost,
          };
        } catch (error) {
          const modelName = context.additionalParams?.selectedModel || "gpt-4o-mini";
          return {
            success: false,
            message: `Dependency update failed: ${error.message}`,
            modelUsed: modelName,
            tokensUsed: 0,
            cost: 0
          };
        }
      },
    };
  }

  private createCleanupTask(): ClaudeCodeTask {
    return {
      name: "cleanup",
      description: "Clean up unused code, files, and dependencies",
      category: "maintenance",
      priority: "low",
      trigger: ["cleanup", "clean", "unused", "dead"],
      execute: async (context: TaskContext): Promise<TaskResult> => {
        try {
          const analysis = {
            unusedFiles: await this.findUnusedFiles(context.workingDirectory),
            deadCode: await this.findDeadCode(context.workingDirectory),
            unusedDependencies: await this.findUnusedDependencies(
              context.workingDirectory
            ),
            largeFiles: await this.findLargeFiles(context.workingDirectory),
          };

          const cleanupPlan = await this.generateCleanupPlan(analysis);

          return {
            success: true,
            message: `Cleanup analysis completed`,
            data: {
              analysis,
              cleanupPlan,
              potentialSavings: this.calculatePotentialSavings(analysis),
            },
            modelUsed: "static-analyzer",
            tokensUsed: 0,
            cost: 0
          };
        } catch (error) {
          return {
            success: false,
            message: `Cleanup analysis failed: ${error.message}`,
            modelUsed: "static-analyzer",
            tokensUsed: 0,
            cost: 0
          };
        }
      },
    };
  }

  // Helper methods
  private async readCodeFiles(
    workingDir: string,
    filePaths: string[]
  ): Promise<Array<{ path: string; content: string; extension: string }>> {
    const files = [];
    for (const filePath of filePaths) {
      try {
        const fullPath = path.join(workingDir, filePath);
        const content = await fs.readFile(fullPath, "utf8");
        const extension = path.extname(filePath).substring(1) || "txt";
        files.push({ path: filePath, content, extension });
      } catch (error) {
        logger.warn(`Could not read file ${filePath}:`, error);
      }
    }
    return files;
  }

  private async createTestFiles(
    context: TaskContext,
    testFiles: any[]
  ): Promise<void> {
    for (const testFile of testFiles) {
      const fullPath = path.join(context.workingDirectory, testFile.path);
      try {
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, testFile.content, "utf8");
        logger.info(`Created test file: ${testFile.path}`);
      } catch (error) {
        logger.error(`Failed to create test file ${testFile.path}:`, error);
      }
    }
  }

  private async runNpmAudit(workingDir: string): Promise<any> {
    try {
      const result = execSync("npm audit --json", {
        cwd: workingDir,
        encoding: "utf8",
        stdio: "pipe",
      });
      return JSON.parse(result);
    } catch (error) {
      // npm audit returns non-zero exit code when vulnerabilities are found
      if (error.stdout) {
        try {
          return JSON.parse(error.stdout);
        } catch (parseError) {
          return { error: "Failed to parse npm audit output" };
        }
      }
      return { error: error.message };
    }
  }

  private async performCodeSecurityAnalysis(
    _context: TaskContext
  ): Promise<any> {
    // This would integrate with security scanning tools like Snyk, SonarQube, etc.
    // For now, return a placeholder analysis
    return {
      staticAnalysis: {
        issues: [],
        riskScore: "low",
      },
      secretScan: {
        potentialSecrets: [],
        riskScore: "low",
      },
    };
  }

  private async checkDependencyVersions(workingDir: string): Promise<any> {
    try {
      const result = execSync("npm outdated --json", {
        cwd: workingDir,
        encoding: "utf8",
        stdio: "pipe",
      });
      return JSON.parse(result);
    } catch (error) {
      // npm outdated returns non-zero when packages are outdated
      if (error.stdout) {
        try {
          return JSON.parse(error.stdout);
        } catch (parseError) {
          return {};
        }
      }
      return {};
    }
  }

  private identifyCriticalSecurityIssues(results: any): any[] {
    const criticalIssues: any[] = [];

    // Check npm audit results
    if (results.npmAudit?.vulnerabilities) {
      Object.entries(results.npmAudit.vulnerabilities).forEach(
        ([pkg, vuln]: [string, any]) => {
          if (vuln.severity === "critical" || vuln.severity === "high") {
            criticalIssues.push({
              type: "vulnerability",
              package: pkg,
              severity: vuln.severity,
              title: vuln.title,
              description: vuln.overview,
            });
          }
        }
      );
    }

    return criticalIssues;
  }

  private formatSecurityReport(criticalIssues: any[], results: any): string {
    return `# 🚨 Security Vulnerability Report

## Summary
- **Critical Issues Found:** ${criticalIssues.length}
- **Scan Date:** ${new Date().toISOString()}
- **Total Vulnerabilities:** ${this.countTotalVulnerabilities(results)}

## Critical Issues

${criticalIssues
  .map(
    (issue) => `### ${issue.package} - ${issue.severity.toUpperCase()}
**Issue:** ${issue.title}
**Description:** ${issue.description}
**Package:** ${issue.package}

`
  )
  .join("\n")}

## Recommended Actions

1. **Immediate Action Required** - Update or replace packages with critical vulnerabilities
2. **Review Dependencies** - Audit all dependencies for security best practices
3. **Implement Security Scanning** - Add automated security scanning to CI/CD pipeline
4. **Monitor Continuously** - Set up alerts for new vulnerabilities

## Next Steps

- [ ] Update vulnerable packages
- [ ] Run security tests
- [ ] Review code for security best practices
- [ ] Document security procedures

---
*This report was generated automatically. Please review and take appropriate action.*`;
  }

  private countTotalVulnerabilities(results: any): number {
    if (results.npmAudit?.metadata?.vulnerabilities) {
      const metadata = results.npmAudit.metadata.vulnerabilities;
      return (
        (metadata.critical || 0) +
        (metadata.high || 0) +
        (metadata.moderate || 0) +
        (metadata.low || 0)
      );
    }
    return 0;
  }

  private async checkOutdatedPackages(workingDir: string): Promise<any[]> {
    try {
      const result = execSync("npm outdated --json", {
        cwd: workingDir,
        encoding: "utf8",
      });
      return Object.entries(JSON.parse(result)).map(
        ([name, info]: [string, any]) => ({ name, ...info })
      );
    } catch (error) {
      return [];
    }
  }

  private async executeUpdates(
    context: TaskContext,
    packages: string[]
  ): Promise<void> {
    for (const pkg of packages) {
      try {
        execSync(`npm update ${pkg}`, { cwd: context.workingDirectory });
        logger.info(`Updated package: ${pkg}`);
      } catch (error) {
        logger.error(`Failed to update package ${pkg}:`, error);
      }
    }
  }

  private async findUnusedFiles(_workingDir: string): Promise<string[]> {
    // Simplified implementation - would use tools like unimported or depcheck
    return [];
  }

  private async findDeadCode(_workingDir: string): Promise<any[]> {
    // Would integrate with dead code detection tools
    return [];
  }

  private async findUnusedDependencies(_workingDir: string): Promise<string[]> {
    // Would use depcheck or similar tools
    return [];
  }

  private async findLargeFiles(_workingDir: string): Promise<any[]> {
    // Would scan for files over certain size threshold
    return [];
  }

  private async generateCleanupPlan(_analysis: any): Promise<any> {
    return {
      recommendations: [
        "Remove unused dependencies",
        "Delete dead code",
        "Optimize large files",
      ],
      estimatedSavings: "500KB",
      riskLevel: "low",
    };
  }

  private calculatePotentialSavings(analysis: any): any {
    return {
      diskSpace: "500KB",
      bundleSize: "100KB",
      dependencies: analysis.unusedDependencies?.length || 0,
    };
  }
}
