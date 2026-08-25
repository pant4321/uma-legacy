export type SparkType = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type SparkSlot =
  | "self"
  | "parent1"
  | "parent2"
  | "gp11"
  | "gp12"
  | "gp21"
  | "gp22";

export type SparkFocus = "all" | "main" | "gp1" | "gp2";

export type NodeKey = "tree" | "main" | "gp1" | "gp2";

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
};

export type SparkRule = {
  type: 1 | 2 | 3 | 4;
  kind: string;
  minStars: number;
};

export type NodeFilter = {
  charaId: number | null;
  sparks: SparkRule[];
};

export type SortKey =
  | "rankScore"
  | "newest"
  | "oldest"
  | "whiteCount"
  | "g1"
  | "speed"
  | "stamina"
  | "power"
  | "guts"
  | "wit";

export type FilterState = {
  query: string;
  focus: SparkFocus;
  tree: NodeFilter;
  main: NodeFilter;
  gp1: NodeFilter;
  gp2: NodeFilter;
  minRankScore: number | null;
  minStats: {
    speed: number | null;
    stamina: number | null;
    power: number | null;
    guts: number | null;
    wit: number | null;
  };
  minAptitudes: Partial<Record<AptitudeKey, number>>;
  sort: SortKey;
};

export const APTITUDE_LETTERS = ["", "G", "F", "E", "D", "C", "B", "A", "S"] as const;

export const FOCUS_SLOTS: Record<SparkFocus, SparkSlot[]> = {
  all: ["self", "parent1", "parent2"],
  main: ["self"],
  gp1: ["parent1"],
  gp2: ["parent2"],
};

export const FOCUS_LABELS: { id: SparkFocus; label: string; title: string }[] = [
  { id: "all", label: "All", title: "Sparks from the parent and both grandparents" },
  { id: "main", label: "Main", title: "Main parent sparks only" },
  { id: "gp1", label: "GP 1", title: "Grandparent 1 (left parent) sparks" },
  { id: "gp2", label: "GP 2", title: "Grandparent 2 (right parent) sparks" },
];
