import {Action, ActionResult, GlobalContext, GptInstructionContext, IAgent, IReplier} from "./if";

export class Agent implements IAgent {
  async react(
    globalContext: GlobalContext,
    actions: Action[],
    replier: IReplier
  ): Promise<void> {

    // `actionResults` を初期化
    const actionResults: ActionResult[] = [];
    const gptInstructionContext: GptInstructionContext= {} as GptInstructionContext;

    for (const action of actions) {
      // `taskDone` がある場合は終了

      if (action.type === "taskDone") {
        console.log("Agent: taskDone detected. Stopping further actions.");
        return;
      }

      const result = await this.performSingleAction(action, gptInstructionContext);
      if (result) {
        actionResults.push(result);
      }
    }

    // ReplierにactionResultsを渡す
    await replier.sendReply(globalContext, gptInstructionContext, actionResults);
  }

  /**
   * 単一のアクションを処理し、新しいコンテキストを生成して結果を返す
   */
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
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private handleSetHandOverMemo(
    options: { memo: string },
    context: GptInstructionContext
  ): null {
    console.log("Setting hand-over memo:", options.memo);

    // 新しい context を作成して更新
    context.handOverMemo  = options.memo;

    return null;
  }

  private handleSetMemory(
    options: { memory: any },
    context: GptInstructionContext
  ): null {

    // 新しい context を作成して更新
    context.memory  = options.memory;
    return null;
  }

  private async handleReadNextNumber(): Promise<ActionResult> {
    const randomNum = Math.floor(Math.random() * 10) + 1; // 1~10の乱数

    // アクション結果を返す
    return { type: "readNextNumber", number: randomNum };
  }
}
