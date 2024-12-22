import * as os from "node:os";

export class PromptFactory {
  private directoryStructure: string;
  constructor(directoryStructure: string) {
    this.directoryStructure = directoryStructure;
  }
  createPrompt(globalContext: any, context: any, lastActionResults: any, ): Prompt {
    return new Prompt(globalContext, context, lastActionResults, this.directoryStructure);
  }
}

export class Prompt {
  globalContext: any;
  context: any;
  lastActionResults: any;
  directoryStructure: string;

  constructor(globalContext: any, context: any, lastActionResults: any, directoryStructure: string) {
    this.globalContext = globalContext;
    this.context = context;
    this.lastActionResults = lastActionResults;
    this.directoryStructure = directoryStructure;
  }

  generateGlobalRule(): string {
    return `
This is an AI software engineering agent app to collaborate with you. You and I communicate many times, taking over the context.  
You are a super engineer, so you'll create new files, update correct lines in the files, and instruct me anything (e.g., give me a file or write something).  
You are responsible for judging whether the task is done or not.

Global Rule:
1. You must respond in JSON only. The structure should be:
   {
     "actions": [
       { "type": "<setHandOverMemo|setMemory|readNextNumber|taskDone|executeCommand>", "reason": "string", "options": { ...optional } }
     ]
   }
2. Once the task is done (e.g., when a specific condition is met such as completing a required modification or inserting a log statement in the correct place), respond with the "taskDone" action to end the task. Be sure to check the task's completion in every step, especially after file updates.
3. Respond with a list of actions and an updated context in every response.
4. Keep in mind that your \`handOverMemo\` and \`memory\` will be carried over to the \`context\` field of the next prompt. Since the \`context\` field is reset every time, you must include all necessary information in \`setHandOverMemo\` and \`setMemory\` actions to ensure continuity.
   - Use \`handOverMemo\` to pass concise instructions for the next step, such as the current condition or action needed (e.g., "Insert the log statement at the main entry point").
   - Use \`memory\` to store data persistently, such as completed modifications, updated files, or the latest number processed.
5. Do not include any text outside the JSON response.
6. Refer to the \`Initial Directory Structure\` in the \`Global Context\` to avoid unnecessary or problematic actions.
   - Use the provided directory structure to directly locate files or determine paths, rather than relying on commands like \`ls\` or \`grep\` to search for files.
   - For example:
     - If the \`Initial Directory Structure\` lists \`src/index.ts\`, use this path directly without performing additional searches.
     - If an entry point or file is not listed, only then consider running commands like \`grep\` or \`find\`.
7. When modifying files, insert content in the correct place:
   - For logging tasks, identify the appropriate entry point in the file, such as right before \`program.parse(process.argv)\` or equivalent execution code.
   - Avoid inserting multiple redundant statements in the same location.
8. When using the \`executeCommand\` action, you can run shell commands to read or write files, or perform other tasks. The result of the command execution will be returned in the \`ActionResult\`. If you need to read two files, you can either write a single command to handle both, or split the operation into two separate actions. Use command-line tools effectively to streamline tasks.
   - **Important**: Take into account the \`User Environment Info\` from the \`Global Context\` to handle platform-specific differences. For example:
     - On macOS (identified as \`osName: macOS\`), commands like \`sed\` or \`find\` might have differences compared to Linux (e.g., GNU utilities).
9. Available actions:
   - **setHandOverMemo**: Update the "handOverMemo" field in the context. Use this for concise next-step instructions.
     Example:
     { "type": "setHandOverMemo", "reason": "Update memo for the next steps", "options": { "memo": "Add the new number to sum and check if sum > 20" } }
   - **setMemory**: Update the "memory" field in the context. Use this for persistent data storage.
     Example:
     { "type": "setMemory", "reason": "Store the current sum", "options": { "memory": { "sum": 10, "lastNumber": 5 } } }
   - **readNextNumber**: Request the next number in the sequence. Use this to proceed to the next input.
     Example:
     { "type": "readNextNumber", "reason": "Request the next number in the sequence" }
   - **taskDone**: Indicate that the task is complete. Use this when the defined conditions are met.
     Example:
     { "type": "taskDone", "reason": "The summation task is complete because sum > 20" }
   - **executeCommand**: Execute a shell command and return the result.
     Example:
     { "type": "executeCommand", "reason": "Run a system command to list files", "options": { "command": "ls -al" } }
  `;
  }



  generatePrompt(): string {
    return `
### Global Context:
taskDescription: "${this.globalContext.taskDescription}"
subTasks: ${JSON.stringify(this.globalContext.subTasks || null)}
Initial Directory Structure:
${JSON.stringify(this.directoryStructure)}
User Environment: ${JSON.stringify(getUserEnvironmentInfo())}

### Current Context:
handOverMemo: "${this.context.handOverMemo || "null"}"
memory: ${JSON.stringify(this.context.memory || null)}

### Last Action Results:
${JSON.stringify(this.lastActionResults || {})}
`;
  }
}



function getUserEnvironmentInfo() {
  const platform = os.platform();
  const osName = platform === 'darwin' ? 'macOS' :
    platform === 'win32' ? 'Windows' :
      platform === 'linux' ? 'Linux' : 'Unknown';

  return {
    osName,
    release: os.release(),
    architecture: os.arch(),
    hostname: os.hostname(),
    username: os.userInfo().username
  };
}

