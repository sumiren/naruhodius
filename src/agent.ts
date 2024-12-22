import { Action, ActionResult, GlobalContext, GptInstructionContext, IAgent, IReplier } from "./if";
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
      case "readNextNumber":
        return this.handleReadNextNumber();
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
    console.log("Setting hand-over memo:", options.memo);
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

  private async handleReadNextNumber(): Promise<ActionResult> {
    const randomNum = Math.floor(Math.random() * 10) + 1;
    return { type: "readNextNumber", number: randomNum };
  }

  private async handleExecuteCommand(
    options: { command: string }
  ): Promise<ActionResult> {
    try {
      console.log("Executing command:", options.command);
      const { stdout, stderr } = await execPromise(options.command);
      if (stderr) {
        console.error("Command error:", stderr);
      }
      return { type: "executeCommand", output: stdout.trim(), error: stderr.trim() || undefined };
    } catch (error) {
      console.error("Execution failed:", error);
      return { type: "executeCommand", output: "", error: error.message };
    }
  }
}
