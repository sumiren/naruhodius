import { IGPTGateway, IKicker } from "./if";
import { PromptFactory } from "./prompt-factory";

export class GPTKicker implements IKicker {
  private gptGateway: IGPTGateway;
  private promptFactory: PromptFactory;

  constructor(gptGateway: IGPTGateway, promptFactory: PromptFactory) {
    this.gptGateway = gptGateway;
    this.promptFactory = promptFactory;
  }

  async triggerTask(taskDescription:string): Promise<void> {
    console.log("GPTKicker: Triggering initial task...");

    // プロンプトを生成
    const globalContext = {
      taskDescription: taskDescription,
      subTasks: null,
    };

    const context = {
    };

    const lastActionResults = {}; // 初回リクエストなので空

    const prompt = this.promptFactory.createPrompt(globalContext, context, lastActionResults);

    // GPTGatewayにリクエストを送信
    const response = await this.gptGateway.sendRequest(prompt);

  }
}
