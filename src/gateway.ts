import { IGPTGateway } from "./if";
import { OpenAI} from "openai";
import { Prompt } from "./prompt-factory";
import {ChatCompletionMessageParam} from "openai/resources/chat/completions";

export class GPTGateway implements IGPTGateway {
  private client: OpenAI;
  private instructionCallback: (instruction: any) => void = () => {};

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async sendRequest(prompt: Prompt): Promise<any> {
    try {
      const request: { messages: ChatCompletionMessageParam[] } = {
        messages: [
          // globalRule を system メッセージに設定
          { role: "system", content: prompt.generateGlobalRule() },
          // タスク固有のプロンプトを user メッセージに設定
          { role: "user", content: prompt.generatePrompt() },
        ],
      };

      console.log("GPT Gateway: sending:");
      console.log(JSON.stringify({ globalContext: prompt.globalContext, context: prompt.context, lastActionResults: prompt.lastActionResults }, null, 2)); // contextとactionResultsをJSON形式で出力

      const response = await this.client.chat.completions.create({
        model: "gpt-4-turbo",
        messages: request.messages,
        temperature: 0,
      });

      const content = response.choices[0]?.message?.content || "";
      const parsedContent = JSON.parse(content); // JSON形式でパース


      console.log("GPT Gateway: received:");
      console.log(JSON.stringify(parsedContent, null, 2)); // GPTからのレスポンスをJSON形式で出力

      // instructionCallbackを呼び出してレスポンスを通知
      if (this.instructionCallback) {
        this.instructionCallback(parsedContent);
      }
      return parsedContent;
    } catch (error) {
      console.error("GPTGateway: Error during GPT request:", error);
      throw error;
    }
  }

  onGptInstructionReceived(callback: (instruction: any) => void): void {
    this.instructionCallback = callback;
  }
}
