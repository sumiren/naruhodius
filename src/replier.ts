import {ActionResult, GptInstructionContext, IGPTGateway, IReplier} from "./if";
import {PromptFactory} from "./prompt-factory";

export class Replier implements IReplier {
  private gptGateway: IGPTGateway;
  private promptFactory: PromptFactory;

  constructor(gptGateway: IGPTGateway, promptFactory: PromptFactory) {
    this.gptGateway = gptGateway;
    this.promptFactory = promptFactory;
  }

  async sendReply(
    globalContext: any,
    context: GptInstructionContext,
    actionResults: ActionResult[]
  ): Promise<void> {

    // PromptFactoryでプロンプトを生成
    const prompt = this.promptFactory.createPrompt(globalContext, context, actionResults);

    // GPTにプロンプトを送信
    const response = await this.gptGateway.sendRequest(prompt);
  }
}
