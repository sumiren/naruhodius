import {IGPTGateway, IReplier, IAgent, Action, GptInstructionContext, ActionResult} from "./if";
import {Orchestrator} from "./orchestrator";
import { Command } from "commander";
import process from "process";
import {GPTGateway} from "./gateway";
import {GPTKicker} from "./kicker";
import {PromptFactory} from "./prompt-factory";
import {Agent} from "./agent";
import * as fs from "node:fs";
import * as path from "node:path";



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


export class DirectoryScanner {
  static async scanDirectory(basePath: string, excludeDirs: string[] = ["node_modules", ".git", ".idea", "dist"]): Promise<any> {
    const result: any = {};

    async function scan(dir: string, parent: any) {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !excludeDirs.includes(entry.name)) {
          parent[entry.name] = {};
          await scan(path.join(dir, entry.name), parent[entry.name]);
        } else if (entry.isFile()) {
          if (!parent.files) {
            parent.files = [];
          }
          parent.files.push(entry.name);
        }
      }
    }

    await scan(basePath, result);
    return result;
  }
}



// Orchestratorクラス


// OpenAI APIキーを環境変数から取得
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("Error: OPENAI_API_KEY is not set.");
  process.exit(1);
}

const program = new Command();

program
  .name("naruhod")
  .description("A CLI that uses GPT (SummationGPT) to decide 'read'/'done' until sum >= 100.")
  .argument("<taskDescription>", "Task description (put it in quotes)")
  .action(async (taskDescription: string) => {
    console.log("taskDescription:", taskDescription);

    const directoryStructure = await DirectoryScanner.scanDirectory(".");

    const gptGateway = new GPTGateway(apiKey);
    const promptFactory = new PromptFactory(directoryStructure);
    const kicker = new GPTKicker(gptGateway, promptFactory);
    const replier = new Replier(gptGateway, promptFactory)

    const orchestrator = new Orchestrator(
      kicker,
      replier,
      new Agent(),
      gptGateway
    );

    console.log("hello naruhodius");
    await orchestrator.start(taskDescription)

  });

program.parse(process.argv);
