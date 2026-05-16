import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const problems = [
  {
    title: "Two Sum",
    difficulty: "EASY" as const,
    tags: ["array", "hash-map"],
    starterCode: `def two_sum(nums, target):
    # Your code here
    pass

print(two_sum([2,7,11,15], 9))`,
    description: `## Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers that add up to \`target\`.

**Example:**
\`\`\`
Input:  nums = [2,7,11,15], target = 9
Output: [0,1]
\`\`\`

**Constraints:**
- Only one valid answer exists
- You may not use the same element twice

**Expected Output:** \`[0, 1]\``,
  },
  {
    title: "Valid Parentheses",
    difficulty: "EASY" as const,
    tags: ["stack", "string"],
    starterCode: `def is_valid(s):
    # Your code here
    pass

print(is_valid("()[]{}"))`,
    description: `## Valid Parentheses

Given a string \`s\` containing just \`(\`, \`)\`, \`{\`, \`}\`, \`[\`, \`]\`, determine if the input string is valid.

**Rules:**
- Open brackets must be closed by the same type
- Open brackets must be closed in the correct order

**Examples:**
\`\`\`
Input: "()"      → Output: True
Input: "()[]{}"  → Output: True  
Input: "(]"      → Output: False
\`\`\`

**Expected Output:** \`True\``,
  },
  {
    title: "Reverse Linked List",
    difficulty: "MEDIUM" as const,
    tags: ["linked-list", "recursion"],
    starterCode: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverse_list(head):
    # Your code here
    pass`,
    description: `## Reverse Linked List

Given the head of a singly linked list, reverse the list and return the reversed list.

**Example:**
\`\`\`
Input:  1 → 2 → 3 → 4 → 5
Output: 5 → 4 → 3 → 2 → 1
\`\`\`

**Follow-up:** Can you do it iteratively AND recursively?`,
  },
  {
    title: "Maximum Subarray",
    difficulty: "MEDIUM" as const,
    tags: ["array", "dynamic-programming", "divide-and-conquer"],
    starterCode: `def max_subarray(nums):
    # Your code here (Kadane's algorithm?)
    pass

print(max_subarray([-2,1,-3,4,-1,2,1,-5,4]))`,
    description: `## Maximum Subarray

Given an integer array \`nums\`, find the subarray with the largest sum and return its sum.

**Example:**
\`\`\`
Input:  [-2,1,-3,4,-1,2,1,-5,4]
Output: 6
Explanation: [4,-1,2,1] has the largest sum = 6
\`\`\`

**Expected Output:** \`6\``,
  },
  {
    title: "LRU Cache",
    difficulty: "HARD" as const,
    tags: ["design", "hash-map", "linked-list"],
    starterCode: `class LRUCache:
    def __init__(self, capacity: int):
        pass

    def get(self, key: int) -> int:
        pass

    def put(self, key: int, value: int) -> None:
        pass`,
    description: `## LRU Cache

Design a data structure that follows the **Least Recently Used (LRU)** cache constraint.

**Implement:**
- \`LRUCache(capacity)\` — initialize with positive capacity
- \`get(key)\` — return value if key exists, else \`-1\`
- \`put(key, value)\` — insert or update key. Evict LRU key if capacity exceeded.

**Example:**
\`\`\`
cache = LRUCache(2)
cache.put(1, 1)   # cache: {1=1}
cache.put(2, 2)   # cache: {1=1, 2=2}
cache.get(1)      # returns 1
cache.put(3, 3)   # evicts key 2
cache.get(2)      # returns -1 (evicted)
\`\`\`

**Both operations must run in O(1) time.**`,
  },
];

async function main() {
  console.log("Seeding problems...");
  for (const p of problems) {
    await prisma.problem.upsert({
      where: { title: p.title } as any,
      update: {},
      create: p,
    });
  }
  console.log(`✅ Seeded ${problems.length} problems`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());