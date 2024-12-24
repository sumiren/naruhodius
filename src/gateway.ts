import { IGPTGateway } from "./if";
import { OpenAI} from "openai";
import { Prompt } from "./prompt-factory";
import {ChatCompletionMessageParam} from "openai/resources/chat/completions";

export class GPTGateway implements IGPTGateway {
  private client: OpenAI;
  private static callCount = 0;
  private instructionCallback: (instruction: any) => void = () => {};

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async sendRequest(prompt: Prompt): Promise<any> {
    GPTGateway.callCount++;
    console.log(`GPT Gateway: Call #${GPTGateway.callCount}`);
    try {
      const request: { messages: ChatCompletionMessageParam[] } = {
        messages: [
          { role: "system", content: prompt.generateGlobalRule() },
          { role: "user", content: prompt.generatePrompt() },
        ],
      };

      console.log("GPT Gateway: sending:");
      console.log(JSON.stringify({ globalContext: prompt.globalContext, context: prompt.context, lastActionResults: prompt.lastActionResults }, null, 2));

      const startTime = Date.now();
      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: request.messages,
        temperature: 0,
      });
      const endTime = Date.now();
      console.log(`Response time: ${endTime - startTime} ms`);

      const content = response.choices[0]?.message?.content || "";
      const cleanedContent = content
        .replace(/```json\s*/g, "") // "```json" を削除
        .replace(/```/g, "")        // 終了の "```" を削除
        .trim();
      const parsedContent = JSON.parse(cleanedContent);


      console.log("GPT Gateway: received:");
      console.log(JSON.stringify(parsedContent, null, 2));

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
