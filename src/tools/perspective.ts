import { BaseTool } from './base.js';

export class PerspectiveTool extends BaseTool {
  name = 'Perspective';
  description = 'Analyze problems from multiple viewpoints and synthesize diverse perspectives';
  parameters = {
    question: {
      type: 'string',
      description: 'The question or problem to analyze from multiple perspectives',
      required: true,
    },
    perspectives: {
      type: 'string',
      description: 'Comma-separated list of perspectives to consider (or "auto" for automatic selection)',
    },
    depth: {
      type: 'string',
      description: 'Analysis depth: surface, detailed, or comprehensive',
      enum: ['surface', 'detailed', 'comprehensive']
    },
    synthesis: {
      type: 'boolean',
      description: 'Whether to synthesize perspectives into a unified view',
    }
  };

  async _execute(params: Record<string, any>): Promise<string> {
    const { question, perspectives = 'auto', depth = 'detailed', synthesis = true } = params;

    let selectedPerspectives: string[];
    
    if (perspectives === 'auto') {
      selectedPerspectives = this.selectRelevantPerspectives(question);
    } else {
      selectedPerspectives = perspectives.split(',').map((p: string) => p.trim());
    }

    let analysis = `🔄 **Multi-Perspective Analysis**\n`;
    analysis += `**Question**: ${question}\n`;
    analysis += `**Perspectives**: ${selectedPerspectives.join(', ')}\n`;
    analysis += `**Depth**: ${depth}\n\n`;

    // Analyze from each perspective
    for (const perspective of selectedPerspectives) {
      analysis += await this.analyzePerspective(question, perspective, depth);
      analysis += '\n---\n\n';
    }

    if (synthesis) {
      analysis += await this.synthesizePerspectives(question, selectedPerspectives);
    }

    return analysis;
  }

  private selectRelevantPerspectives(question: string): string[] {
    const questionLower = question.toLowerCase();
    const allPerspectives = [
      'user', 'developer', 'business', 'security', 'performance', 
      'maintainability', 'scalability', 'cost', 'legal', 'ethical',
      'technical', 'creative', 'critical', 'optimistic', 'pessimistic',
      'beginner', 'expert', 'stakeholder', 'competitor'
    ];

    // Smart perspective selection based on question content
    const selected: string[] = [];

    // Always include user perspective for most questions
    selected.push('user');

    // Technical questions
    if (this.containsAny(questionLower, ['code', 'api', 'database', 'algorithm', 'implementation'])) {
      selected.push('developer', 'technical', 'performance');
    }

    // Business-related questions
    if (this.containsAny(questionLower, ['business', 'product', 'market', 'revenue', 'cost'])) {
      selected.push('business', 'stakeholder', 'cost');
    }

    // Security-sensitive questions
    if (this.containsAny(questionLower, ['security', 'auth', 'data', 'privacy', 'password'])) {
      selected.push('security', 'legal', 'ethical');
    }

    // Design questions
    if (this.containsAny(questionLower, ['design', 'ui', 'ux', 'interface', 'experience'])) {
      selected.push('user', 'creative', 'beginner');
    }

    // Always include critical perspective for important decisions
    if (this.containsAny(questionLower, ['should', 'decide', 'choose', 'best', 'recommend'])) {
      selected.push('critical');
    }

    // Ensure we have at least 3 perspectives and not more than 6
    while (selected.length < 3) {
      const remaining = allPerspectives.filter(p => !selected.includes(p));
      if (remaining.length > 0) {
        selected.push(remaining[Math.floor(Math.random() * remaining.length)]);
      } else {
        break;
      }
    }

    return selected.slice(0, 6); // Limit to 6 perspectives
  }

