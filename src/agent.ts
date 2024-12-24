import {
  Action,
  ActionResult,
  ExecuteCommandOptions,
  GlobalContext,
  GptInstructionContext,
  IAgent,
  IReplier
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
        return;
      }
      if (action.type === "taskRejected") {
        console.log("Agent: taskRejected detected. Stopping further actions.");
        console.log("Reason...", action.reason);
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
      case "setHandOverMemo":
        return this.handleSetHandOverMemo(action.options, context);
      case "setMemory":
        return this.handleSetMemory(action.options, context);
      case "executeCommand":
        return await this.handleExecuteCommand(action.options);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private handleSetHandOverMemo(
    options: { memo: string },
    context: GptInstructionContext
  ): null {
    context.handOverMemo = options.memo;
    return null;
  }

  private handleSetMemory(
    options: { memory: any },
    context: GptInstructionContext
  ): null {
    context.memory = options.memory;
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
      return { type: "executeCommand", output: stdout.trim(), options, error: stderr.trim() || undefined };
    } catch (error) {
      console.error("Execution failed:", error);
      return { type: "executeCommand", output: "", options, error: error.message };
    }
  }
}
