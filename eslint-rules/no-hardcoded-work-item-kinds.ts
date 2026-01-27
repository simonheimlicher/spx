/**
 * ESLint Rule: No Hardcoded Work Item Kinds
 *
 * Detects hardcoded work item kind strings ("capability", "feature", "story")
 * in test assertions and suggests using WORK_ITEM_KINDS constant instead.
 *
 * Per ADR-21: Never hardcode kind names - derive from WORK_ITEM_KINDS constant.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Rule } from "eslint";

const WORK_ITEM_KINDS = ["capability", "feature", "story"];

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce using WORK_ITEM_KINDS constant instead of hardcoded kind strings",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      useWorkItemKinds: "Use WORK_ITEM_KINDS constant instead of hardcoded '{{value}}'. Import from src/types.ts",
    },
  },
  create(context: Rule.RuleContext) {
    /**
     * Check if we're in a test file
     */
    function isTestFile(): boolean {
      const filename = context.getFilename?.() || context.filename;
      return (
        filename.includes(".test.")
        || filename.includes(".spec.")
        || filename.includes("/tests/")
        || filename.includes("/__tests__/")
        || filename.startsWith("tests/")
        || filename.startsWith("__tests__/")
      );
    }

    /**
     * Check if node is inside a test description (describe/it/test first argument)
     */
    function isInTestDescription(node: any): boolean {
      let parent = node.parent;
      while (parent) {
        if (
          parent.type === "CallExpression"
          && parent.callee?.type === "Identifier"
          && ["describe", "it", "test"].includes(parent.callee.name)
          && parent.arguments?.[0] === node
        ) {
          return true;
        }
        // Check for template literal in test description
        if (
          parent.type === "TemplateLiteral"
          && parent.parent?.type === "CallExpression"
          && parent.parent.callee?.type === "Identifier"
          && ["describe", "it", "test"].includes(parent.parent.callee.name)
          && parent.parent.arguments?.[0] === parent
        ) {
          return true;
        }
        parent = parent.parent;
      }
      return false;
    }

    /**
     * Check if node is inside a type definition
     */
    function isInTypeDefinition(node: any): boolean {
      let parent = node.parent;
      while (parent) {
        if (
          parent.type === "TSTypeAliasDeclaration"
          || parent.type === "TSInterfaceDeclaration"
          || parent.type === "TSLiteralType"
          || parent.type === "TSUnionType"
        ) {
          return true;
        }
        parent = parent.parent;
      }
      return false;
    }

    /**
     * Check if node is an object key (not value)
     */
    function isObjectKey(node: any): boolean {
      const parent = node.parent;
      return parent?.type === "Property" && parent.key === node;
    }

    if (!isTestFile()) {
      return {}; // Don't apply rule to non-test files
    }

    return {
      Literal(node: any) {
        // Only check string literals
        if (typeof node.value !== "string") return;

        // Check if it's a work item kind
        if (!WORK_ITEM_KINDS.includes(node.value)) return;

        // Whitelist: test descriptions
        if (isInTestDescription(node)) return;

        // Whitelist: type definitions
        if (isInTypeDefinition(node)) return;

        // Whitelist: object keys
        if (isObjectKey(node)) return;

        // Report violation
        context.report({
          node,
          messageId: "useWorkItemKinds",
          data: { value: node.value },
        });
      },
    };
  },
};

export default rule;
