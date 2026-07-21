import stylelint from "stylelint";

/**
 * Ban Tailwind-like utility class selectors in framework CSS.
 * Allowed exception: hk-* (framework-owned progressive-enhancement hooks).
 */
export const utilityPattern =
  /^\.(?:flex|grid|block|inline|hidden|absolute|relative|sticky|fixed|container|sr-only|truncate|rounded(?:-(?:sm|md|lg|xl|full))?|p(?:[xytblr])?-\d+|m(?:[xytblr])?-\d+|gap-\d+|space-[xy]-\d+|w-\d+|h-\d+|min-w-|max-w-|text-(?:xs|sm|base|lg|xl|center|left|right)|bg-|text-(?:white|black|gray|red|blue)|border(?:-\d+)?|shadow(?:-(?:sm|md|lg))?|font-(?:bold|medium|semibold)|items-|justify-|overflow-|z-\d+|opacity-\d+|col-span-|row-span-)/;

const { createPlugin, utils } = stylelint;
const ruleName = "hikarion/ban-utility-classes";
const messages = utils.ruleMessages(ruleName, {
  rejected: (selector) => `Unexpected utility-class pattern "${selector}"`,
});

/** @type {import("stylelint").Rule} */
const ruleFunction = (primary) => {
  return (root, result) => {
    const validOptions = utils.validateOptions(result, ruleName, {
      actual: primary,
    });
    if (!validOptions) return;

    root.walkRules((ruleNode) => {
      const selectors = ruleNode.selector.split(",").map((s) => s.trim());
      for (const selector of selectors) {
        const classMatch = selector.match(/\.([\w-]+)/);
        if (!classMatch) continue;
        const className = `.${classMatch[1]}`;
        if (classMatch[1].startsWith("hk-")) continue;
        if (utilityPattern.test(className) || /\/\d+$/.test(classMatch[1])) {
          utils.report({
            result,
            ruleName,
            message: messages.rejected(className),
            node: ruleNode,
            word: className,
          });
        }
      }
    });
  };
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = { url: "https://github.com/pghqdev/HikarionUI/blob/main/CONTRIBUTING.md" };

export default createPlugin(ruleName, ruleFunction);
