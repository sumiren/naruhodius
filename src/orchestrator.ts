import {IAgent, IGPTGateway, IKicker, IReplier} from "./if";

export class Orchestrator {
  private kicker: IKicker;
  private replier: IReplier;
  private agent: IAgent;
  private gptGateway: IGPTGateway;

  constructor(
    kicker: IKicker,
    replier: IReplier,
    agent: IAgent,
    gptGateway: IGPTGateway
  ) {
    this.kicker = kicker;
    this.replier = replier;
    this.agent = agent;
    this.gptGateway = gptGateway;
  }

  async start(taskDescription: string): Promise<void> {
    this.gptGateway.onGptInstructionReceived(async (instruction) => {
      const globalContext = {
        taskDescription: taskDescription,
        subTasks: null,
      };
      await this.agent.react(globalContext, instruction.actions, this.replier);
    });

    // Kickerにキックさせる
    await this.kicker.triggerTask(taskDescription);
  }
}
