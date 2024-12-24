import {
  Action,
  ActionResult,
  ExecuteCommandOptions,
  GlobalContext,
  GptInstructionContext,
  IAgent,
  IReplier, RecordActivityLogOptions
} from "./if";
import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec);

export class Agent implements IAgent {

  async react(
    globalContext: GlobalContext,
    actions: Action[],
    replier: IReplier
  ): Promise<void> {
    const actionResults: ActionResult[] = [];
    const gptInstructionContext: GptInstructionContext = {} as GptInstructionContext;

    for (const action of actions) {
      if (action.type === "taskDone") {
        console.log("Agent: taskDone detected. Stopping further actions.");
        console.log("Report...", action.options.report);
        console.timeEnd('Processing Time');
        return;
      }
      if (action.type === "taskRejected") {
        console.log("Agent: taskRejected detected. Stopping further actions.");
        console.log("Reason...", action.reason);
        console.timeEnd('Processing Time');
        return;
      }

      const result = await this.performSingleAction(action, gptInstructionContext);
      if (result) {
        actionResults.push(result);
      }
    }

    await replier.sendReply(globalContext, gptInstructionContext, actionResults);
  }

  private async performSingleAction(
    action: Action,
    context: GptInstructionContext
  ): Promise<ActionResult | null> {
    switch (action.type) {
      case "setMemory":
        return this.handleSetMemory(action.options, context);
      case "recordActivityLog":
        return this.handleRecordActivityLog(action.options, context);
      case "executeCommand":
        return await this.handleExecuteCommand(action.options);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private handleSetMemory(
    options: { memory: any },
    context: GptInstructionContext
  ): null {
    context.memory = options.memory;
    return null;
  }

  private handleRecordActivityLog(
    options: RecordActivityLogOptions,
    context: GptInstructionContext
  ): null {
    context.activityLog = options;
    return null;
  }

  private async handleExecuteCommand(
    options: ExecuteCommandOptions
  ): Promise<ActionResult> {
    try {
      console.log("Executing command:", options.command);
      const { stdout, stderr } = await execPromise(options.command);

      if (stderr) {
        console.error("Command error:", stderr);
      }

      return {
        type: "executeCommand",
        output: stdout.trim(),
        options,
        error: stderr.trim() || undefined,
      };
    } catch (error: any) {
      console.error("Execution failed:");
      console.error("Error message:", error.message || "No error message");
      console.error("Error code:", error.code || "No error code");
      console.error("Signal:", error.signal || "No signal");

      return {
        type: "executeCommand",
        output: "",
        options,
        error: JSON.stringify(
          {
            message: error.message || "Unknown error",
            code: error.code || "No code",
            signal: error.signal || "No signal",
            stack: error.stack || "No stack trace",
          },
          null,
          2
        ),
      };
    }
  }
}
