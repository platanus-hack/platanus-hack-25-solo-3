// Export all agent definitions
import { AgentDefinition } from "@anthropic-ai/claude-agent-sdk";
import { onboardingAgent } from "./onboarding.js";
import { menuPlannerAgent } from "./menu-planner.js";
import { shoppingListAgent } from "./shopping-list.js";
import { ecommerceAgent } from "./ecommerce.js";

export { routerPrompt } from "./router.js";
export { onboardingAgent } from "./onboarding.js";
export { menuPlannerAgent } from "./menu-planner.js";
export { shoppingListAgent } from "./shopping-list.js";
export { ecommerceAgent } from "./ecommerce.js";

// Export configuration object with all agents
export const PLANEAT_AGENTS: Record<string, AgentDefinition> = {
  onboarding: onboardingAgent,
  "menu-planner": menuPlannerAgent,
  "shopping-list": shoppingListAgent,
  ecommerce: ecommerceAgent,
};