  private containsAny(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  private async analyzePerspective(question: string, perspective: string, depth: string): Promise<string> {
    let analysis = `### 👤 ${perspective.toUpperCase()} PERSPECTIVE\n\n`;

    const perspectiveFrameworks = {
      user: {
        focus: 'Usability, experience, and practical value',
        questions: ['How easy is this to use?', 'Does this solve my real problem?', 'What\'s the learning curve?'],
        concerns: ['Complexity', 'Time investment', 'Reliability', 'Support availability']
      },
      developer: {
        focus: 'Technical implementation and maintainability',
        questions: ['How complex is this to implement?', 'What are the technical trade-offs?', 'How maintainable is this?'],
        concerns: ['Code quality', 'Technical debt', 'Development time', 'Tool ecosystem']
      },
      business: {
        focus: 'ROI, market impact, and strategic alignment',
        questions: ['What\'s the business value?', 'How does this affect our market position?', 'What\'s the ROI?'],
        concerns: ['Cost', 'Time to market', 'Competitive advantage', 'Resource allocation']
      },
      security: {
        focus: 'Risk assessment and threat mitigation',
        questions: ['What are the security implications?', 'What could go wrong?', 'How do we mitigate risks?'],
        concerns: ['Data protection', 'Access control', 'Vulnerability surface', 'Compliance']
      },
      critical: {
        focus: 'Challenging assumptions and finding flaws',
        questions: ['What could go wrong?', 'What assumptions are we making?', 'What are we not considering?'],
        concerns: ['Hidden costs', 'Unintended consequences', 'Failure modes', 'Bias in reasoning']
      },
      creative: {
        focus: 'Innovation and unconventional solutions',
        questions: ['What if we tried something completely different?', 'How could we make this more elegant?', 'What would an ideal solution look like?'],
        concerns: ['Breaking out of conventional thinking', 'Finding elegant solutions', 'Innovation opportunities']
      }
    };

    const framework = perspectiveFrameworks[perspective as keyof typeof perspectiveFrameworks] || {
      focus: 'General analysis from this viewpoint',
      questions: ['How does this look from this perspective?', 'What are the key considerations?'],
      concerns: ['Main considerations', 'Potential issues']
    };

    analysis += `**Focus**: ${framework.focus}\n\n`;

    if (depth !== 'surface') {
      analysis += `**Key Questions**:\n`;
      framework.questions.forEach((q, i) => {
        analysis += `${i + 1}. ${q}\n`;
      });
      analysis += '\n';

      analysis += `**Primary Concerns**:\n`;
      framework.concerns.forEach((c, i) => {
        analysis += `• ${c}\n`;
      });
      analysis += '\n';
    }

    if (depth === 'comprehensive') {
      analysis += `**Detailed Analysis**:\n`;
      analysis += `From the ${perspective} perspective, this question involves several layers of consideration...\n\n`;
      analysis += `**Strengths**: [What works well from this viewpoint]\n`;
      analysis += `**Weaknesses**: [What doesn't work well from this viewpoint]\n`;
      analysis += `**Opportunities**: [What possibilities does this perspective reveal]\n`;
      analysis += `**Threats/Risks**: [What concerns does this perspective highlight]\n\n`;
    }

    analysis += `**${perspective.charAt(0).toUpperCase() + perspective.slice(1)} Recommendation**: `;
    analysis += this.generatePerspectiveRecommendation(perspective, question);

    return analysis;
  }

  private generatePerspectiveRecommendation(perspective: string, question: string): string {
    const recommendations = {
      user: "Prioritize simplicity and clear value delivery. Focus on the user experience above all else.",
      developer: "Consider long-term maintainability and choose proven, well-documented solutions.",
      business: "Ensure clear ROI metrics and alignment with strategic objectives before proceeding.",
      security: "Implement defense-in-depth and follow security best practices from the start.",
      critical: "Challenge the underlying assumptions and consider alternative approaches entirely.",
      creative: "Explore unconventional solutions that might offer breakthrough improvements.",
      performance: "Optimize for the most common use cases while monitoring and measuring impact.",
      cost: "Evaluate total cost of ownership including hidden and ongoing costs.",
      ethical: "Consider the broader impact on all stakeholders and society.",
      technical: "Choose the technically sound solution that balances complexity and capability."
    };

    return recommendations[perspective as keyof typeof recommendations] || 
           "Apply the principles and concerns of this perspective to the decision-making process.";
  }

  private async synthesizePerspectives(question: string, perspectives: string[]): Promise<string> {
    let synthesis = `## 🎯 PERSPECTIVE SYNTHESIS\n\n`;
    
    synthesis += `**Integration Challenge**: How do we balance the different viewpoints to find the best path forward?\n\n`;
    
    synthesis += `**Common Themes**:\n`;
    synthesis += `• All perspectives emphasize the importance of [identifying common ground]\n`;
    synthesis += `• Multiple viewpoints agree that [finding consensus points]\n`;
    synthesis += `• There's general alignment on [shared priorities]\n\n`;
    
    synthesis += `**Key Tensions**:\n`;
    synthesis += `• User simplicity vs. Technical capability\n`;
    synthesis += `• Business speed vs. Security thoroughness\n`;
    synthesis += `• Creative innovation vs. Critical risk management\n`;
    synthesis += `• Cost efficiency vs. Quality/Performance\n\n`;
    
    synthesis += `**Synthesis Strategy**:\n`;
    synthesis += `1. **Primary Focus**: [Which perspective should lead?]\n`;
    synthesis += `2. **Must-Have Constraints**: [Non-negotiable requirements from critical perspectives]\n`;
    synthesis += `3. **Optimization Targets**: [Where we can find win-win solutions]\n`;
    synthesis += `4. **Acceptable Trade-offs**: [What we're willing to compromise on]\n\n`;
    
    synthesis += `**Integrated Recommendation**:\n`;
    synthesis += `Based on analyzing this from ${perspectives.length} different perspectives, the most balanced approach appears to be...\n\n`;
    synthesis += `This synthesis acknowledges the legitimate concerns of each viewpoint while finding a path that optimizes for the most critical factors.\n\n`;
    
    synthesis += `**Next Steps for Validation**:\n`;
    synthesis += `• Test key assumptions from each perspective\n`;
    synthesis += `• Gather feedback from stakeholders representing each viewpoint\n`;
    synthesis += `• Create prototypes or pilots to validate the integrated approach\n`;
    synthesis += `• Monitor metrics that matter to each perspective\n\n`;
    
    synthesis += `*This multi-perspective analysis helps ensure we don't miss important considerations and find solutions that work for all stakeholders.*`;
    
    return synthesis;
  }
}