export const comparisons: Record<string, { before: string; after: string; unit: string; beforeSteps: string[]; afterSteps: string[]; outcome: string; note: string }> = {
  "month-end-reporting": {
    before: "20 hours", after: "10 minutes", unit: "Active human preparation",
    beforeSteps: ["Collect", "Copy", "Prepare", "Check", "Repeat", "Compile"], afterSteps: ["Start preparation", "Review output"],
    outcome: "Approximately 99.2% less active human preparation time",
    note: "Background computer processing is separate from human preparation time. This is a case-specific result, not total elapsed processing time.",
  },
  "retail-pricing": {
    before: "A full-time burden", after: "~20 minutes", unit: "Pricing across the business",
    beforeSteps: ["Products", "Margins", "Customers", "Exceptions", "Checks", "Rework"], afterSteps: ["Apply pricing rules", "Validate exceptions"],
    outcome: "Consistent pricing. Greater control. Protected margins.",
    note: "The solution worked inside the existing ERP. The baseline describes an ongoing role; it is not a measured per-run duration.",
  },
  "technology-deployment": {
    before: "A growing backlog", after: "Up to 16 machines", unit: "Prepared simultaneously",
    beforeSteps: ["Ticket", "Prepare", "Configure", "Check", "Repeat", "Wait"], afterSteps: ["Standardize setup", "Prepare in parallel"],
    outcome: "Less technician involvement. More consistent deployment.",
    note: "Built with infrastructure already available to the business. No measured baseline throughput is claimed.",
  },
  "remote-infrastructure-printing": {
    before: "~30 minutes", after: "0 downtime", unit: "From the previous connectivity interruption",
    beforeSteps: ["Connection lost", "Work stops", "Reconnect", "Recover"], afterSteps: ["Resilient configuration", "Continue working"],
    outcome: "Existing technology. A more resilient working environment.",
    note: "The result concerns the previous interruption-related downtime burden, not a universal uptime guarantee.",
  },
};
