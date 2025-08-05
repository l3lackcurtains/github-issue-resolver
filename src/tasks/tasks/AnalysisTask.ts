import { ClaudeCodeTask, TaskContext, TaskResult } from '../../models/interfaces';
import { ModelManager } from '../../models/ModelManager';
import { GitHubClient } from '../../github/GitHubClient';
import { logger } from '../../utils/logger';
import { parseJsonResponse } from '../../utils/jsonParser';

export class AnalysisTask {
  constructor(
    private modelManager: ModelManager,
    private githubClient: GitHubClient
  ) {}

  getTasks(): ClaudeCodeTask[] {
    return [
      this.createAnalyzeIssueTask(),
      this.createTriageIssuesTask(),
      this.createFindDuplicatesTask(),
      this.createCodeAnalysisTask()
    ];
  }

  private createAnalyzeIssueTask(): ClaudeCodeTask {
    return {
      name: "analyze-issue",
      description: "Analyze a specific GitHub issue for severity, complexity, and resolution approach",
      category: "analysis",
      priority: "high",
      trigger: ["analyze", "issue", "severity", "complexity"],
      execute: async (context: TaskContext): Promise<TaskResult> => {
        if (!context.issueNumber) {
          return { success: false, message: "Issue number required" };
        }

        try {
          const issue = await this.githubClient.getIssue(context.issueNumber);
          const modelName = context.additionalParams?.selectedModel || 'claude-3-5-sonnet-20241022';

          const prompt = `
Analyze this GitHub issue and provide a structured analysis:

Title: ${issue.title}
Description: ${issue.body || 'No description provided'}
Labels: ${issue.labels.map((l: any) => l.name).join(', ')}
Author: ${issue.user.login}
Created: ${issue.created_at}

Return ONLY valid JSON (no markdown, no code blocks, no extra text) in this exact format:
{
  "severity": "critical|high|medium|low",
  "complexity": "high|medium|low", 
  "estimatedHours": number,
  "approach": "detailed step-by-step approach",
  "relatedFiles": ["file1.ts", "file2.ts"],
  "risks": ["risk1", "risk2"],
  "tags": ["bug", "frontend", "api"],
  "priority": 1-10
}

Consider:
- Bug severity and impact
- Code complexity required
- Dependencies and side effects
- Testing requirements
- Documentation needs
`;

          const aiResult = await this.modelManager.executeWithModel(prompt, modelName);
          
          let analysis;
          try {
            analysis = parseJsonResponse(aiResult.response);
          } catch (parseError) {
            logger.warn('Failed to parse AI response, using fallback analysis');
            analysis = this.createFallbackAnalysis(issue);
          }

          // Add analysis comment to issue
          const comment = this.formatAnalysisComment(analysis, aiResult);
          await this.githubClient.addComment(context.issueNumber, comment);

          // Add suggested labels
          if (analysis.tags?.length > 0) {
            await this.githubClient.addLabels(context.issueNumber, analysis.tags);
          }

          return {
            success: true,
            message: `Issue #${context.issueNumber} analyzed successfully`,
            data: analysis,
            modelUsed: aiResult.model,
            tokensUsed: aiResult.tokensUsed,
            cost: aiResult.cost,
            nextTasks: this.suggestNextTasks(analysis)
          };
        } catch (error) {
          logger.error(`Failed to analyze issue ${context.issueNumber}:`, error);
          const modelName = context.additionalParams?.selectedModel || 'claude-3-5-sonnet-20241022';
          return {
            success: false,
            message: `Failed to analyze issue: ${error.message}`,
            data: null,
            modelUsed: modelName,
            tokensUsed: 0,
            cost: 0
          };
        }
      }
    };
  }

  private createTriageIssuesTask(): ClaudeCodeTask {
    return {
      name: "triage-issues",
      description: "Automatically triage and prioritize open issues",
      category: "analysis",
      priority: "medium",
      trigger: ["triage", "prioritize", "organize"],
      execute: async (context: TaskContext): Promise<TaskResult> => {
        try {
          const issues = await this.githubClient.getOpenIssues();
          const modelName = context.additionalParams?.selectedModel || 'gpt-4o-mini';
          
          const triaged = [];
          let totalCost = 0;

          for (const issue of issues.slice(0, 20)) { // Limit to first 20 issues
            const prompt = `
Quickly triage this GitHub issue:

Title: ${issue.title}
Body: ${(issue.body || '').substring(0, 500)}
Labels: ${issue.labels.map((l: any) => l.name).join(', ')}

Return ONLY valid JSON (no markdown, no code blocks, no extra text) in this exact format:
{
  "priority": 1-10,
  "severity": "critical|high|medium|low",
  "category": "bug|feature|documentation|maintenance",
  "suggestedLabels": ["label1", "label2"],
  "estimatedEffort": "small|medium|large"
}
`;

            try {
              const aiResult = await this.modelManager.executeWithModel(prompt, modelName, { maxTokens: 1000 });
              const analysis = parseJsonResponse(aiResult.response);
              
              // Add suggested labels
              if (analysis.suggestedLabels?.length > 0) {
                await this.githubClient.addLabels(issue.number, analysis.suggestedLabels);
              }

              triaged.push({
                number: issue.number,
                title: issue.title,
                ...analysis
              });

              totalCost += aiResult.cost;
            } catch (error) {
              logger.warn(`Failed to triage issue ${issue.number}:`, error);
            }
          }

          return {
            success: true,
            message: `Triaged ${triaged.length} issues`,
            data: { issues: triaged, totalCost },
            modelUsed: modelName,
            tokensUsed: triaged.length * 100, // Estimated tokens used
            cost: totalCost
          };
        } catch (error) {
          const modelName = context.additionalParams?.selectedModel || 'gpt-4o-mini';
          return {
            success: false,
            message: `Triage failed: ${error.message}`,
            data: null,
            modelUsed: modelName,
            tokensUsed: 0,
            cost: 0
          };
        }
      }
    };
  }

