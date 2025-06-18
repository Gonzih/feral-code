import { BaseTool } from './base.js';

export class ExitPlanModeTool extends BaseTool {
  name = 'ExitPlanMode';
  description = 'Use this tool when you are in plan mode and have finished presenting your plan and are ready to code. This will prompt the user to exit plan mode.';
  parameters = {
    plan: {
      type: 'string',
      description: 'The plan you came up with, that you want to run by the user for approval. Supports markdown. Should be concise.',
      required: true,
    },
  };

  async _execute(params: Record<string, any>): Promise<string> {
    
    const { plan } = params;
    
    if (plan.length < 10) {
      return 'Error: Plan must be at least 10 characters long';
    }
    
    return `## Proposed Plan

${plan}

---

**Plan Mode Active**: The above plan has been presented for your review. 

To proceed with implementation:
- Type "yes" or "proceed" to execute this plan
- Type "no" or "cancel" to reject and revise
- Provide feedback to modify the plan before execution

This tool simulates plan mode functionality. In the full implementation, this would:
1. Pause execution and wait for user approval
2. Only proceed with the plan after explicit user consent
3. Allow plan modification based on user feedback
4. Provide clear status indicators for plan mode vs execution mode`;
  }
}