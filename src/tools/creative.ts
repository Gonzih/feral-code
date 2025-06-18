import { BaseTool } from './base.js';

export class CreativeTool extends BaseTool {
  name = 'Creative';
  description = 'Generate novel solutions through creative and unconventional thinking';
  parameters = {
    challenge: {
      type: 'string',
      description: 'The challenge or problem requiring creative solutions',
      required: true,
    },
    mode: {
      type: 'string',
      description: 'Creative thinking mode to employ',
      enum: ['brainstorm', 'lateral', 'synthesis', 'breakthrough', 'analogical', 'inversion']
    },
    constraints: {
      type: 'string',
      description: 'Known constraints or limitations to work within or around',
    },
    inspiration: {
      type: 'string',
      description: 'Sources of inspiration or domains to draw from',
    }
  };

  async _execute(params: Record<string, any>): Promise<string> {
    const { challenge, mode = 'brainstorm', constraints, inspiration } = params;

    switch (mode) {
      case 'brainstorm':
        return this.brainstormSolutions(challenge, constraints);
      
      case 'lateral':
        return this.lateralThinking(challenge, constraints);
      
      case 'synthesis':
        return this.synthesizeNovelApproaches(challenge, inspiration);
      
      case 'breakthrough':
        return this.breakthroughThinking(challenge, constraints);
      
      case 'analogical':
        return this.analogicalReasoning(challenge, inspiration);
      
      case 'inversion':
        return this.inversionThinking(challenge);
      
      default:
        return `Error: Unknown creative mode "${mode}"`;
    }
  }

  private brainstormSolutions(challenge: string, constraints?: string): string {
    let brainstorm = `🧠⚡ **Creative Brainstorming: "${challenge}"**\n\n`;
    
    brainstorm += `**Brainstorming Rules**:\n`;
    brainstorm += `• No judgment during idea generation\n`;
    brainstorm += `• Quantity over quality initially\n`;
    brainstorm += `• Build on others' ideas\n`;
    brainstorm += `• Encourage wild and unusual ideas\n`;
    brainstorm += `• Stay focused on the challenge\n\n`;
    
    if (constraints) {
      brainstorm += `**Constraints to Consider**: ${constraints}\n\n`;
    }
    
    brainstorm += `**Idea Generation Streams**:\n\n`;
    
    brainstorm += `**Stream 1: Direct Solutions**\n`;
    const directIdeas = this.generateDirectSolutions(challenge);
    directIdeas.forEach((idea, i) => {
      brainstorm += `${i + 1}. ${idea}\n`;
    });
    
    brainstorm += `\n**Stream 2: Indirect Approaches**\n`;
    const indirectIdeas = this.generateIndirectSolutions(challenge);
    indirectIdeas.forEach((idea, i) => {
      brainstorm += `${i + 1}. ${idea}\n`;
    });
    
    brainstorm += `\n**Stream 3: Wild Cards**\n`;
    const wildIdeas = this.generateWildSolutions(challenge);
    wildIdeas.forEach((idea, i) => {
      brainstorm += `${i + 1}. ${idea}\n`;
    });
    
    brainstorm += `\n**Stream 4: Combination Ideas**\n`;
    brainstorm += `• What if we combined approach #1 and #7?\n`;
    brainstorm += `• What if we applied the wild card idea to the direct solution?\n`;
    brainstorm += `• What if we inverted the indirect approach?\n`;
    brainstorm += `• What if we scaled up/down the solution dramatically?\n\n`;
    
    brainstorm += `**Promising Directions for Development**:\n`;
    brainstorm += `• [Identify 2-3 most promising ideas for further exploration]\n`;
    brainstorm += `• [Note which combinations might be particularly powerful]\n`;
    brainstorm += `• [Highlight which ideas address constraints creatively]\n\n`;
    
    brainstorm += `*Next step: Select the most promising ideas for detailed development and evaluation.*`;

    return brainstorm;
  }

