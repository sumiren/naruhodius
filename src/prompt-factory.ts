export class PromptFactory {
  static createPrompt(globalContext: any, context: any, lastActionResults: any): Prompt {
    return new Prompt(globalContext, context, lastActionResults);
  }
}

export class Prompt {
  globalContext: any;
  context: any;
  lastActionResults: any;

  constructor(globalContext: any, context: any, lastActionResults: any) {
    this.globalContext = globalContext;
    this.context = context;
    this.lastActionResults = lastActionResults;
  }

   generateGlobalRule(): string {
    return `
Global Rule:
1. You must respond in JSON only. The structure should be:
   {
     "actions": [
       { "type": "<setHandOverMemo|setMemory|readNextNumber|taskDone>", "reason": "string", "options": { ...optional } }
     ]
   }
2. Once the task is done (e.g., when a specific condition is met such as the sum exceeding a target value), respond with the "taskDone" action to end the task. Be sure to check the condition in every step.
3. Respond with a list of actions and an updated context in every response.
4. Keep in mind that your \`handOverMemo\` and \`memory\` will be carried over to the \`context\` field of the next prompt. Since the \`context\` field is reset every time, you must include all necessary information in \`setHandOverMemo\` and \`setMemory\` actions to ensure continuity.
   - Use \`handOverMemo\` to pass concise instructions for the next step, such as the current condition or action needed (e.g., "Add the next number to sum and check if it exceeds 20").
   - Use \`memory\` to store data persistently, such as cumulative values or the latest number processed.
5. Do not include any text outside the JSON response.
6. Available actions:
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

### Example of Task:
- Task: Add numbers until the sum exceeds 20.
- Steps:
  1. Use \`readNextNumber\` to request the first number.
  2. When a number is received, add it to \`sum\` (stored in \`memory\`) and update \`memory\` with the new value.
  3. If \`sum\` exceeds 20, respond with \`taskDone\`. Otherwise, set a \`handOverMemo\` with instructions like "Add the next number to sum and check if sum > 20" and use \`readNextNumber\` again.
  4. Repeat until the task is complete.

### Tips:
- Always ensure the task completion condition is checked after each number.
- Use \`handOverMemo\` to clearly explain what the next AI should do, avoiding missteps.
- Validate the final state before responding with \`taskDone\`.
`;
  }


  generatePrompt(): string {
    return `
Global Context:
taskDescription: "${this.globalContext.taskDescription}"
subTasks: ${JSON.stringify(this.globalContext.subTasks || null)}

Current Context:
handOverMemo: "${this.context.handOverMemo || "null"}"
memory: ${JSON.stringify(this.context.memory || null)}

Last Action Results:
${JSON.stringify(this.lastActionResults || {})}
`;
  }
}
