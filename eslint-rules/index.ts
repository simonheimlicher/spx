/**
 * spx Custom ESLint Rules
 *
 * Custom ESLint rules for proper BDD test behavior and ADR-21 compliance.
 */

import noBddTryCatchAntiPattern from "./no-bdd-try-catch-anti-pattern";
import noHardcodedStatuses from "./no-hardcoded-statuses";
import noHardcodedWorkItemKinds from "./no-hardcoded-work-item-kinds";

const eslintRules = {
  meta: {
    name: "eslint-plugin-spx",
    version: "0.1.0",
    namespace: "spx",
  },
  rules: {
    "no-bdd-try-catch-anti-pattern": noBddTryCatchAntiPattern,
    "no-hardcoded-statuses": noHardcodedStatuses,
    "no-hardcoded-work-item-kinds": noHardcodedWorkItemKinds,
  },
};

export default eslintRules;