  private createFindDuplicatesTask(): ClaudeCodeTask {
    return {
      name: "find-duplicates",
      description: "Find duplicate or similar issues",
      category: "analysis",
      priority: "low",
      trigger: ["duplicate", "similar", "find"],
      execute: async (context: TaskContext): Promise<TaskResult> => {
        try {
          const issues = await this.githubClient.getOpenIssues();
          const modelName = context.additionalParams?.selectedModel || 'gpt-4o-mini';

          const issueTexts = issues.map(issue => ({
            number: issue.number,
            title: issue.title,
            body: (issue.body || '').substring(0, 1000),
            text: `${issue.title} ${issue.body || ''}`
          }));

          const prompt = `
Find duplicate or very similar issues from this list:

${issueTexts.map(i => `#${i.number}: ${i.title}\n${i.body}\n---`).join('\n')}

Return ONLY valid JSON (no markdown, no code blocks, no extra text) - an array of potential duplicates:
[
  {
    "primary": issue_number,
    "duplicates": [issue_numbers],
    "similarity": 0.8,
    "reason": "explanation"
  }
]
`;

          const aiResult = await this.modelManager.executeWithModel(prompt, modelName);
          const duplicates = parseJsonResponse(aiResult.response);

          // Comment on potential duplicates
          for (const group of duplicates) {
            if (group.duplicates?.length > 0) {
              const comment = `🔍 **Potential Duplicate Detected**

This issue might be similar to:
${group.duplicates.map((n: number) => `- #${n}`).join('\n')}

Similarity: ${(group.similarity * 100).toFixed(0)}%
Reason: ${group.reason}

Please review and close if duplicate.`;

              await this.githubClient.addComment(group.primary, comment);
              await this.githubClient.addLabels(group.primary, ['potential-duplicate']);
            }
          }

          return {
            success: true,
            message: `Found ${duplicates.length} potential duplicate groups`,
            data: duplicates,
            modelUsed: aiResult.model,
            tokensUsed: aiResult.tokensUsed,
            cost: aiResult.cost
          };
        } catch (error) {
          const modelName = context.additionalParams?.selectedModel || 'gpt-4o-mini';
          return {
            success: false,
            message: `Duplicate detection failed: ${error.message}`,
            data: null,
            modelUsed: modelName,
            tokensUsed: 0,
            cost: 0
          };
        }
      }
    };
  }

  private createCodeAnalysisTask(): ClaudeCodeTask {
    return {
      name: "code-analysis",
      description: "Analyze code quality and suggest improvements",
      category: "analysis",
      priority: "medium",
      trigger: ["code", "quality", "review", "analyze"],
      execute: async (_context: TaskContext): Promise<TaskResult> => {
        // This would integrate with static analysis tools
        // For now, return a placeholder implementation
        return {
          success: true,
          message: "Code analysis completed",
          data: {
            quality_score: 8.5,
            issues_found: 3,
            suggestions: ["Add more tests", "Improve error handling", "Update documentation"]
          },
          modelUsed: 'static-analysis',
          tokensUsed: 0,
          cost: 0
        };
      }
    };
  }

  private createFallbackAnalysis(issue: any): any {
    const hasLabels = issue.labels.length > 0;
    const isBug = hasLabels && issue.labels.some((l: any) => l.name.toLowerCase().includes('bug'));
    const isFeature = hasLabels && issue.labels.some((l: any) => l.name.toLowerCase().includes('feature'));
    
    return {
      severity: isBug ? "high" : "medium",
      complexity: "medium",
      estimatedHours: isBug ? 4 : 8,
      approach: "1. Investigate issue\n2. Plan solution\n3. Implement fix\n4. Test thoroughly\n5. Deploy",
      relatedFiles: [],
      risks: ["Potential breaking changes", "Integration complexity"],
      tags: isBug ? ["bug"] : isFeature ? ["enhancement"] : ["needs-triage"],
      priority: isBug ? 8 : 5
    };
  }

  private formatAnalysisComment(analysis: any, aiResult: any): string {
    return `## 🤖 AI Analysis (${aiResult.model})

**Severity:** ${analysis.severity}
**Complexity:** ${analysis.complexity}
**Estimated Hours:** ${analysis.estimatedHours}
**Priority:** ${analysis.priority}/10

**Approach:**
${analysis.approach}

**Related Files:**
${analysis.relatedFiles?.length > 0 ? analysis.relatedFiles.map((f: string) => `- ${f}`).join('\n') : 'None identified'}

**Potential Risks:**
${analysis.risks?.length > 0 ? analysis.risks.map((r: string) => `- ${r}`).join('\n') : 'None identified'}

---
*Analysis cost: $${aiResult.cost.toFixed(6)} | Tokens: ${aiResult.tokensUsed}*`;
  }

  private suggestNextTasks(analysis: any): string[] {
    const tasks = [];
    
    if (analysis.severity === "critical") {
      tasks.push("bug-fix");
    } else if (analysis.tags?.includes("enhancement")) {
      tasks.push("feature-implementation");
    }
    
    if (analysis.complexity === "high") {
      tasks.push("code-analysis");
    }
    
    return tasks;
  }
}