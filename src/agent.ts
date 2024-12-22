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
        console.log("Report...", action.report);
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

  private async handleReadNextNumber(): Promise<ActionResult> {
    const randomNum = Math.floor(Math.random() * 10) + 1;
    return { type: "readNextNumber", number: randomNum }
  }

  private async handleExecuteCommand(
    options: { command: string }
  ): Promise<ActionResult> {
    try {
      console.log("Executing command:", options.command);

      // もし `sed` コマンドに特定のエラーが発生した場合、修正を試みる
      const correctedCommand = this.correctSedCommand(options.command);

      const { stdout, stderr } = await execPromise(correctedCommand || options.command);
      if (stderr) {
        console.error("Command error:", stderr);
      }
      return { type: "executeCommand", output: stdout.trim(), error: stderr.trim() || undefined };
    } catch (error) {
      console.error("Execution failed:", error);
      return { type: "executeCommand", output: "", error: error.message };
    }
  }

// `sed` コマンドを修正する処理
  private correctSedCommand(command: string): string | null {
    if (/sed/.test(command) && /1i\\/.test(command)) {
      console.log("Correcting `sed` command for macOS compatibility...");
      // BSD 系 sed の期待するフォーマットに変換
      return command.replace(/1i\\/, "1i \\").replace(/\\n/g, "\n");
    }
    return null;
  }
}
