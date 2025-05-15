import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  games: defineTable({
    // Each cell in the outer grid contains its own board
    boards: v.optional(v.array(v.array(v.string()))), // 9 boards, each with 9 cells
    board: v.optional(v.array(v.string())), // For backward compatibility
    playerX: v.optional(v.string()),
    playerO: v.optional(v.string()),
    currentTurn: v.string(),
    // Track which inner board is active (-1 means player can choose any board)
    activeBoard: v.optional(v.number()),
    // Track the winner of each inner board
    innerWinners: v.optional(v.array(v.string())),
    winner: v.optional(v.string()),
    status: v.string(),
  }),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
