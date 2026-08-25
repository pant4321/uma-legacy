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
  id: string;
  type: 1 | 2 | 3 | 4 | 5 | 6;
  kind: string;
  minStars: number;
};

export type NodeFilter = {
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
  tree: NodeFilter;
  main: NodeFilter;
  sort: SortKey;
};

export const APTITUDE_LETTERS = ["", "G", "F", "E", "D", "C", "B", "A", "S"] as const;

export const TREE_SLOTS: SparkSlot[] = ["self", "parent1", "parent2"];
export const MAIN_SLOTS: SparkSlot[] = ["self"];
