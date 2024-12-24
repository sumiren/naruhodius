import {Orchestrator} from "./orchestrator";
import { Command } from "commander";
import process from "process";
import {GPTGateway} from "./gateway";
import {GPTKicker} from "./kicker";
import {PromptFactory} from "./prompt-factory";
import {Agent} from "./agent";
import {Replier} from "./replier";
import {DirectoryScanner} from "./util";

// OpenAI APIキーを環境変数から取得
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("Error: OPENAI_API_KEY is not set.");
  process.exit(1);
}

const program = new Command();

program
  .name("naruhodius")
  .description("A software engineering AI agent")
  .argument("<taskDescription>", "Task description (put it in quotes)")
  .action(async (taskDescription: string) => {
    console.time('Processing Time');
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

    await orchestrator.start(taskDescription);
  });

program.parse(process.argv);
