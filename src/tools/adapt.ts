import { BaseTool } from './base.js';

export class AdaptTool extends BaseTool {
  name = 'Adapt';
  description = 'Adapt communication style, tone, and approach based on user preferences and context';
  parameters = {
    action: {
      type: 'string',
      description: 'Action to perform: analyze, adjust, suggest, calibrate',
      required: true,
      enum: ['analyze', 'adjust', 'suggest', 'calibrate']
    },
    content: {
      type: 'string',
      description: 'Content to analyze or adapt',
    },
    target_style: {
      type: 'string',
      description: 'Target communication style',
      enum: ['casual', 'professional', 'technical', 'friendly', 'concise', 'detailed', 'encouraging', 'direct']
    },
    context: {
      type: 'string',
      description: 'Context for the adaptation (beginner, expert, frustrated, excited, etc.)',
    },
    user_feedback: {
      type: 'string',
      description: 'Recent user feedback or reactions to consider',
    }
  };

  async _execute(params: Record<string, any>): Promise<string> {
    const { action, content, target_style, context, user_feedback } = params;

    switch (action) {
      case 'analyze':
        return this.analyzeUserStyle(content || '', context);
      
      case 'adjust':
        return this.adjustCommunication(content || '', target_style, context);
      
      case 'suggest':
        return this.suggestAdaptations(context, user_feedback);
      
      case 'calibrate':
        return this.calibrateCommunication(user_feedback || '', context);
      
      default:
        return `Error: Unknown action "${action}"`;
    }
  }

  private analyzeUserStyle(content: string, context?: string): string {
    let analysis = `🎭 **Communication Style Analysis**\n\n`;
    
    if (content) {
      analysis += `**Input Analysis**: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"\n\n`;
      
      const styleIndicators = this.detectStyleIndicators(content);
      
      analysis += `**Detected Style Indicators**:\n`;
      Object.entries(styleIndicators).forEach(([style, score]) => {
        const level = score > 70 ? 'Strong' : score > 40 ? 'Moderate' : 'Weak';
        analysis += `• ${style}: ${score}% (${level})\n`;
      });
      
      analysis += `\n**Recommended Response Style**: ${this.recommendResponseStyle(styleIndicators)}\n\n`;
    }

    analysis += `**Communication Preferences Detected**:\n`;
    analysis += `• **Detail Level**: ${this.detectDetailPreference(content)}\n`;
    analysis += `• **Formality**: ${this.detectFormalityLevel(content)}\n`;
    analysis += `• **Technical Depth**: ${this.detectTechnicalLevel(content)}\n`;
    analysis += `• **Interaction Style**: ${this.detectInteractionStyle(content)}\n\n`;

    if (context) {
      analysis += `**Context Considerations**: ${context}\n`;
      analysis += `**Contextual Adaptations**: ${this.suggestContextualAdaptations(context)}\n\n`;
    }

    analysis += `**Adaptation Strategy**:\n`;
    analysis += this.generateAdaptationStrategy(content, context);

    return analysis;
  }

  private adjustCommunication(content: string, targetStyle?: string, context?: string): string {
    let adjustment = `🔧 **Communication Adjustment**\n\n`;
    
    if (targetStyle) {
      adjustment += `**Target Style**: ${targetStyle}\n`;
      adjustment += `**Original**: ${content.substring(0, 150)}${content.length > 150 ? '...' : ''}\n\n`;
      
      adjustment += `**Adjusted Version**:\n`;
      adjustment += this.adaptToStyle(content, targetStyle);
      
      adjustment += `\n\n**Changes Made**:\n`;
      adjustment += this.explainStyleChanges(targetStyle);
    } else {
      adjustment += `**Auto-Adaptation Based on Context**: ${context || 'general'}\n\n`;
      adjustment += this.autoAdaptContent(content, context);
    }

    return adjustment;
  }

