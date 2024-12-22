import {IGPTGateway, IReplier, IAgent, Action, GptInstructionContext, ActionResult} from "./if";
import {Orchestrator} from "./orchestrator";
import { Command } from "commander";
import process from "process";
import {GPTGateway} from "./gateway";
import {GPTKicker} from "./kicker";
import {PromptFactory} from "./prompt-factory";
import {Agent} from "./agent";



export class Replier implements IReplier {
  private gptGateway: IGPTGateway;

  constructor(gptGateway: IGPTGateway) {
    this.gptGateway = gptGateway;
  }

  async sendReply(
    globalContext: any,
    context: GptInstructionContext,
    actionResults: ActionResult[]
  ): Promise<void> {

    // PromptFactoryでプロンプトを生成
    const prompt = PromptFactory.createPrompt(globalContext, context, actionResults);

    // GPTにプロンプトを送信
    const response = await this.gptGateway.sendRequest(prompt);
  }
}


// Orchestratorクラス


// OpenAI APIキーを環境変数から取得
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("Error: OPENAI_API_KEY is not set.");
  process.exit(1);
}


const gptGateway = new GPTGateway(apiKey);
const kicker = new GPTKicker(gptGateway);
const replier = new Replier(gptGateway)

const orchestrator = new Orchestrator(
  kicker,
  replier,
  new Agent(),
  gptGateway
);

const program = new Command();

program
  .name("naruhod")
  .description("A CLI that uses GPT (SummationGPT) to decide 'read'/'done' until sum >= 100.")
  .argument("<taskDescription>", "Task description (put it in quotes)")
  .action(async (taskDescription: string) => {
    console.log("taskDescription:", taskDescription);
    await orchestrator.start(taskDescription)

  });

program.parse(process.argv);
