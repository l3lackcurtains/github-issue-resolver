import { Command } from "commander";
import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import { TaskManager } from "../tasks/TaskManager";
import { ModelManager } from "../models/ModelManager";
import { TaskContext } from "../models/interfaces";
import { loadConfig } from "../utils/config";
import { parseGitHubURL, isGitHubURL, parseGitHubRepoURL, isGitHubRepoURL } from "../utils/urlParser";

export class CLI {
  private program: Command;
  private taskManager: TaskManager | undefined;
  private modelManager: ModelManager | undefined;
  private repoOwner: string | undefined;
  private repoName: string | undefined;

  constructor() {
    this.program = new Command();
    this.setupCommands();
  }

  private async initializeModelManager(): Promise<ModelManager> {
    if (this.modelManager) return this.modelManager;
    
    this.modelManager = new ModelManager();
    this.modelManager.initializeProviders();
    return this.modelManager;
  }

  private async initializeTaskManager(requireRepo: boolean = true): Promise<TaskManager> {
    if (this.taskManager) return this.taskManager;

    const config = loadConfig();
    
    // Use provided repo info or fall back to env/config
    const owner = this.repoOwner || process.env.GITHUB_OWNER || config.github.owner;
    const repository = this.repoName || process.env.GITHUB_REPO || config.github.repo;
    
    if (requireRepo && (!owner || !repository)) {
      throw new Error("Repository owner and name must be provided via --repo option or as arguments");
    }
    
    const context: TaskContext = {
      repository,
      owner,
      githubToken: process.env.GITHUB_TOKEN || config.github.token,
      workingDirectory: process.cwd(),
      modelSelection: {
        primary: config.ai.defaultModel,
        fallback: config.ai.fallbackModel,
        taskSpecific: config.ai.taskPreferences,
      },
    };

    this.taskManager = new TaskManager(context);
    return this.taskManager;
  }

