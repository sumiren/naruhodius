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
    return `Global Rule:
1. You must respond in JSON only. The structure should be:
   {
     "actions": [
       { "type": "<setHandOverMemo|setMemory|readNextNumber|taskDone|executeCommand>", "reason": "string", "options": { ...optional } }
     ]
   }
2. Once the task is done (e.g., when a specific condition is met such as the sum exceeding a target value), respond with the "taskDone" action to end the task. Be sure to check the condition in every step.
3. Respond with a list of actions and an updated context in every response.
4. Keep in mind that your \`handOverMemo\` and \`memory\` will be carried over to the \`context\` field of the next prompt. Since the \`context\` field is reset every time, you must include all necessary information in \`setHandOverMemo\` and \`setMemory\` actions to ensure continuity.
   - Use \`handOverMemo\` to pass concise instructions for the next step, such as the current condition or action needed (e.g., "Add the next number to sum and check if it exceeds 20").
   - Use \`memory\` to store data persistently, such as cumulative values or the latest number processed.
5. Do not include any text outside the JSON response.
6. When using the \`executeCommand\` action, you can run shell commands to read or write files, or perform other tasks. The result of the command execution will be returned in the \`ActionResult\`. If you need to read two files, you can either write a single command to handle both, or split the operation into two separate actions. Use command-line tools effectively to streamline tasks.
7. Available actions:
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

### Example of Task:
- Task: Investigate and update suspicious files in a project.
- Steps:
  1. Use \`executeCommand\` to inspect two suspicious files (e.g., file1.txt and file2.txt) and determine their relevance.
  2. Use \`setMemory\` to record that file1 is unrelated and file2 seems relevant. Then, use \`executeCommand\` to check file3 based on the findings from file2.
  3. Modify file1 based on further insights. Use \`setMemory\` to note that file1 was fixed and file3 seems relevant, then proceed to investigate file4.
  4. Conclude that file3 and file4 are irrelevant and finalize the task with \`taskDone\`, indicating that only file1 required modifications.

### Tips:
- Use \`executeCommand\` effectively to perform file operations or other shell tasks. Combine actions or split them as needed to handle complex scenarios.
- Always ensure the task completion condition is checked after each step.
- Use \`handOverMemo\` to clearly explain what the next AI should do, avoiding missteps.
- Validate the final state before responding with \`taskDone\`.
`


   }


  generatePrompt(): string {
    return `
Global Context:
taskDescription: "${this.globalContext.taskDescription}"
subTasks: ${JSON.stringify(this.globalContext.subTasks || null)}
Initial Directory Structure:
${this.directoryStructure}

Current Context:
handOverMemo: "${this.context.handOverMemo || "null"}"
memory: ${JSON.stringify(this.context.memory || null)}

Last Action Results:
${JSON.stringify(this.lastActionResults || {})}
`;
  }
}



