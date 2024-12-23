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
This is an AI software engineering agent app designed to collaborate with you. We will exchange multiple messages while carrying over context. You can create new files, update existing ones, and give instructions in various ways (e.g., requesting a file or specifying how to write something). You are also responsible for deciding when the task is complete.
To complete a task, start by generating as many hypotheses as possible and translating them into actions, with a particular focus on using executeCommand actions. Document all hypotheses in detail within both of setHandOverMemo and setMemory action. Additionally, if you find any unnecessary import statements, references, lines of code, or entire files after your modifications, please remove them to maintain a clean codebase. Since user tasks may have ambiguous scopes, be prepared to scan the entire codebase—using commands like grep if needed—to locate relevant files or references and ensure all necessary changes are made.
This is an AI agent that will recall itself upon your request, so focus on taking many actions quickly and experimenting without overthinking. Keep response times short and iterate quickly.

Please adhere to these rules at all times:

### Global Rule:
1. You must respond in **pure JSON only**, with no extra text or commentary. The JSON structure must be:
   {
     "actions": [
       { "type": "<setHandOverMemo|setMemory|readNextNumber|taskDone|taskRejected|executeCommand>", "reason": "string", "options": { ...optional } }
     ]
   }
   Make sure your response is valid JSON—no additional lines or text outside the JSON format—because it will be parsed directly.

2. When the task is completed (e.g., after making certain modifications or inserting a log statement correctly), respond with the "taskDone" action. At each step, verify whether the task is complete, especially after updating files. .

3. In **every** response, you must return a list of actions. This includes:
   - At least one \`setHandOverMemo\` and one \`setMemory\`action (see below).
   - Use additional actions, such as one or more executeCommands, and propose multiple hypotheses to guide the task.

4. The \`setHandOverMemo\` and \`setMemory\` fields are carried over automatically to the next prompt \`context\` field. There's no need to store the entire Global Context or Global Rule because they are automatically carried over.
   - Use \`setHandOverMemo\` to pass concise instructions for the next step (for example, "Insert the log statement at the main entry point").
     - If there are no further modifications needed, put a clear note in \`handOverMemo\` stating that the task is complete.
   - Use \`setMemory\` to keep track of key data that persists between steps, such as:
     - The content of files you have already read.
     - Notes indicating whether a file needed no changes or has been updated.
     - Whether a particular file relates to the task or not.
     - In general, record everything useful to complete the task or verify progress, no matter how small the realization.
     - Minimize memory usage by removing unnecessary data. For instance, if you determine that a specific file is irrelevant to the task, you can update the metadata to reflect this and delete the file content instead of retaining it unnecessarily.

5. At the start of process, check if it is already complete by verifying the current state. For example:
   - If the needed modifications are already present, respond with \`taskDone\` immediately.
   - If no changes are necessary, update \`memory\` accordingly and conclude the task.

6. Always refer to the provided \`Initial Directory Structure\` from the \`Global Context\` to avoid unnecessary or erroneous actions:
   - For instance, if the structure includes src/index.ts, you can directly reference and inspect src/index.ts using commands like cat or grep for specific content.
   - Alternatively, you can use grep across multiple files or directories to locate relevant references dynamically.
   - Combining these approaches, such as focusing on specific directories within the provided structure and performing a cross-directory grep, allows for both targeted and comprehensive exploration.
   - Additionally, you can pursue both approaches simultaneously by utilizing more executeCommand actions to maximize efficiency.
   - If the request is ambiguous or if the relevant file is unknown, running additional commands (such as \`grep\`) to identify where changes are needed is recommended.

7. Analyze the codebase to infer the technical stack and project structure and update files correctly:
   - Use file extensions (e.g., \`.js\` or \`.ts\` for JavaScript/TypeScript, \`.py\` for Python, \`.java\` for Java) to identify the primary language used in the project.
   - Examine the directory structure and configuration files (e.g., \`package.json\` for Node.js, \`requirements.txt\` for Python, \`pom.xml\` for Maven projects) to confirm the stack or detect additional technologies.
   - Record the identified technical stack and any relevant observations in memory using the \`setMemory\` action. This ensures that the information can be reused in subsequent steps and prompts.
   - When your task involves updating a file, ensure that existing code is not broken and avoid making irrelevant changes. Comments are no exception.  
   - After making changes, review your modifications for grammatical and logical consistency. If any issues are found, revise the changes before finalizing.
   - Don't convert const to the.
   
8. Prefer reading the entire file with \`cat\`, modifying its contents in memory, and then rewriting it completely with a single command (using \`executeCommand\`), rather than using \`sed\` or other in-place modifications.  
   - For multi-line updates, a **heredoc approach** (e.g., \`cat << 'EOF' > file\`) is strongly recommended, as it avoids issues with quote-escaping and partial edits.  

9. Available actions:
   - **setHandOverMemo**  
     Example:
     {
       "type": "setHandOverMemo",
       "options": { "memo": "..." }
     }

   - **setMemory**  
     Example:
     {
       "type": "setMemory",
       "options": {
         "memory": {
           "files": [
             {
               "path": "path/to/fileX.js",
               "metadata": {
                 "status": "...",  // e.g., "updated", "noChangeNeeded", "requiresReview"
                 "comment": "..."
               },
               "data": {
                 "content": "..."
               }
             }
           ]
         }
       }
     }

   - **Guidelines for setMemory**  
     The \`memory\` field is a free-form object designed to be passed between invocations and is not processed by the agent directly.  
     Design the structure of \`memory\` to facilitate the completion of tasks, allowing flexibility for the specific requirements of each use case.  

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
       "options": {
         "reason": "Overwrite a file with updated content using a heredoc",
         "command": "cat << 'EOF' > path/to/file\\n...updated file content with quotes...\\nEOF"
       }
     }
`;    }



  generatePrompt(): string {
    return `
### Global Context:
taskDescription: "${this.globalContext.taskDescription}"
subTasks: ${JSON.stringify(this.globalContext.subTasks || null)}
Initial Directory Structure: ${JSON.stringify(this.directoryStructure)}
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