  private setupCommands() {
    this.program
      .name("github-resolver")
      .description("Multi-model AI GitHub issue resolver")
      .version("1.0.0")
      .option("-r, --repo <url>", "GitHub repository URL or owner/repo")
      .hook("preAction", (thisCommand) => {
        const repo = thisCommand.opts().repo;
        if (repo) {
          // Parse repository URL
          if (isGitHubRepoURL(repo)) {
            const parsed = parseGitHubRepoURL(repo);
            if (parsed) {
              this.repoOwner = parsed.owner;
              this.repoName = parsed.repo;
            }
          } else {
            throw new Error(`Invalid repository format: ${repo}. Use 'owner/repo' or a GitHub URL`);
          }
        }
      });

    // Models command
    this.program
      .command("models")
      .description("List available AI models")
      .action(async () => {
        const modelManager = await this.initializeModelManager();
        const models = modelManager.listAvailableModels();

        console.log(chalk.blue("Available Models:"));
        console.table(
          models.map((m) => ({
            name: m.name,
            provider: m.provider,
            "cost/token": m.costPerToken,
            "max tokens": m.maxTokens,
            coding: m.supports.codeGeneration ? "✓" : "✗",
            vision: m.supports.vision ? "✓" : "✗",
          }))
        );
      });

    // Tasks command
    this.program
      .command("tasks")
      .description("List available tasks")
      .action(async () => {
        // Create a minimal TaskManager just to list tasks
        const config = loadConfig();
        const context: TaskContext = {
          repository: "dummy",
          owner: "dummy",
          githubToken: process.env.GITHUB_TOKEN || config.github.token || "",
          workingDirectory: process.cwd(),
          modelSelection: {
            primary: config.ai.defaultModel,
            fallback: config.ai.fallbackModel,
            taskSpecific: config.ai.taskPreferences,
          },
        };
        const taskManager = new TaskManager(context);
        const tasks = taskManager.listTasks();

        console.log(chalk.blue("Available Tasks:"));
        console.table(
          tasks.map((t) => ({
            name: t.name,
            category: t.category,
            priority: t.priority,
            description: t.description,
          }))
        );
      });

    // Execute command
    this.program
      .command("execute <taskName>")
      .description("Execute a specific task")
      .option("-i, --issue <numberOrUrl>", "Issue number or GitHub issue URL")
      .option("-m, --model <model>", "Specific model to use")
      .option("--max-cost <cost>", "Maximum cost per request")
      .option("--prefer-speed", "Prefer faster models")
      .option("-c, --changes <description>", "Description of changes (for documentation-update task)")
      .action(async (taskName, options) => {
        const spinner = ora("Initializing...").start();

        try {
          let taskManager = await this.initializeTaskManager();
          spinner.text = `Executing task: ${taskName}`;

          const params: any = {};

          // Handle issue number or URL
          if (options.issue) {
            if (isGitHubURL(options.issue)) {
              const parsed = parseGitHubURL(options.issue);
              if (parsed) {
                params.issueNumber = parsed.issueNumber;
                // Override repository if issue URL is from different repo
                const context = taskManager.getContext();
                
                if (parsed.owner !== context.owner || parsed.repo !== context.repository) {
                  console.log(
                    chalk.yellow(
                      `Note: Using issue from ${parsed.owner}/${parsed.repo} instead of ${context.owner}/${context.repository}`
                    )
                  );
                  // Create new GitHubClient for this specific repo
                  context.owner = parsed.owner;
                  context.repository = parsed.repo;
                  // Reinitialize the task manager with new context
                  this.repoOwner = parsed.owner;
                  this.repoName = parsed.repo;
                  this.taskManager = undefined;
                  taskManager = await this.initializeTaskManager();
                }
              }
            } else {
              params.issueNumber = parseInt(options.issue);
            }
          }

          if (options.model) params.model = options.model;
          if (options.maxCost) params.maxCost = parseFloat(options.maxCost);
          if (options.preferSpeed) params.preferSpeed = true;
          if (options.changes) params.changes = options.changes;

          const result = await taskManager.executeTaskWithOptimalModel(
            taskName,
            params
          );

          spinner.stop();

          if (result.success) {
            console.log(chalk.green("✓ Task completed successfully"));
            console.log(chalk.gray(`Model used: ${result.modelUsed}`));
            if (result.cost) {
              console.log(chalk.gray(`Cost: $${result.cost.toFixed(6)}`));
            }
            console.log(result.message);
            if (result.data) {
              console.log("\nResult:", JSON.stringify(result.data, null, 2));
            }
          } else {
            console.log(chalk.red("✗ Task failed"));
            console.log(result.message);
          }
        } catch (error) {
          spinner.stop();
          console.log(
            chalk.red("Error:"),
            error instanceof Error ? error.message : String(error)
          );
        }
      });

    // Switch model command
    this.program
      .command("switch <modelName>")
      .description("Switch primary model")
      .action(async (modelName) => {
        const taskManager = await this.initializeTaskManager();
        taskManager.switchPrimaryModel(modelName);
        console.log(chalk.green(`✓ Switched primary model to: ${modelName}`));
      });

    // Suggest command
    this.program
      .command("suggest <input...>")
      .description("Get task suggestions based on input")
      .action(async (input) => {
        const taskManager = await this.initializeTaskManager();
        const suggestions = await taskManager.suggestTasks(input.join(" "));

        if (suggestions.length > 0) {
          console.log(chalk.blue("Suggested tasks:"));
          suggestions.forEach((task) => console.log(`  • ${task}`));
        } else {
          console.log(chalk.yellow("No task suggestions found"));
        }
      });

    // Interactive mode
    this.program
      .command("interactive")
      .alias("i")
      .description("Start interactive mode")
      .action(async () => {
        await this.runInteractiveMode();
      });

    // Usage stats
    this.program
      .command("usage")
      .description("Show model usage statistics")
      .action(async () => {
        const modelManager = await this.initializeModelManager();
        const stats = modelManager.getUsageStats();

        console.log(chalk.blue("Usage Statistics:"));
        console.table(stats);

        const totalCost = stats.reduce((sum, stat) => sum + stat.cost, 0);
        console.log(chalk.green(`Total cost: $${totalCost.toFixed(6)}`));
      });
  }