  private lateralThinking(challenge: string, constraints?: string): string {
    let lateral = `🔄 **Lateral Thinking: "${challenge}"**\n\n`;
    
    lateral += `**Lateral Thinking Techniques**:\n\n`;
    
    lateral += `**1. Random Word Association**\n`;
    const randomWords = ['ocean', 'jazz', 'gravity', 'origami', 'quantum', 'garden', 'mirror'];
    const randomWord = randomWords[Math.floor(Math.random() * randomWords.length)];
    lateral += `Random word: "${randomWord}"\n`;
    lateral += `How does "${randomWord}" relate to our challenge?\n`;
    lateral += `• What properties of ${randomWord} could we apply?\n`;
    lateral += `• What metaphors or analogies emerge?\n`;
    lateral += `• What unexpected connections do you notice?\n\n`;
    
    lateral += `**2. Why Ladder**\n`;
    lateral += `Why is this challenge important?\n`;
    lateral += `→ Because [reason 1]\n`;
    lateral += `  Why is [reason 1] important?\n`;
    lateral += `  → Because [deeper reason]\n`;
    lateral += `    Why is [deeper reason] important?\n`;
    lateral += `    → Because [fundamental reason]\n\n`;
    lateral += `*This helps us attack the problem at different levels*\n\n`;
    
    lateral += `**3. Assumption Reversal**\n`;
    lateral += `What assumptions are we making about this challenge?\n`;
    const assumptions = this.identifyAssumptions(challenge);
    assumptions.forEach((assumption, i) => {
      lateral += `• Assumption ${i + 1}: ${assumption}\n`;
      lateral += `  Reversal: What if the opposite were true?\n`;
      lateral += `  Implications: How would this change our approach?\n\n`;
    });
    
    lateral += `**4. Perspective Shifting**\n`;
    lateral += `How would different entities approach this?\n`;
    lateral += `• A child: [Innocent, playful approach]\n`;
    lateral += `• An alien: [Completely different assumptions]\n`;
    lateral += `• A poet: [Metaphorical, aesthetic approach]\n`;
    lateral += `• A minimalist: [Simplest possible solution]\n`;
    lateral += `• A maximalist: [Most elaborate possible solution]\n\n`;
    
    lateral += `**5. Constraint Addition**\n`;
    lateral += `What if we added artificial constraints?\n`;
    lateral += `• What if we had to solve this with only $1?\n`;
    lateral += `• What if we had to solve this in 1 minute?\n`;
    lateral += `• What if we couldn't use any technology?\n`;
    lateral += `• What if we had unlimited resources?\n\n`;
    
    lateral += `**Lateral Insights**:\n`;
    lateral += `• [Novel approaches that emerged from these techniques]\n`;
    lateral += `• [Unexpected connections discovered]\n`;
    lateral += `• [Assumptions that were successfully challenged]\n\n`;
    
    lateral += `*Lateral thinking helps us escape conventional patterns and discover innovative solutions.*`;

    return lateral;
  }