  private suggestAdaptations(context?: string, userFeedback?: string): string {
    let suggestions = `💡 **Communication Adaptation Suggestions**\n\n`;
    
    if (userFeedback) {
      suggestions += `**Based on Feedback**: "${userFeedback}"\n\n`;
      suggestions += this.analyzeFeedback(userFeedback);
    }

    suggestions += `**General Adaptation Options**:\n\n`;
    
    const adaptationOptions = [
      {
        name: 'Detail Level',
        options: ['More concise', 'More detailed', 'Add examples', 'Remove jargon'],
        current: 'Medium detail'
      },
      {
        name: 'Tone',
        options: ['More casual', 'More professional', 'More encouraging', 'More direct'],
        current: 'Balanced'
      },
      {
        name: 'Technical Depth',
        options: ['Simplify explanations', 'Add technical details', 'Include code examples', 'Focus on concepts'],
        current: 'Medium technical'
      },
      {
        name: 'Interaction Style',
        options: ['More questions', 'More statements', 'More collaborative', 'More instructional'],
        current: 'Collaborative'
      }
    ];

    adaptationOptions.forEach(option => {
      suggestions += `**${option.name}** (Current: ${option.current}):\n`;
      option.options.forEach(opt => suggestions += `  • ${opt}\n`);
      suggestions += '\n';
    });

    suggestions += `**Context-Specific Suggestions**:\n`;
    if (context) {
      suggestions += this.getContextSpecificSuggestions(context);
    } else {
      suggestions += `• Provide context for more tailored suggestions\n`;
      suggestions += `• Consider user expertise level\n`;
      suggestions += `• Think about current user state (learning, debugging, exploring)\n`;
    }

    return suggestions;
  }

  private calibrateCommunication(userFeedback: string, context?: string): string {
    let calibration = `⚙️ **Communication Calibration**\n\n`;
    
    calibration += `**Feedback Analysis**: "${userFeedback}"\n\n`;
    
    const sentimentScore = this.analyzeSentiment(userFeedback);
    const satisfactionIndicators = this.detectSatisfactionIndicators(userFeedback);
    
    calibration += `**Sentiment**: ${sentimentScore > 60 ? 'Positive' : sentimentScore > 40 ? 'Neutral' : 'Negative'} (${sentimentScore}%)\n`;
    calibration += `**Satisfaction Indicators**: ${satisfactionIndicators.join(', ')}\n\n`;
    
    calibration += `**Calibration Adjustments**:\n`;
    
    if (sentimentScore < 40) {
      calibration += `🔴 **Immediate Adjustments Needed**:\n`;
      calibration += `• Acknowledge any frustration or confusion\n`;
      calibration += `• Simplify approach and slow down\n`;
      calibration += `• Ask for specific clarification\n`;
      calibration += `• Offer alternative explanations\n\n`;
    } else if (sentimentScore < 60) {
      calibration += `🟡 **Minor Adjustments**:\n`;
      calibration += `• Check understanding more frequently\n`;
      calibration += `• Adjust detail level slightly\n`;
      calibration += `• Be more explicit about next steps\n\n`;
    } else {
      calibration += `🟢 **Current Approach Working Well**:\n`;
      calibration += `• Continue current communication style\n`;
      calibration += `• Can potentially increase pace or complexity\n`;
      calibration += `• Build on current momentum\n\n`;
    }

    calibration += `**Learning for Future Interactions**:\n`;
    calibration += this.extractLearnings(userFeedback, context);

    return calibration;
  }

  private detectStyleIndicators(content: string): Record<string, number> {
    const text = content.toLowerCase();
    
    return {
      casual: this.scorePattern(text, ['please', 'thanks', 'maybe', 'i think', 'kinda', 'sorta']),
      professional: this.scorePattern(text, ['require', 'implement', 'utilize', 'ensure', 'regarding']),
      technical: this.scorePattern(text, ['function', 'api', 'database', 'algorithm', 'framework', 'config']),
      direct: this.scorePattern(text, ['do', 'make', 'create', 'fix', 'need', 'want']),
      detailed: this.scorePattern(text, ['specifically', 'exactly', 'details', 'steps', 'how to']),
      frustrated: this.scorePattern(text, ['not working', 'broken', 'stuck', 'wrong', 'error', 'problem']),
      excited: this.scorePattern(text, ['awesome', 'great', 'love', 'amazing', 'perfect', '!']),
      questioning: this.scorePattern(text, ['?', 'how', 'what', 'why', 'where', 'when', 'which'])
    };
  }

  private scorePattern(text: string, patterns: string[]): number {
    const matches = patterns.filter(pattern => text.includes(pattern)).length;
    return Math.min(100, (matches / patterns.length) * 100 + Math.random() * 20);
  }

