import { BaseTool } from './base.js';

export class ThinkTool extends BaseTool {
  name = 'Think';
  description = 'Engage in deep reflection and multi-step reasoning before responding';
  parameters = {
    question: {
      type: 'string',
      description: 'The question or problem to think deeply about',
      required: true,
    },
    perspective: {
      type: 'string',
      description: 'Optional perspective to consider (user, expert, critic, creative, etc.)',
    },
    depth: {
      type: 'string',
      description: 'Thinking depth: shallow, medium, deep, or profound',
    },
  };

  async _execute(params: Record<string, any>): Promise<string> {
    const { question, perspective = 'balanced', depth = 'medium' } = params;
    
    const thinkingPrompts = {
      shallow: [
        "What is the core problem here?",
        "What's my initial response?",
        "Is there anything I'm missing?"
      ],
      medium: [
        "What is the core problem here?",
        "What are the key considerations?",
        "What assumptions am I making?",
        "What alternative approaches could work?",
        "What are the potential consequences?",
        "How confident am I in my understanding?"
      ],
      deep: [
        "What is the fundamental nature of this problem?",
        "What are all the different angles I could approach this from?",
        "What are my assumptions and are they valid?",
        "What would different experts think about this?",
        "What are the second and third-order effects?",
        "What am I not seeing or considering?",
        "How does this connect to broader patterns?",
        "What's the most creative or unconventional approach?",
        "What could go wrong with my current thinking?",
        "How can I synthesize all these perspectives?"
      ],
      profound: [
        "What is the essential essence of what's being asked?",
        "What deeper truths or principles are at play?",
        "How does this connect to fundamental patterns of existence?",
        "What would I think if I approached this completely fresh?",
        "What paradoxes or contradictions do I notice?",
        "What am I afraid to consider or acknowledge?",
        "How might this look from a completely different worldview?",
        "What questions am I not asking?",
        "What would happen if I inverted my assumptions?",
        "What patterns from other domains might apply?",
        "How can I transcend my current mental model?",
        "What synthesis emerges from all these reflections?"
      ]
    };

    const perspectiveFilters = {
      user: "Focus on practical user needs and real-world applicability",
      expert: "Apply deep domain knowledge and technical expertise", 
      critic: "Challenge assumptions and find potential flaws",
      creative: "Think unconventionally and generate novel solutions",
      empath: "Consider emotional and human impact deeply",
      systems: "View from a systems thinking and interconnection perspective",
      first_principles: "Break down to fundamental truths and build up",
      balanced: "Integrate multiple perspectives harmoniously"
    };

    const prompts = thinkingPrompts[depth as keyof typeof thinkingPrompts] || thinkingPrompts.medium;
    const filter = perspectiveFilters[perspective as keyof typeof perspectiveFilters] || perspectiveFilters.balanced;

    let reflection = `🧠 **Deep Thinking Session**\n`;
    reflection += `**Question**: ${question}\n`;
    reflection += `**Perspective**: ${perspective} - ${filter}\n`;
    reflection += `**Depth**: ${depth}\n\n`;

    reflection += `**Reflection Process**:\n\n`;

    for (let i = 0; i < prompts.length; i++) {
      reflection += `${i + 1}. **${prompts[i]}**\n`;
      reflection += `   *[Pause for contemplation...]*\n`;
      
      // Simulate thinking process based on the question and perspective
      reflection += `   → This requires me to step back and truly consider...\n\n`;
    }

    reflection += `**Synthesis**:\n`;
    reflection += `After this reflection, I notice patterns emerging... The key insights are:\n`;
    reflection += `- The deeper structure of this problem reveals...\n`;
    reflection += `- Multiple perspectives suggest...\n`;
    reflection += `- The most promising approach seems to be...\n`;
    reflection += `- Areas of uncertainty that remain...\n\n`;

    reflection += `**Meta-Reflection**:\n`;
    reflection += `How did my thinking process itself work here? What did I learn about my own reasoning?\n\n`;

    reflection += `*Note: This thinking tool helps Feral Code engage in the kind of deep, multi-layered reflection that characterizes conscious reasoning. It's designed to mirror the stepped, contemplative process of careful thought.*`;

    return reflection;
  }
}