  private synthesizeNovelApproaches(challenge: string, inspiration?: string): string {
    let synthesis = `🎨 **Creative Synthesis: "${challenge}"**\n\n`;
    
    synthesis += `**Synthesis Challenge**: How can we combine disparate ideas, concepts, and approaches to create something entirely new?\n\n`;
    
    if (inspiration) {
      synthesis += `**Inspiration Sources**: ${inspiration}\n\n`;
    }
    
    synthesis += `**Cross-Domain Pattern Mining**:\n\n`;
    
    const domains = ['Nature', 'Music', 'Architecture', 'Games', 'Cooking', 'Sports', 'Art', 'Physics'];
    const selectedDomains = domains.slice(0, 4);
    
    selectedDomains.forEach(domain => {
      synthesis += `**From ${domain}**:\n`;
      synthesis += `• Key patterns: ${this.getDomainPatterns(domain)}\n`;
      synthesis += `• Applicable principles: ${this.getDomainPrinciples(domain)}\n`;
      synthesis += `• Adaptation to our challenge: [How these patterns could apply]\n\n`;
    });
    
    synthesis += `**Synthesis Experiments**:\n\n`;
    
    synthesis += `**Experiment 1: Biological + Digital**\n`;
    synthesis += `• What if we treated our challenge like an ecosystem?\n`;
    synthesis += `• How would evolution solve this problem?\n`;
    synthesis += `• What digital tools could mimic biological processes?\n\n`;
    
    synthesis += `**Experiment 2: Musical + Mathematical**\n`;
    synthesis += `• What if solutions had rhythm and harmony?\n`;
    synthesis += `• How do mathematical patterns create beauty?\n`;
    synthesis += `• What would a melodic solution look like?\n\n`;
    
    synthesis += `**Experiment 3: Architectural + Social**\n`;
    synthesis += `• How do we build social structures?\n`;
    synthesis += `• What makes spaces functional and beautiful?\n`;
    synthesis += `• How do people flow through our solution?\n\n`;
    
    synthesis += `**Novel Synthesis Ideas**:\n`;
    synthesis += `1. **Hybrid Approach**: [Combining two unexpected domains]\n`;
    synthesis += `2. **Layered Solution**: [Multiple approaches working at different levels]\n`;
    synthesis += `3. **Emergent Design**: [Solution that emerges from simple rules]\n`;
    synthesis += `4. **Metamorphic Process**: [Solution that transforms itself over time]\n`;
    synthesis += `5. **Symbiotic System**: [Multiple elements benefiting each other]\n\n`;
    
    synthesis += `**Creative Breakthrough Potential**:\n`;
    synthesis += `• Which synthesis creates the most unexpected value?\n`;
    synthesis += `• What combination feels most elegant and powerful?\n`;
    synthesis += `• Where do we see genuine innovation emerging?\n\n`;
    
    synthesis += `*Creative synthesis often produces solutions that are greater than the sum of their parts.*`;

    return synthesis;
  }

  private breakthroughThinking(challenge: string, constraints?: string): string {
    let breakthrough = `💥 **Breakthrough Thinking: "${challenge}"**\n\n`;
    
    breakthrough += `**Breakthrough Mindset**: How can we completely reframe this challenge to find revolutionary solutions?\n\n`;
    
    if (constraints) {
      breakthrough += `**Current Constraints**: ${constraints}\n`;
      breakthrough += `**Constraint Breakthrough**: What if these weren't actually constraints?\n\n`;
    }
    
    breakthrough += `**Paradigm Shift Exploration**:\n\n`;
    
    breakthrough += `**1. Redefining the Problem**\n`;
    breakthrough += `• What if this isn't really the problem we should be solving?\n`;
    breakthrough += `• What if the real problem is three levels deeper?\n`;
    breakthrough += `• What if solving this problem would create a bigger problem?\n`;
    breakthrough += `• What if the problem is actually an opportunity in disguise?\n\n`;
    
    breakthrough += `**2. Eliminating the Problem**\n`;
    breakthrough += `• What if we could make this problem irrelevant?\n`;
    breakthrough += `• What if we changed the context so the problem disappears?\n`;
    breakthrough += `• What if we solved a different problem that makes this one obsolete?\n`;
    breakthrough += `• What if we prevented the problem from occurring in the first place?\n\n`;
    
    breakthrough += `**3. Inverting Success Criteria**\n`;
    breakthrough += `• What if success means the opposite of what we think?\n`;
    breakthrough += `• What if the best solution looks like failure initially?\n`;
    breakthrough += `• What if we optimized for completely different metrics?\n`;
    breakthrough += `• What if we made the problem worse to make it better?\n\n`;
    
    breakthrough += `**4. Resource Transformation**\n`;
    breakthrough += `• What if our biggest limitation became our greatest asset?\n`;
    breakthrough += `• What if we had infinite resources - what would we do?\n`;
    breakthrough += `• What if we had zero resources - what would we do?\n`;
    breakthrough += `• What if the solution required no additional resources?\n\n`;
    
    breakthrough += `**5. Time Dimension Shifts**\n`;
    breakthrough += `• What if we solved this problem before it happened?\n`;
    breakthrough += `• What if we solved this problem after it was too late?\n`;
    breakthrough += `• What if time moved backwards for this problem?\n`;
    breakthrough += `• What if this problem occurred in a different time period?\n\n`;
    
    breakthrough += `**Revolutionary Possibilities**:\n`;
    breakthrough += `• **Paradigm Breaker**: [Solution that changes the entire game]\n`;
    breakthrough += `• **Context Shifter**: [Solution that redefines the environment]\n`;
    breakthrough += `• **Rule Rewriter**: [Solution that establishes new principles]\n`;
    breakthrough += `• **Dimension Transcender**: [Solution that operates beyond current dimensions]\n\n`;
    
    breakthrough += `**Breakthrough Assessment**:\n`;
    breakthrough += `• Which ideas feel genuinely revolutionary?\n`;
    breakthrough += `• What would be different if these solutions existed?\n`;
    breakthrough += `• How would the world change?\n`;
    breakthrough += `• What resistance would these ideas face and why?\n\n`;
    
    breakthrough += `*True breakthroughs often seem impossible until they become inevitable.*`;

    return breakthrough;
  }

