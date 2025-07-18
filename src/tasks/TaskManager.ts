import { ModelManager } from "../models/ModelManager";
import { GitHubClient } from "../github/GitHubClient";
import { TaskContext, TaskResult, ClaudeCodeTask } from "../models/interfaces";
import { AnalysisTask } from "./tasks/AnalysisTask";
import { ResolutionTask } from "./tasks/ResolutionTask";
import { MaintenanceTask } from "./tasks/MaintenanceTask";
import { ReportingTask } from "./tasks/ReportingTask";
import { logger } from "../utils/logger";

export class TaskManager {
  private modelManager: ModelManager;
  private githubClient: GitHubClient;
  private context: TaskContext;
  private tasks: Map<string, ClaudeCodeTask> = new Map();

  constructor(context: TaskContext) {
    this.context = context;
    this.modelManager = new ModelManager();
    this.modelManager.initializeProviders();

    this.githubClient = new GitHubClient(
      context.githubToken,
      context.owner,
      context.repository
    );

    this.registerTasks();
  }

  private registerTasks() {
    const analysisTask = new AnalysisTask(this.modelManager, this.githubClient);
    const resolutionTask = new ResolutionTask(
      this.modelManager,
      this.githubClient
    );
    const maintenanceTask = new MaintenanceTask(
      this.modelManager,
      this.githubClient
    );
    const reportingTask = new ReportingTask(
      this.modelManager,
      this.githubClient
    );

    // Register all tasks
    [
      ...analysisTask.getTasks(),
      ...resolutionTask.getTasks(),
      ...maintenanceTask.getTasks(),
      ...reportingTask.getTasks(),
    ].forEach((task) => {
      this.tasks.set(task.name, task);
    });

    logger.info(`Registered ${this.tasks.size} tasks`);
  }

  async executeTask(
    taskName: string,
    params?: Record<string, any>
  ): Promise<TaskResult> {
    const task = this.tasks.get(taskName);
    if (!task) {
      return {
        success: false,
        message: `Task '${taskName}' not found`,
      };
    }

    logger.info(`Executing task: ${task.name}`);

    try {
      const contextWithParams = { ...this.context, additionalParams: params || {} };
      const result = await task.execute(contextWithParams);

      logger.info(
        `Task ${taskName} completed: ${result.success ? "SUCCESS" : "FAILED"}`
      );
      return result;
    } catch (error) {
      logger.error(`Task ${taskName} failed:`, error);
      return {
        success: false,
        message: `Task execution failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  async executeTaskWithOptimalModel(
    taskName: string,
    params?: Record<string, any>
  ): Promise<TaskResult> {
    const task = this.tasks.get(taskName);
    if (!task) {
      return { success: false, message: `Task '${taskName}' not found` };
    }

    let selectedModel: string;

    if (params?.model) {
      selectedModel = params.model;
    } else if (this.context.modelSelection.taskSpecific?.[taskName]) {
      selectedModel = this.context.modelSelection.taskSpecific[taskName];
    } else {
      selectedModel = this.modelManager.getOptimalModel(task.category, {
        needsVision: params?.needsVision,
        needsFunctionCalling: params?.needsFunctionCalling,
        maxCost: params?.maxCost,
        preferSpeed: params?.preferSpeed,
      });
    }

    logger.info(`Executing task '${taskName}' with model '${selectedModel}'`);

    try {
      const contextWithParams = {
        ...this.context,
        additionalParams: { ...params, selectedModel },
      };

      const result = await task.execute(contextWithParams);
      return result;
    } catch (error) {
      if (
        this.context.modelSelection.fallback &&
        selectedModel !== this.context.modelSelection.fallback
      ) {
        logger.warn(
          `Primary model failed, trying fallback: ${this.context.modelSelection.fallback}`
        );
        try {
          const contextWithFallback = {
            ...this.context,
            additionalParams: {
              ...params,
              selectedModel: this.context.modelSelection.fallback,
            },
          };
          return await task.execute(contextWithFallback);
        } catch (fallbackError) {
          return {
            success: false,
            message: `Task failed with both primary and fallback models: ${
              error instanceof Error ? error.message : String(error)
            }`,
          };
        }
      }

      return {
        success: false,
        message: `Task execution failed: ${error.message}`,
      };
    }
  }

  async suggestTasks(input: string): Promise<string[]> {
    const suggestions: string[] = [];
    const lowerInput = input.toLowerCase();

    for (const [name, task] of this.tasks) {
      if (
        task.trigger.some((trigger) =>
          lowerInput.includes(trigger.toLowerCase())
        )
      ) {
        suggestions.push(name);
      }
    }

    return suggestions.sort((a, b) => {
      const taskA = this.tasks.get(a)!;
      const taskB = this.tasks.get(b)!;
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[taskB.priority] - priorityOrder[taskA.priority];
    });
  }

  listTasks(): ClaudeCodeTask[] {
    return Array.from(this.tasks.values());
  }

  getModelManager(): ModelManager {
    return this.modelManager;
  }

  getContext(): TaskContext {
    return this.context;
  }

  getGitHubClient(): GitHubClient {
    return this.githubClient;
  }

  switchPrimaryModel(modelName: string) {
    this.context.modelSelection.primary = modelName;
    logger.info(`Switched primary model to: ${modelName}`);
  }

  setTaskModel(taskName: string, modelName: string) {
    if (!this.context.modelSelection.taskSpecific) {
      this.context.modelSelection.taskSpecific = {};
    }
    this.context.modelSelection.taskSpecific[taskName] = modelName;
    logger.info(`Set task ${taskName} to use model ${modelName}`);
  }
}
