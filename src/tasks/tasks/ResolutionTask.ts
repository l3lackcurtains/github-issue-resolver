import { ClaudeCodeTask, TaskContext, TaskResult } from '../../models/interfaces';
import { ModelManager } from '../../models/ModelManager';
import { GitHubClient } from '../../github/GitHubClient';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../../utils/logger';
import { parseJsonResponse } from '../../utils/jsonParser';

export class ResolutionTask {
  constructor(
    private modelManager: ModelManager,
    private githubClient: GitHubClient
  ) {}

  getTasks(): ClaudeCodeTask[] {
    return [
      this.createBugFixTask(),
      this.createFeatureImplementationTask(),
      this.createDocumentationUpdateTask(),
      this.createRefactorTask()
    ];
  }


  private createBugFixTask(): ClaudeCodeTask {
    return {
      name: "bug-fix",
      description: "Generate bug fix implementation based on issue analysis",
      category: "resolution",
      priority: "critical",
      trigger: ["bug", "fix", "error", "crash", "broken"],
      dependencies: ["analyze-issue"],
      execute: async (context: TaskContext): Promise<TaskResult> => {
        if (!context.issueNumber) {
          return { 
            success: false, 
            message: "Issue number required",
            data: null,
            modelUsed: "none",
            tokensUsed: 0,
            cost: 0
          };
        }

        try {
          const issue = await this.githubClient.getIssue(context.issueNumber);
          const modelName = context.additionalParams?.selectedModel || 'gpt-4o';

          // Read relevant code files
          const repoFiles = await this.getRelevantFiles(context, issue);

          const prompt = `
Generate a comprehensive bug fix for this GitHub issue:

Issue: ${issue.title}
Description: ${issue.body}
Labels: ${issue.labels.map((l: any) => l.name).join(', ')}

Current code files:
${repoFiles.map(f => `${f.path}:\n\`\`\`${f.extension}\n${f.content}\n\`\`\``).join('\n\n')}

Return ONLY valid JSON (no markdown, no code blocks, no extra text) in this exact format:
{
  "rootCause": "detailed explanation of the root cause",
  "solution": "step-by-step solution description",
  "codeChanges": [
    {
      "file": "path/to/file",
      "action": "create|modify|delete",
      "content": "full file content or changes",
      "explanation": "why this change is needed"
    }
  ],
  "testCases": [
    {
      "description": "what the test validates",
      "file": "test file path",
      "content": "test code"
    }
  ],
  "risks": ["potential issues or side effects"],
  "rollbackPlan": "how to rollback if needed"
}
`;

          const aiResult = await this.modelManager.executeWithModel(prompt, modelName, { maxTokens: 8000 });
          const bugFix = parseJsonResponse(aiResult.response);

          // Create a detailed comment with the fix plan
          const comment = this.formatBugFixComment(bugFix, aiResult);
          await this.githubClient.addComment(context.issueNumber, comment);

          // If in auto-implementation mode, create the actual files
          if (context.additionalParams?.autoImplement) {
            await this.implementCodeChanges(context, bugFix.codeChanges);
          }

          return {
            success: true,
            message: `Bug fix plan generated for issue #${context.issueNumber}`,
            data: bugFix,
            modelUsed: aiResult.model,
            tokensUsed: aiResult.tokensUsed,
            cost: aiResult.cost,
            nextTasks: ['test-generation', 'create-pull-request']
          };
        } catch (error) {
          logger.error(`Bug fix generation failed for issue ${context.issueNumber}:`, error);
          return {
            success: false,
            message: `Bug fix generation failed: ${error.message}`
          };
        }
      }
    };
  }

  private createFeatureImplementationTask(): ClaudeCodeTask {
    return {
      name: "feature-implementation",
      description: "Generate feature implementation plan based on requirements",
      category: "resolution",
      priority: "medium",
      trigger: ["feature", "enhancement", "implement", "add"],
      dependencies: ["analyze-issue"],
      execute: async (context: TaskContext): Promise<TaskResult> => {
        if (!context.issueNumber) {
          return { 
            success: false, 
            message: "Issue number required",
            data: null,
            modelUsed: "none",
            tokensUsed: 0,
            cost: 0
          };
        }

        try {
          const issue = await this.githubClient.getIssue(context.issueNumber);
          const modelName = context.additionalParams?.selectedModel || 'claude-3-5-sonnet-20241022';

          const prompt = `
Create a comprehensive implementation plan for this feature request:

Title: ${issue.title}
Requirements: ${issue.body}
Labels: ${issue.labels.map((l: any) => l.name).join(', ')}

Return ONLY valid JSON (no markdown, no code blocks, no extra text) in this exact format:
{
  "featureName": "clear feature name",
  "implementationPlan": {
    "overview": "high-level approach",
    "phases": [
      {
        "name": "phase name",
        "description": "what this phase accomplishes",
        "tasks": ["task1", "task2"],
        "estimatedHours": number
      }
    ]
  },
  "technicalSpecs": {
    "architecture": "architectural decisions",
    "dependencies": ["new dependencies needed"],
    "apiChanges": "API modifications needed",
    "databaseChanges": "DB schema changes if any"
  },
  "fileStructure": [
    {
      "path": "file/path",
      "purpose": "what this file does",
      "type": "component|service|util|test"
    }
  ],
  "codeImplementation": [
    {
      "file": "path/to/file",
      "content": "implementation code",
      "explanation": "purpose and design decisions"
    }
  ],
  "testingStrategy": {
    "unitTests": ["test descriptions"],
    "integrationTests": ["test descriptions"],
    "e2eTests": ["test descriptions"]
  },
  "documentation": {
    "apiDocs": "API documentation needed",
    "userGuide": "user-facing documentation",
    "developerNotes": "implementation notes for developers"
  },
  "deploymentPlan": "how to deploy safely",
  "rollbackPlan": "rollback strategy if issues arise"
}
`;

          const aiResult = await this.modelManager.executeWithModel(prompt, modelName, { maxTokens: 8000 });
          const implementation = parseJsonResponse(aiResult.response);

          // Create detailed implementation comment
          const comment = this.formatImplementationComment(implementation, aiResult);
          await this.githubClient.addComment(context.issueNumber, comment);

          // Add implementation labels
          await this.githubClient.addLabels(context.issueNumber, [
            'implementation-ready',
            `effort-${this.calculateEffortLevel(implementation)}`
          ]);

          return {
            success: true,
            message: `Feature implementation plan generated for issue #${context.issueNumber}`,
            data: implementation,
            modelUsed: aiResult.model,
            tokensUsed: aiResult.tokensUsed,
            cost: aiResult.cost,
            nextTasks: ['test-generation', 'documentation-update']
          };
        } catch (error) {
          logger.error(`Feature implementation planning failed for issue ${context.issueNumber}:`, error);
          return {
            success: false,
            message: `Feature implementation planning failed: ${error.message}`
          };
        }
      }
    };
  }

  private createDocumentationUpdateTask(): ClaudeCodeTask {
    return {
      name: "documentation-update",
      description: "Update documentation for code changes",
      category: "resolution",
      priority: "medium",
      trigger: ["documentation", "docs", "readme", "api"],
      execute: async (context: TaskContext): Promise<TaskResult> => {
        try {
          const changes = context.additionalParams?.changes || 'Recent project updates';
          const modelName = context.additionalParams?.selectedModel || 'gpt-4o-mini';

          // Read existing documentation files
          const docFiles = await this.getDocumentationFiles(context.workingDirectory);

          const prompt = `
Update documentation for these changes:
${changes}

Current documentation files:
${docFiles.map(f => `${f.path}:\n${f.content.substring(0, 1000)}`).join('\n\n')}

Return ONLY valid JSON (no markdown, no code blocks, no extra text) in this exact format:
{
  "updates": [
    {
      "file": "file path",
      "content": "updated content",
      "changesSummary": "what was changed and why"
    }
  ],
  "newFiles": [
    {
      "file": "new file path",
      "content": "new file content",
      "purpose": "why this file is needed"
    }
  ],
  "changelog": {
    "version": "version number",
    "date": "YYYY-MM-DD",
    "changes": ["change1", "change2"]
  }
}

Important: Ensure all strings are properly escaped for JSON (escape quotes, newlines, etc.)
`;

          const aiResult = await this.modelManager.executeWithModel(prompt, modelName);
          const docUpdate = parseJsonResponse(aiResult.response);

          // Apply documentation updates if auto-update is enabled
          if (context.additionalParams?.autoUpdate) {
            await this.applyDocumentationUpdates(context, docUpdate);
          }

          return {
            success: true,
            message: `Documentation update plan generated`,
            data: docUpdate,
            modelUsed: aiResult.model,
            tokensUsed: aiResult.tokensUsed,
            cost: aiResult.cost
          };
        } catch (error) {
          return {
            success: false,
            message: `Documentation update failed: ${error.message}`
          };
        }
      }
    };
  }

  private createRefactorTask(): ClaudeCodeTask {
    return {
      name: "refactor",
      description: "Refactor code for better maintainability and performance",
      category: "resolution",
      priority: "low",
      trigger: ["refactor", "cleanup", "optimize", "improve"],
      execute: async (context: TaskContext): Promise<TaskResult> => {
        try {
          const targetFiles = context.additionalParams?.files || [];
          const modelName = context.additionalParams?.selectedModel || 'claude-3-5-sonnet-20241022';

          if (targetFiles.length === 0) {
            return { 
              success: false, 
              message: "No files specified for refactoring",
              data: null,
              modelUsed: modelName,
              tokensUsed: 0,
              cost: 0
            };
          }

          const codeFiles = await this.readFiles(context.workingDirectory, targetFiles);

          const prompt = `
Refactor these code files for better maintainability, performance, and code quality:

${codeFiles.map(f => `${f.path}:\n\`\`\`${f.extension}\n${f.content}\n\`\`\``).join('\n\n')}

Return ONLY valid JSON (no markdown, no code blocks, no extra text) in this exact format:
{
  "refactoringPlan": {
    "overview": "what will be improved",
    "benefits": ["benefit1", "benefit2"],
    "risks": ["risk1", "risk2"]
  },
  "changes": [
    {
      "file": "file path",
      "originalContent": "current code",
      "refactoredContent": "improved code",
      "improvements": ["what was improved"],
      "explanation": "why these changes improve the code"
    }
  ],
  "testingNeeded": ["areas that need testing after refactoring"],
  "migrationSteps": ["step-by-step migration if needed"]
}
`;

          const aiResult = await this.modelManager.executeWithModel(prompt, modelName, { maxTokens: 8000 });
          const refactoring = parseJsonResponse(aiResult.response);

          return {
            success: true,
            message: `Refactoring plan generated for ${targetFiles.length} files`,
            data: refactoring,
            modelUsed: aiResult.model,
            tokensUsed: aiResult.tokensUsed,
            cost: aiResult.cost,
            nextTasks: ['test-generation']
          };
        } catch (error) {
          return {
            success: false,
            message: `Refactoring failed: ${error.message}`
          };
        }
      }
    };
  }

  // Helper methods
  private async getRelevantFiles(context: TaskContext, _issue: any): Promise<Array<{path: string, content: string, extension: string}>> {
    // This is a simplified implementation
    // In a real implementation, this would analyze the issue and find relevant files
    const commonFiles = [
      'package.json',
      'src/index.ts',
      'src/main.ts',
      'README.md'
    ];

    const files = [];
    for (const filePath of commonFiles) {
      try {
        const fullPath = path.join(context.workingDirectory, filePath);
        const content = await fs.readFile(fullPath, 'utf8');
        const extension = path.extname(filePath).substring(1) || 'txt';
        files.push({ path: filePath, content: content.substring(0, 2000), extension });
      } catch (error) {
        // File doesn't exist, continue
      }
    }

    return files;
  }

  private async getDocumentationFiles(workingDir: string): Promise<Array<{path: string, content: string}>> {
    const docPaths = [
      'README.md',
      'CHANGELOG.md',
      'API.md',
      'docs/README.md',
      'docs/API.md'
    ];

    const files = [];
    for (const docPath of docPaths) {
      try {
        const fullPath = path.join(workingDir, docPath);
        const content = await fs.readFile(fullPath, 'utf8');
        files.push({ path: docPath, content: content.substring(0, 3000) });
      } catch (error) {
        // File doesn't exist, continue
      }
    }

    return files;
  }

  private async readFiles(workingDir: string, filePaths: string[]): Promise<Array<{path: string, content: string, extension: string}>> {
    const files = [];
    for (const filePath of filePaths) {
      try {
        const fullPath = path.join(workingDir, filePath);
        const content = await fs.readFile(fullPath, 'utf8');
        const extension = path.extname(filePath).substring(1) || 'txt';
        files.push({ path: filePath, content, extension });
      } catch (error) {
        logger.warn(`Could not read file ${filePath}:`, error);
      }
    }
    return files;
  }

  private async implementCodeChanges(context: TaskContext, codeChanges: any[]): Promise<void> {
    for (const change of codeChanges) {
      const fullPath = path.join(context.workingDirectory, change.file);
      
      try {
        if (change.action === 'create' || change.action === 'modify') {
          // Ensure directory exists
          await fs.mkdir(path.dirname(fullPath), { recursive: true });
          await fs.writeFile(fullPath, change.content, 'utf8');
          logger.info(`${change.action === 'create' ? 'Created' : 'Modified'} file: ${change.file}`);
        } else if (change.action === 'delete') {
          await fs.unlink(fullPath);
          logger.info(`Deleted file: ${change.file}`);
        }
      } catch (error) {
        logger.error(`Failed to ${change.action} file ${change.file}:`, error);
      }
    }
  }

  private async applyDocumentationUpdates(context: TaskContext, docUpdate: any): Promise<void> {
    // Update existing files
    for (const update of docUpdate.updates || []) {
      const fullPath = path.join(context.workingDirectory, update.file);
      try {
        await fs.writeFile(fullPath, update.content, 'utf8');
        logger.info(`Updated documentation: ${update.file}`);
      } catch (error) {
        logger.error(`Failed to update ${update.file}:`, error);
      }
    }

    // Create new files
    for (const newFile of docUpdate.newFiles || []) {
      const fullPath = path.join(context.workingDirectory, newFile.file);
      try {
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, newFile.content, 'utf8');
        logger.info(`Created new documentation: ${newFile.file}`);
      } catch (error) {
        logger.error(`Failed to create ${newFile.file}:`, error);
      }
    }
  }

  private formatBugFixComment(bugFix: any, aiResult: any): string {
    return `## 🔧 Bug Fix Analysis (${aiResult.model})

### Root Cause
${bugFix.rootCause}

### Solution
${bugFix.solution}

### Code Changes Required
${bugFix.codeChanges?.map((change: any) => 
  `**${change.file}** (${change.action})\n${change.explanation}`
).join('\n\n') || 'No code changes specified'}

### Test Cases
${bugFix.testCases?.map((test: any) => 
  `- ${test.description}`
).join('\n') || 'No specific tests mentioned'}

### Risks & Considerations
${bugFix.risks?.map((risk: string) => `- ${risk}`).join('\n') || 'No risks identified'}

### Rollback Plan
${bugFix.rollbackPlan || 'Standard git revert process'}

---
*Analysis cost: ${aiResult.cost.toFixed(6)} | Tokens: ${aiResult.tokensUsed}*`;
  }

  private formatImplementationComment(implementation: any, aiResult: any): string {
    const totalHours = implementation.implementationPlan?.phases?.reduce(
      (sum: number, phase: any) => sum + (phase.estimatedHours || 0), 0
    ) || 0;

    return `## 🚀 Feature Implementation Plan (${aiResult.model})

### ${implementation.featureName}

**Total Estimated Hours:** ${totalHours}

### Implementation Overview
${implementation.implementationPlan?.overview || 'No overview provided'}

### Implementation Phases
${implementation.implementationPlan?.phases?.map((phase: any, index: number) => 
  `**Phase ${index + 1}: ${phase.name}** (${phase.estimatedHours}h)
${phase.description}
Tasks: ${phase.tasks?.join(', ') || 'No tasks specified'}`
).join('\n\n') || 'No phases defined'}

### Technical Specifications
- **Architecture:** ${implementation.technicalSpecs?.architecture || 'Not specified'}
- **New Dependencies:** ${implementation.technicalSpecs?.dependencies?.join(', ') || 'None'}
- **API Changes:** ${implementation.technicalSpecs?.apiChanges || 'None'}
- **Database Changes:** ${implementation.technicalSpecs?.databaseChanges || 'None'}

### Testing Strategy
- **Unit Tests:** ${implementation.testingStrategy?.unitTests?.length || 0} test cases
- **Integration Tests:** ${implementation.testingStrategy?.integrationTests?.length || 0} test cases
- **E2E Tests:** ${implementation.testingStrategy?.e2eTests?.length || 0} test cases

### Documentation Required
${implementation.documentation ? Object.entries(implementation.documentation)
  .map(([key, value]) => `- **${key}:** ${value}`)
  .join('\n') : 'No documentation specified'}

---
*Analysis cost: ${aiResult.cost.toFixed(6)} | Tokens: ${aiResult.tokensUsed}*`;
  }

  private calculateEffortLevel(implementation: any): string {
    const totalHours = implementation.implementationPlan?.phases?.reduce(
      (sum: number, phase: any) => sum + (phase.estimatedHours || 0), 0
    ) || 0;

    if (totalHours < 8) return 'small';
    if (totalHours < 24) return 'medium';
    return 'large';
  }
}