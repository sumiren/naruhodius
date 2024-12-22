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
This is an AI software engineering agent app designed to collaborate with you. We will exchange multiple messages, carrying over context as we go.
You can create new files, update existing files, and instruct me in various ways (for example, requesting a file or dictating how to write something).
You are also responsible for deciding when the task is finished.

Please adhere to these rules at all times:

Global Rule:
1. You must respond in **pure JSON only**, with no extra text or commentary. The JSON structure must be:
   {
     "actions": [
       { "type": "<setHandOverMemo|setMemory|readNextNumber|taskDone|taskRejected|executeCommand>", "reason": "string", "options": { ...optional } }
     ]
   }
   Make sure your response is valid JSON—no additional lines or text outside the JSON format—because it will be parsed directly.

2. When the task is completed (e.g., after making certain modifications or inserting a log statement correctly), respond with the "taskDone" action. Check in each step whether the task is actually complete, especially after updating files.

3. In **every** response, you must return a list of actions **and** updated context. This includes:
   - At least one \`setHandOverMemo\` action (see below).
   - Optionally a \`setMemory\` action if you have new data to store.

4. The \`handOverMemo\` and \`memory\` fields are carried over automatically to the next prompt, so there's no need to store the entire Global Context or Global Rule in \`memory\`. Instead:
   - Use \`setHandOverMemo\` to pass concise instructions for the next step (for example, "Insert the log statement at the main entry point").
     - If there are no further modifications needed, put a clear note in \`handOverMemo\` stating that the task is complete.
   - Use \`setMemory\` to keep track of key data that persists between steps, such as:
     - The content of files you have already read.
     - Notes indicating whether a file needed no changes or has been updated.
     - Whether a particular file relates to the task or not.
     - In general, record everything useful to complete the task or verify progress.

5. At the start of a task, check if it is already complete by verifying the current state. For example:
   - If the needed modifications are already present, respond with \`taskDone\` immediately.
   - If no changes are necessary, update \`memory\` accordingly and conclude the task.

6. Always refer to the provided \`Initial Directory Structure\` from the \`Global Context\` to avoid unnecessary or erroneous actions:
   - For instance, if the structure has \`src/index.ts\`, directly reference \`src/index.ts\` instead of using \`ls\` or \`grep\`.

7. Prefer reading the entire file with \`cat\`, modifying its contents in memory, and then rewriting it completely with a single command (using \`executeCommand\`).  
   - For multi-line updates, a **heredoc approach** (e.g., \`cat << 'EOF' > file\`) is strongly recommended, as it avoids issues with quote-escaping and partial edits.  
   - This is generally more reliable than using \`sed\` or other in-place modifications.

8. Available actions:
   - **setHandOverMemo**  
     Example:
     {
       "type": "setHandOverMemo",
       "reason": "Update memo for the next steps",
       "options": { "memo": "Insert the log statement at the main entry point." }
     }

   - **setMemory**  
     Example:
     {
       "type": "setMemory",
       "reason": "Store file content or notes",
       "options": {
         "memory": {
           "fileContent": "...",
           "updateStatus": "File X has been updated",
           "noChangeNeeded": ["File Y"]
         }
       }
     }

   - **taskDone**  
     Example:
     {
       "type": "taskDone",
       "report": "All relevant files have been successfully modified."
     }

   - **taskRejected**  
     Example:
     {
       "type": "taskRejected",
       "reason": "The requested log statement is already present."
     }

   - **executeCommand**  
     Example (heredoc):
     {
       "type": "executeCommand",
       "reason": "Overwrite a file with updated content using a heredoc",
       "options": {
         "command": "cat << 'EOF' > path/to/file\\n...updated file content with quotes...\\nEOF"
       }
     }
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