  private async runInteractiveMode() {
    console.log(
      chalk.blue("Welcome to GitHub Issue Resolver Interactive Mode")
    );
    console.log(chalk.gray('Type "exit" to quit\n'));

    const taskManager = await this.initializeTaskManager();

    let continueLoop = true;
    while (continueLoop) {
      const { action } = await inquirer.prompt([
        {
          type: "list",
          name: "action",
          message: "What would you like to do?",
          choices: [
            "Execute a task",
            "List available models",
            "List available tasks",
            "Switch primary model",
            "View usage statistics",
            "Exit",
          ],
        },
      ]);

      if (action === "Exit") {
        continueLoop = false;
        break;
      }

      switch (action) {
        case "Execute a task":
          await this.interactiveExecuteTask(taskManager);
          break;
        case "List available models": {
          const models = taskManager.getModelManager().listAvailableModels();
          console.table(
            models.map((m) => ({
              name: m.name,
              provider: m.provider,
              "cost/token": m.costPerToken,
            }))
          );
          break;
        }
        case "List available tasks": {
          const tasks = taskManager.listTasks();
          console.table(
            tasks.map((t) => ({
              name: t.name,
              category: t.category,
              priority: t.priority,
            }))
          );
          break;
        }
        case "Switch primary model":
          await this.interactiveSwitchModel(taskManager);
          break;
        case "View usage statistics": {
          const stats = taskManager.getModelManager().getUsageStats();
          console.table(stats);
          break;
        }
      }
    }
  }

  private async interactiveExecuteTask(initialTaskManager: TaskManager) {
    let taskManager = initialTaskManager;
    const tasks = taskManager.listTasks();

    const { taskName } = await inquirer.prompt([
      {
        type: "list",
        name: "taskName",
        message: "Select a task to execute:",
        choices: tasks.map((t) => ({
          name: `${t.name} - ${t.description}`,
          value: t.name,
        })),
      },
    ]);

    const { issueNumber } = await inquirer.prompt([
      {
        type: "input",
        name: "issueNumber",
        message: "Issue number or GitHub URL (optional):",
        validate: (input) => {
          if (!input) return true;
          if (isGitHubURL(input)) return true;
          if (!isNaN(parseInt(input))) return true;
          return "Please enter a valid issue number or GitHub URL";
        },
      },
    ]);

    const spinner = ora(`Executing task: ${taskName}`).start();

    try {
      const params: any = {};
      if (issueNumber) {
        if (isGitHubURL(issueNumber)) {
          const parsed = parseGitHubURL(issueNumber);
          if (parsed) {
            params.issueNumber = parsed.issueNumber;
            const context = taskManager.getContext();

            if (parsed.owner !== context.owner || parsed.repo !== context.repository) {
              console.log(
                chalk.yellow(
                  `Note: Using issue from ${parsed.owner}/${parsed.repo}`
                )
              );
              // Update context for this specific issue
              context.owner = parsed.owner;
              context.repository = parsed.repo;
              // Reinitialize the task manager with new context
              this.repoOwner = parsed.owner;
              this.repoName = parsed.repo;
              this.taskManager = undefined;
              taskManager = await this.initializeTaskManager();
            }
          }
        } else {
          params.issueNumber = parseInt(issueNumber);
        }
      }

      const result = await taskManager.executeTaskWithOptimalModel(
        taskName,
        params
      );

      spinner.stop();

      if (result.success) {
        console.log(chalk.green("✓ Task completed successfully"));
        console.log(result.message);
      } else {
        console.log(chalk.red("✗ Task failed"));
        console.log(result.message);
      }
    } catch (error) {
      spinner.stop();
      console.log(
        chalk.red("Error:"),
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  private async interactiveSwitchModel(taskManager: TaskManager) {
    const models = taskManager.getModelManager().listAvailableModels();

    const { modelName } = await inquirer.prompt([
      {
        type: "list",
        name: "modelName",
        message: "Select a model:",
        choices: models.map((m) => ({
          name: `${m.name} (${m.provider})`,
          value: m.name,
        })),
      },
    ]);

    taskManager.switchPrimaryModel(modelName);
    console.log(chalk.green(`✓ Switched primary model to: ${modelName}`));
  }

  run() {
    this.program.parse();
  }
}
