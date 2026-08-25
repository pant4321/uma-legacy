export type SparkType = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type SparkSlot =
  | "self"
  | "parent1"
  | "parent2"
  | "gp11"
  | "gp12"
  | "gp21"
  | "gp22";

export type NodeKey = "tree" | "main";

export type SparkFocus = "all" | "main" | "gp1" | "gp2";

export type JoinMode = "and" | "or";

export type Spark = {
  factorId: number;
  name: string;
  type: SparkType;
  stars: number;
  slot: SparkSlot;
};

export type Skill = {
  id: number;
  name: string;
  level: number;
};

export type Aptitudes = {
  short: number;
  mile: number;
  middle: number;
  long: number;
  turf: number;
  dirt: number;
  nige: number;
  senko: number;
  sashi: number;
  oikomi: number;
};

export type AptitudeKey = keyof Aptitudes;

export type FamilyMember = {
  slot: SparkSlot;
  cardId: number;
  charaId: number;
  name: string;
  title: string;
  talentLevel: number;
  sparks: Spark[];
};

export type Veteran = {
  id: number;
  cardId: number;
  charaId: number;
  name: string;
  title: string;
  talentLevel: number;
  rarity: number;
  rank: number;
  rankScore: number;
  speed: number;
  stamina: number;
  power: number;
  guts: number;
  wit: number;
  aptitudes: Aptitudes;
  skills: Skill[];
  sparks: Spark[];
  family: FamilyMember[];
  winSaddleCount: number;
  createdAt: number;
  createdText: string;
  whiteCount: number;
  whiteParentCount: number;
};

export type SparkRule = {
  id: string;
  type: 1 | 2 | 3 | 4 | 5 | 6;
  kind: string;
  minStars: number;
};

export type SparkGroup = {
  id: string;
  join: JoinMode;
  sparks: SparkRule[];
};

export type NodeFilter = {
  join: JoinMode;
  groups: SparkGroup[];
};

export type SortKey =
  | "rankScore"
  | "newest"
  | "oldest"
  | "whiteCount"
  | "whiteParentCount"
  | "g1"
  | "speed"
  | "stamina"
  | "power"
  | "guts"
  | "wit";

export type FilterState = {
  query: string;
  tree: NodeFilter;
  main: NodeFilter;
  sort: SortKey;
};

export type FilterPreset = {
  id: string;
  name: string;
  savedAt: number;
  filter: FilterState;
};

export const APTITUDE_LETTERS = ["", "G", "F", "E", "D", "C", "B", "A", "S"] as const;

export const TREE_SLOTS: SparkSlot[] = ["self", "parent1", "parent2"];
export const MAIN_SLOTS: SparkSlot[] = ["self"];
export const GP1_SLOTS: SparkSlot[] = ["parent1"];
export const GP2_SLOTS: SparkSlot[] = ["parent2"];

export const FOCUS_SLOTS: Record<SparkFocus, SparkSlot[]> = {
  all: TREE_SLOTS,
  main: MAIN_SLOTS,
  gp1: GP1_SLOTS,
  gp2: GP2_SLOTS,
};

export const FOCUS_LABELS: { id: SparkFocus; label: string; title: string }[] = [
  { id: "all", label: "All", title: "Combined sparks from the parent and both grandparents" },
  { id: "main", label: "Main", title: "Main parent sparks only" },
  { id: "gp1", label: "GP 1", title: "Grandparent 1 sparks" },
  { id: "gp2", label: "GP 2", title: "Grandparent 2 sparks" },
];

export const SORT_KEYS: SortKey[] = [
  "whiteCount",
  "whiteParentCount",
  "rankScore",
  "newest",
  "oldest",
  "g1",
  "speed",
  "stamina",
  "power",
  "guts",
  "wit",
];
