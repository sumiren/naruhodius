import { IGPTGateway, IKicker } from "./if";
import { PromptFactory } from "./prompt-factory";

export class GPTKicker implements IKicker {
  private gptGateway: IGPTGateway;

  constructor(gptGateway: IGPTGateway) {
    this.gptGateway = gptGateway;
  }

  async triggerTask(taskDescription:string): Promise<void> {
    console.log("GPTKicker: Triggering initial task...");

    // プロンプトを生成
    const globalContext = {
      taskDescription: taskDescription,
      subTasks: null,
    };

    const context = {
      handOverMemo: null,
      memory: null,
    };

    const lastActionResults = {}; // 初回リクエストなので空

    const prompt = PromptFactory.createPrompt(globalContext, context, lastActionResults);

    // GPTGatewayにリクエストを送信
    const response = await this.gptGateway.sendRequest(prompt);

  }
}