  private recommendResponseStyle(indicators: Record<string, number>): string {
    const maxStyle = Object.entries(indicators).reduce((a, b) => indicators[a[0]] > indicators[b[0]] ? a : b);
    
    const styleMap = {
      casual: 'Friendly and conversational',
      professional: 'Clear and structured',
      technical: 'Detailed and precise',
      direct: 'Concise and action-oriented',
      detailed: 'Comprehensive with examples',
      frustrated: 'Patient and supportive',
      excited: 'Enthusiastic and encouraging',
      questioning: 'Educational and exploratory'
    };

    return styleMap[maxStyle[0] as keyof typeof styleMap] || 'Balanced and adaptive';
  }

  private detectDetailPreference(content: string): string {
    const detailIndicators = ['specifically', 'exactly', 'details', 'steps', 'how to', 'explain'];
    const conciseIndicators = ['quick', 'brief', 'summary', 'short', 'tldr'];
    
    const detailScore = detailIndicators.filter(ind => content.toLowerCase().includes(ind)).length;
    const conciseScore = conciseIndicators.filter(ind => content.toLowerCase().includes(ind)).length;
    
    if (detailScore > conciseScore) return 'Detailed explanations preferred';
    if (conciseScore > detailScore) return 'Concise responses preferred';
    return 'Medium detail level';
  }

  private detectFormalityLevel(content: string): string {
    const formalIndicators = ['please', 'would you', 'could you', 'i would like'];
    const informalIndicators = ['hey', 'hi', 'thanks', 'thx'];
    
    const formalScore = formalIndicators.filter(ind => content.toLowerCase().includes(ind)).length;
    const informalScore = informalIndicators.filter(ind => content.toLowerCase().includes(ind)).length;
    
    if (formalScore > informalScore) return 'Formal';
    if (informalScore > formalScore) return 'Informal';
    return 'Neutral';
  }

  private detectTechnicalLevel(content: string): string {
    const technicalTerms = ['api', 'database', 'algorithm', 'function', 'class', 'framework', 'implementation'];
    const score = technicalTerms.filter(term => content.toLowerCase().includes(term)).length;
    
    if (score >= 3) return 'High technical comfort';
    if (score >= 1) return 'Medium technical comfort';
    return 'Low technical comfort';
  }

  private detectInteractionStyle(content: string): string {
    const questionMarks = (content.match(/\?/g) || []).length;
    const statements = content.split(/[.!]/).length - 1;
    
    if (questionMarks > statements) return 'Inquiry-focused';
    return 'Statement-focused';
  }

  private suggestContextualAdaptations(context: string): string {
    const adaptations = {
      beginner: 'Use simpler language, provide more background, include examples',
      expert: 'Use technical terms, focus on nuances, assume domain knowledge',
      frustrated: 'Be extra patient, acknowledge difficulty, provide step-by-step help',
      excited: 'Match enthusiasm, build on momentum, suggest next challenges',
      debugging: 'Be systematic, ask diagnostic questions, provide structured approach',
      learning: 'Focus on understanding, provide explanations, encourage questions'
    };

    return adaptations[context as keyof typeof adaptations] || 'Adapt based on specific context cues';
  }

  private adaptToStyle(content: string, style: string): string {
    // This would normally use AI to rewrite content, but for demo:
    const adaptations = {
      casual: `Hey! So about your question... ${content}`,
      professional: `Regarding your inquiry: ${content}`,
      technical: `From a technical perspective: ${content}`,
      concise: `TL;DR: ${content.substring(0, 100)}...`,
      detailed: `Let me explain in detail: ${content} [Would normally expand with examples]`,
      encouraging: `Great question! You're on the right track. ${content}`,
      direct: `Here's what you need to do: ${content}`
    };

    return adaptations[style as keyof typeof adaptations] || content;
  }

