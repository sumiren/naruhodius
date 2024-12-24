// IKicker, IReplier, IAgent, IGPTGateway
export interface IKicker {
  triggerTask(taskDescription: string): Promise<void>;
}

export interface IReplier {
  sendReply(globalContext: any, context: GptInstructionContext, actionResults: ActionResult[]): Promise<void>;
}

export interface IAgent {
  react(globalContext: GlobalContext, actions: Action[], replier: IReplier): Promise<void>;
}

export interface IGPTGateway {
  sendRequest(request: any): Promise<any>;
  onGptInstructionReceived(callback: (instruction: GPTInstruction) => void): void;
}

export interface GlobalContext {
  taskDescription: string;
  subTasks: any[];
}

// 各アクションの型定義
export type ActionType = "setMemory" | "readNextNumber" | "taskDone" | "executeCommand";

// 各アクションの `options` の型定義
export interface SetMemoryOptions {
  memory: any;
}

export interface RecordActivityLogOptions {
  assumedWholeTaskFlow: string
  thisTimeActivityLog: string;
  assumedNextAction: string;
}

export interface ExecuteCommandOptions {
  command: string;
  reason: string
}

export interface TaskDoneOptions {
  report: string;
}

// アクション全体を型安全に定義
export type Action =
  | { type: "setMemory"; options: SetMemoryOptions }
  | { type: "recordActivityLog"; options: RecordActivityLogOptions }
  | { type: "taskDone"; options: TaskDoneOptions }
  | { type: "taskRejected"; reason: string }
  | { type: "executeCommand"; options: ExecuteCommandOptions };

// コンテキスト型
export interface GptInstructionContext {
  activityLog: RecordActivityLogOptions
}

// GPTからのレスポンス全体
export interface GPTInstruction {
  actions: Action[]; // アクションのリスト
}

// ActionResultの型定義
export type ActionResult =
  | { type: "executeCommand"; options: ExecuteCommandOptions, output: string; error?: string }; // `executeCommand` の結果
