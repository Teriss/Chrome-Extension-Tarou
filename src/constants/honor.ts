
/**
 * 贡献度数据定义
 */
interface QuestScore {
  name: string;
  score: number;
  type: 'fixed' | 'variable'; // fixed: 固定分数, variable: 浮动/大约分数
}

interface RupieConfig {
  entryBase: number;      // 进本固定 1 分
  flip10k: number;        // 撒 10000 卢比收益
  flip3k: number;         // 撒 3000 卢比收益
  flip1k: number;         // 撒 1000 卢比收益
}
interface GameData {
  fixedQuests: Record<string, QuestScore>;
  highLevelQuests: Record<string, QuestScore>;
  rupieAdjustment: RupieConfig;
}

export const CONTRIBUTION_DATA: GameData = {
  // 低级/常规副本（分数完全固定，填分主力）
  fixedQuests: {
    EX_PLUS: { name: "EX+ (Extreme+)", score: 127600, type: 'fixed' },
    EXTREME: { name: "新牛 (EXTREME)", score: 64800, type: 'fixed' },
    VERY_HARD: { name: "老牛 (VERY HARD)", score: 21400, type: 'fixed' },
    HARD: { name: "大眼 (HARD)", score: 8000, type: 'fixed' },
    NORMAL: { name: "小眼 (NORMAL)", score: 4000, type: 'fixed' }
  },

  // 高级副本（Hell 本，分数值存在小幅波动，通常作为前置压血线使用）
  highLevelQuests: {
    LV90: { name: "90级高级本", score: 310000, type: 'variable' },
    LV95: { name: "95级高级本", score: 910000, type: 'variable' },
    LV100: { name: "100级高级本", score: 2680000, type: 'variable' },
    LV150: { name: "150级高级本", score: 4100000, type: 'variable' },
    LV200: { name: "200级高级本", score: 20270000, type: 'variable' },
    LV250: { name: "250级高级本", score: 75400000, type: 'variable' }
  },

  // 撒币微调（尾数修正专用）
  rupieAdjustment: {
    entryBase: 1,      // 每次【进入】副本动作产生的固定分
    flip10k: 61,       // 【10000卢比】
    flip3k: 18,         // 【3000卢比】
    flip1k: 6,         // 【1000卢比】
  }
};