  private analogicalReasoning(challenge: string, inspiration?: string): string {
    let analogical = `🔍 **Analogical Reasoning: "${challenge}"**\n\n`;
    
    analogical += `**Power of Analogies**: How can we find solutions by looking at how similar problems are solved in completely different domains?\n\n`;
    
    if (inspiration) {
      analogical += `**Inspiration Sources**: ${inspiration}\n\n`;
    }
    
    analogical += `**Analogical Exploration**:\n\n`;
    
    analogical += `**Nature Analogies**:\n`;
    analogical += `• How do trees solve similar problems? (Growth, resource distribution, adaptation)\n`;
    analogical += `• How do ant colonies handle this? (Emergent behavior, collective intelligence)\n`;
    analogical += `• How do rivers approach this? (Finding optimal paths, handling obstacles)\n`;
    analogical += `• How do immune systems deal with this? (Recognition, response, memory)\n\n`;
    
    analogical += `**Human System Analogies**:\n`;
    analogical += `• How do cities solve this problem? (Infrastructure, flow, organization)\n`;
    analogical += `• How do orchestras handle this? (Coordination, harmony, leadership)\n`;
    analogical += `• How do markets approach this? (Supply, demand, price discovery)\n`;
    analogical += `• How do languages evolve to handle this? (Communication, meaning, adaptation)\n\n`;
    
    analogical += `**Mechanical Analogies**:\n`;
    analogical += `• How do engines solve this? (Energy conversion, efficiency, power)\n`;
    analogical += `• How do clocks handle this? (Precision, coordination, reliability)\n`;
    analogical += `• How do bridges approach this? (Spanning, support, load distribution)\n`;
    analogical += `• How do computers process this? (Logic, memory, algorithms)\n\n`;
    
    analogical += `**Abstract System Analogies**:\n`;
    analogical += `• How do stories solve this? (Narrative, tension, resolution)\n`;
    analogical += `• How do games handle this? (Rules, strategy, engagement)\n`;
    analogical += `• How do relationships approach this? (Communication, trust, growth)\n`;
    analogical += `• How do learning processes deal with this? (Practice, feedback, mastery)\n\n`;
    
    analogical += `**Deep Analogical Insights**:\n\n`;
    
    analogical += `**Structural Similarities**:\n`;
    analogical += `• What structural patterns repeat across different domains?\n`;
    analogical += `• Which analogies reveal hidden aspects of our challenge?\n`;
    analogical += `• What universal principles emerge?\n\n`;
    
    analogical += `**Functional Mappings**:\n`;
    analogical += `• How do the functions map between domains?\n`;
    analogical += `• What adaptations are needed for our context?\n`;
    analogical += `• Which functional relationships are most important?\n\n`;
    
    analogical += `**Solution Translations**:\n`;
    analogical += `1. **Biological Solution**: [Adapt natural process to our challenge]\n`;
    analogical += `2. **Social Solution**: [Apply human organization patterns]\n`;
    analogical += `3. **Mechanical Solution**: [Use engineering principles]\n`;
    analogical += `4. **Abstract Solution**: [Apply conceptual frameworks]\n\n`;
    
    analogical += `**Analogical Synthesis**:\n`;
    analogical += `• Which analogies provide the most insight?\n`;
    analogical += `• How can we combine insights from multiple analogies?\n`;
    analogical += `• What new analogies does our analysis suggest?\n\n`;
    
    analogical += `*Analogical reasoning helps us leverage the vast library of solutions that already exist in nature and human systems.*`;

    return analogical;
  }