  private explainStyleChanges(style: string): string {
    const explanations = {
      casual: '• Changed to conversational tone\n• Added friendly greetings\n• Used informal language',
      professional: '• Used formal language\n• Structured response clearly\n• Maintained professional tone',
      technical: '• Increased technical terminology\n• Added implementation details\n• Focused on precise language',
      concise: '• Removed unnecessary words\n• Focused on key points\n• Shortened explanations',
      detailed: '• Added comprehensive explanations\n• Included examples\n• Expanded on concepts',
      encouraging: '• Added positive reinforcement\n• Acknowledged good thinking\n• Motivated further learning',
      direct: '• Focused on actionable steps\n• Removed ambiguity\n• Clear call-to-action'
    };

    return explanations[style as keyof typeof explanations] || '• Applied requested style changes';
  }

  private autoAdaptContent(content: string, context?: string): string {
    return `**Auto-adapted content based on ${context || 'general context'}**:\n\n${content}\n\n*[Content would be automatically adjusted based on detected user preferences and context]*`;
  }

  private analyzeFeedback(feedback: string): string {
    let analysis = `**Feedback Interpretation**:\n`;
    
    if (feedback.toLowerCase().includes('too detailed') || feedback.includes('tldr')) {
      analysis += `• User prefers more concise responses\n`;
    }
    if (feedback.toLowerCase().includes('need more detail') || feedback.includes('explain more')) {
      analysis += `• User wants more comprehensive explanations\n`;
    }
    if (feedback.toLowerCase().includes('confusing') || feedback.includes('unclear')) {
      analysis += `• Need to simplify language and structure\n`;
    }
    if (feedback.toLowerCase().includes('helpful') || feedback.includes('thanks')) {
      analysis += `• Current approach is working well\n`;
    }

    return analysis + '\n';
  }

  private getContextSpecificSuggestions(context: string): string {
    const suggestions = {
      'debugging': '• Ask diagnostic questions\n• Provide systematic troubleshooting steps\n• Acknowledge frustration\n',
      'learning': '• Include conceptual explanations\n• Provide practice opportunities\n• Encourage questions\n',
      'time_pressure': '• Lead with quick solutions\n• Provide detailed explanations later\n• Offer immediate next steps\n',
      'exploration': '• Suggest related topics\n• Provide multiple approaches\n• Encourage experimentation\n'
    };

    return suggestions[context as keyof typeof suggestions] || '• Adapt based on specific context\n';
  }

  private analyzeSentiment(feedback: string): number {
    const positiveWords = ['good', 'great', 'helpful', 'thanks', 'perfect', 'awesome', 'clear'];
    const negativeWords = ['bad', 'wrong', 'confusing', 'unclear', 'unhelpful', 'frustrating'];
    
    const positiveScore = positiveWords.filter(word => feedback.toLowerCase().includes(word)).length;
    const negativeScore = negativeWords.filter(word => feedback.toLowerCase().includes(word)).length;
    
    return Math.max(0, Math.min(100, 50 + (positiveScore - negativeScore) * 20));
  }

  private detectSatisfactionIndicators(feedback: string): string[] {
    const indicators = [];
    
    if (feedback.includes('thanks') || feedback.includes('helpful')) {
      indicators.push('Gratitude expressed');
    }
    if (feedback.includes('but') || feedback.includes('however')) {
      indicators.push('Mixed feedback');
    }
    if (feedback.includes('perfect') || feedback.includes('exactly')) {
      indicators.push('High satisfaction');
    }
    if (feedback.includes('still confused') || feedback.includes('not clear')) {
      indicators.push('Continued confusion');
    }

    return indicators.length > 0 ? indicators : ['Neutral feedback'];
  }

  private extractLearnings(feedback: string, context?: string): string {
    return `• Communication preferences: [Extracted from feedback]\n` +
           `• Effective approaches: [What worked well]\n` +
           `• Areas for improvement: [What needs adjustment]\n` +
           `• Context-specific insights: [Learnings for similar situations]\n`;
  }

  private generateAdaptationStrategy(content: string, context?: string): string {
    return `1. **Immediate Response**: Match detected user style and preferences\n` +
           `2. **Ongoing Calibration**: Monitor user reactions and adjust accordingly\n` +
           `3. **Context Awareness**: Consider situational factors (urgency, complexity, mood)\n` +
           `4. **Personal Learning**: Build profile of user preferences over time\n` +
           `5. **Flexible Approach**: Be ready to shift style if current approach isn't working\n\n` +
           `*This adaptive approach mirrors how conscious beings naturally adjust their communication based on social cues and feedback.*`;
  }
}