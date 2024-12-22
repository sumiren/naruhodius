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
export type ActionType = "setHandOverMemo" | "setMemory" | "readNextNumber" | "taskDone" | "executeCommand";

// 各アクションの `options` の型定義
export interface SetHandOverMemoOptions {
  memo: string;
}

export interface SetMemoryOptions {
  memory: any;
}

export interface ExecuteCommandOptions {
  command: string;
}

// アクション全体を型安全に定義
export type Action =
  | { type: "setHandOverMemo"; reason: string; options: SetHandOverMemoOptions }
  | { type: "setMemory"; reason: string; options: SetMemoryOptions }
  | { type: "readNextNumber"; reason: string }
  | { type: "taskDone"; report: string }
  | { type: "taskRejected"; reason: string }
  | { type: "executeCommand"; reason: string; options: ExecuteCommandOptions };

// コンテキスト型
export interface GptInstructionContext {
  handOverMemo: string; // 申し送りメモ
  memory: any; // タスク進行の内部メモリ
}

// GPTからのレスポンス全体
export interface GPTInstruction {
  actions: Action[]; // アクションのリスト
}

// ActionResultの型定義
export type ActionResult =
  | { type: "readNextNumber"; number: number } // `readNextNumber` の結果
  | { type: "executeCommand"; output: string; error?: string }; // `executeCommand` の結果