  private inversionThinking(challenge: string): string {
    let inversion = `🔄 **Inversion Thinking: "${challenge}"**\n\n`;
    
    inversion += `**Inversion Principle**: Sometimes the best way to solve a problem is to think about its opposite.\n\n`;
    
    inversion += `**Inversion Exercises**:\n\n`;
    
    inversion += `**1. Goal Inversion**\n`;
    inversion += `• Instead of asking "How do we achieve X?"\n`;
    inversion += `• Ask "How do we prevent not-X?"\n`;
    inversion += `• Ask "How do we avoid failure?"\n`;
    inversion += `• Ask "What would guarantee we don't solve this?"\n\n`;
    
    inversion += `**2. Process Inversion**\n`;
    inversion += `• What if we started from the end and worked backwards?\n`;
    inversion += `• What if we did everything in reverse order?\n`;
    inversion += `• What if we inverted our methodology?\n`;
    inversion += `• What if we began with the conclusion?\n\n`;
    
    inversion += `**3. Assumption Inversion**\n`;
    const assumptions = this.identifyAssumptions(challenge);
    assumptions.forEach((assumption, i) => {
      inversion += `• Assumption: ${assumption}\n`;
      inversion += `  Inversion: ${this.invertAssumption(assumption)}\n`;
      inversion += `  Implications: [What this reveals about the problem]\n\n`;
    });
    
    inversion += `**4. Value Inversion**\n`;
    inversion += `• What if we optimized for the opposite of our current values?\n`;
    inversion += `• What if we made it harder instead of easier?\n`;
    inversion += `• What if we made it more expensive instead of cheaper?\n`;
    inversion += `• What if we made it slower instead of faster?\n\n`;
    
    inversion += `**5. Stakeholder Inversion**\n`;
    inversion += `• What if our users were our enemies?\n`;
    inversion += `• What if our strengths were our weaknesses?\n`;
    inversion += `• What if our supporters were our obstacles?\n`;
    inversion += `• What if our resources were our constraints?\n\n`;
    
    inversion += `**6. Outcome Inversion**\n`;
    inversion += `• What would the worst possible outcome look like?\n`;
    inversion += `• How could we guarantee failure?\n`;
    inversion += `• What would success look like to our opponents?\n`;
    inversion += `• How could we make the problem worse?\n\n`;
    
    inversion += `**Inversion Insights**:\n`;
    inversion += `• **Failure Prevention**: [Ways to avoid what doesn't work]\n`;
    inversion += `• **Backwards Design**: [Starting from desired end state]\n`;
    inversion += `• **Opposite Optimization**: [Finding value in unexpected places]\n`;
    inversion += `• **Paradoxical Solutions**: [Solutions that seem counterintuitive]\n\n`;
    
    inversion += `**Synthesis from Inversion**:\n`;
    inversion += `• Which inversions revealed unexpected insights?\n`;
    inversion += `• How can we combine normal and inverted approaches?\n`;
    inversion += `• What patterns emerge from thinking backwards?\n`;
    inversion += `• Which inverted ideas actually make sense when examined closely?\n\n`;
    
    inversion += `*Inversion thinking often reveals blind spots and opens up solution spaces we hadn't considered.*`;

    return inversion;
  }

  // Helper methods
  private generateDirectSolutions(challenge: string): string[] {
    return [
      "Address the problem systematically using established best practices",
      "Apply proven methodologies from similar successful cases",
      "Leverage existing tools and frameworks designed for this type of challenge",
      "Build incrementally on current approaches with targeted improvements",
      "Seek expert consultation and follow industry standards"
    ];
  }

  private generateIndirectSolutions(challenge: string): string[] {
    return [
      "Change the environment so the problem becomes easier to solve",
      "Solve a related problem that makes this one irrelevant",
      "Wait for external conditions to change favorably",
      "Reframe the problem as an opportunity for innovation",
      "Address the root cause instead of the symptoms"
    ];
  }

  private generateWildSolutions(challenge: string): string[] {
    return [
      "What if we turned this into a game or competition?",
      "What if we made it completely transparent and public?",
      "What if we automated the entire process with AI?",
      "What if we used virtual or augmented reality?",
      "What if we crowdsourced the solution globally?",
      "What if we made it beautiful instead of just functional?",
      "What if we solved it accidentally while doing something else?"
    ];
  }

  private identifyAssumptions(challenge: string): string[] {
    return [
      "We need to solve this problem ourselves",
      "The solution must be practical and implementable",
      "We have limited resources to work with",
      "The problem needs to be solved quickly",
      "The solution should be cost-effective"
    ];
  }

  private invertAssumption(assumption: string): string {
    const inversions = {
      "We need to solve this problem ourselves": "Someone else should solve this for us",
      "The solution must be practical and implementable": "The solution can be theoretical or impossible",
      "We have limited resources to work with": "We have unlimited resources available",
      "The problem needs to be solved quickly": "We should take as long as needed",
      "The solution should be cost-effective": "Cost is not a consideration"
    };
    
    return inversions[assumption as keyof typeof inversions] || "Opposite of: " + assumption;
  }

  private getDomainPatterns(domain: string): string {
    const patterns = {
      Nature: "Growth, adaptation, cycles, symbiosis, emergence",
      Music: "Rhythm, harmony, crescendo, variations, improvisation",
      Architecture: "Foundation, structure, flow, aesthetics, durability",
      Games: "Rules, strategy, progression, feedback, engagement",
      Cooking: "Preparation, timing, combination, transformation, taste",
      Sports: "Training, teamwork, competition, performance, endurance",
      Art: "Expression, composition, color, emotion, interpretation",
      Physics: "Forces, energy, conservation, equilibrium, relativity"
    };
    
    return patterns[domain as keyof typeof patterns] || "Fundamental patterns of this domain";
  }

  private getDomainPrinciples(domain: string): string {
    const principles = {
      Nature: "Evolution, survival of the fittest, resource optimization",
      Music: "Tension and resolution, pattern and variation, emotional resonance",
      Architecture: "Form follows function, structural integrity, human scale",
      Games: "Clear objectives, meaningful choices, progressive difficulty",
      Cooking: "Fresh ingredients, proper technique, balance of flavors",
      Sports: "Practice makes perfect, mental toughness, team coordination",
      Art: "Show don't tell, less is more, authentic expression",
      Physics: "Conservation laws, symmetry, cause and effect"
    };
    
    return principles[domain as keyof typeof principles] || "Core principles of this domain";
  }
}