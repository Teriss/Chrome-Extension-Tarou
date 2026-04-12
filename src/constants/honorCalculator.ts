import { CONTRIBUTION_DATA } from './honor'

interface RupieResult {
  entryBase: number
  flip10k: number
  flip3k: number
  flip1k: number
  totalScore: number
  operations: number
}

interface QuestResult {
  [key: string]: number
  totalScore: number
  operations: number
}

interface HighLevelQuestResult {
  [key: string]: number
  totalScore: number
  operations: number
}

interface FixScoreResult {
  gap: number
  highLevelQuests: HighLevelQuestResult
  rupie: RupieResult
  quests: QuestResult
  totalOperations: number
  isValid: boolean
  suggestion: string
}

// 获取固定分数副本列表，按分数从高到低排序
const getFixedQuests = () => {
  return Object.entries(CONTRIBUTION_DATA.fixedQuests)
    .map(([key, quest]) => ({ key, score: quest.score, name: quest.name }))
    .sort((a, b) => b.score - a.score)
}

// 获取高级副本列表，按分数从高到低排序
const getHighLevelQuests = () => {
  return Object.entries(CONTRIBUTION_DATA.highLevelQuests)
    .map(([key, quest]) => ({ key, score: quest.score, name: quest.name }))
    .sort((a, b) => b.score - a.score)
}

// 计算撒币组合
const calculateRupieCombination = (gap: number): RupieResult | null => {
  const { entryBase, flip10k, flip3k, flip1k } = CONTRIBUTION_DATA.rupieAdjustment
  
  // 撒币至少需要1分（进本基础分）
  if (gap < entryBase) return null
  
  const remainingGap = gap - entryBase
  
  // 计算可能的撒币组合
  let bestResult: RupieResult | null = null
  let minOperations = Infinity
  
  // 尝试不同数量的flip10k
  for (let f10k = 0; f10k * flip10k <= remainingGap; f10k++) {
    const remainingAfter10k = remainingGap - f10k * flip10k
    
    // 尝试不同数量的flip3k
    for (let f3k = 0; f3k * flip3k <= remainingAfter10k; f3k++) {
      const remainingAfter3k = remainingAfter10k - f3k * flip3k
      
      // 计算需要的flip1k数量
      const f1k = remainingAfter3k / flip1k
      
      if (Number.isInteger(f1k) && f1k >= 0) {
        const totalScore = entryBase + f10k * flip10k + f3k * flip3k + f1k * flip1k
        const operations = 1 + f10k + f3k + f1k // 1次进本 + 撒币次数
        
        if (totalScore === gap && operations < minOperations) {
          minOperations = operations
          bestResult = {
            entryBase: 1,
            flip10k,
            flip3k,
            flip1k,
            totalScore,
            operations
          }
        }
      }
    }
  }
  
  return bestResult
}

// 动态规划计算固定分数副本组合（优化版）
const calculateQuestCombination = (gap: number): QuestResult | null => {
  // 限制gap大小，防止内存溢出
  if (gap > 10000000) { // 1000万
    return null
  }
  
  const fixedQuests = getFixedQuests()
  
  // 动态规划表，dp[i]表示达到分数i所需的最少操作次数
  const dp = Array(gap + 1).fill(Infinity)
  dp[0] = 0
  
  // 记录路径
  const path: { [key: number]: { [questKey: string]: number } } = { 0: {} }
  
  // 遍历每个分数
  for (let i = 0; i <= gap; i++) {
    if (dp[i] === Infinity) continue
    
    // 遍历每个副本
    for (const quest of fixedQuests) {
      const nextScore = i + quest.score
      if (nextScore <= gap && dp[nextScore] > dp[i] + 1) {
        dp[nextScore] = dp[i] + 1
        // 复制当前路径并添加新的副本
        path[nextScore] = { ...path[i] }
        path[nextScore][quest.key] = (path[nextScore][quest.key] || 0) + 1
      }
    }
  }
  
  if (dp[gap] === Infinity) return null
  
  const result: QuestResult = { ...path[gap], totalScore: gap, operations: dp[gap] }
  return result
}

// 计算高级副本组合（优化版）
const calculateHighLevelQuests = (gap: number): HighLevelQuestResult => {
  const highLevelQuests = getHighLevelQuests()
  const result: HighLevelQuestResult = { totalScore: 0, operations: 0 }
  let remainingGap = gap
  
  // 优先使用高分高级本
  for (const quest of highLevelQuests) {
    if (remainingGap <= 0) {
      break
    }
    
    const count = Math.floor(remainingGap / quest.score)
    if (count > 0) {
      result[quest.key] = count
      result.totalScore += count * quest.score
      result.operations += count
      remainingGap -= count * quest.score
    }
  }
  
  return result
}

// 主修分函数
export function calculateFixScore(gap: number): FixScoreResult {
  if (gap <= 0) {
    return {
      gap,
      highLevelQuests: { totalScore: 0, operations: 0 },
      rupie: { entryBase: 0, flip10k: 0, flip3k: 0, flip1k: 0, totalScore: 0, operations: 0 },
      quests: { totalScore: 0, operations: 0 },
      totalOperations: 0,
      isValid: false,
      suggestion: ''
    }
  }
  
  // 计算阈值：最低高级本(90级)分数 + 1万贡献
  const threshold = CONTRIBUTION_DATA.highLevelQuests.LV90.score + 10000 // 320000
  
  // 分差过大时，只给出高级本建议
  if (gap > threshold) {
    const highLevelResult = calculateHighLevelQuests(gap)
    const remainingGap = gap - highLevelResult.totalScore
    
    // 生成高级本建议
    let suggestion = '请去打以下副本：\n'
    const highLevelQuests = getHighLevelQuests()
    const questEntries = Object.entries(highLevelResult).filter(([key]) => key !== 'totalScore' && key !== 'operations')
    const questMap = Object.fromEntries(highLevelQuests.map(q => [q.key, q]))
    
    questEntries.forEach(([key, count], index) => {
      const quest = questMap[key]
      if (quest) {
        const score = quest.score * count
        suggestion += `${index + 1}. 打${count}次【${quest.name}】（大约消耗 ${score.toLocaleString()} 缺口）\n`
      }
    })
    
    suggestion += '\n计算预期：\n'
    suggestion += highLevelResult.totalScore.toLocaleString()
    suggestion += `\n打完这 ${highLevelResult.operations} 把之后，你的剩余缺口大约在 ${remainingGap.toLocaleString()} 左右。\n`
    suggestion += '\n下一步行动\n'
    suggestion += `打完上述副本之后，立刻停手！不要再打任何本，也不要撒币。`
    
    return {
      gap,
      highLevelQuests: highLevelResult,
      rupie: { entryBase: 0, flip10k: 0, flip3k: 0, flip1k: 0, totalScore: 0, operations: 0 },
      quests: { totalScore: 0, operations: 0 },
      totalOperations: highLevelResult.operations,
      isValid: false,
      suggestion
    }
  }
  
  // 分差较小时，先用撒币法修个位数和十位数
  let bestResult: FixScoreResult | null = null
  let minOperations = Infinity
  
  // 尝试直接用撒币解决（当所有副本分数都大于gap时）
  const rupieOnlyResult = calculateRupieCombination(gap)
  if (rupieOnlyResult) {
    bestResult = {
      gap,
      highLevelQuests: { totalScore: 0, operations: 0 },
      rupie: rupieOnlyResult,
      quests: { totalScore: 0, operations: 0 },
      totalOperations: rupieOnlyResult.operations,
      isValid: true,
      suggestion: ''
    }
    minOperations = rupieOnlyResult.operations
  }
  
  // 尝试撒币+副本组合
  const maxRupieScore = Math.min(1000, gap)
  
  for (let rupieScore = 0; rupieScore <= maxRupieScore; rupieScore++) {
    // 跳过不可能的撒币分数
    if (rupieScore > 0 && rupieScore < CONTRIBUTION_DATA.rupieAdjustment.entryBase) {
      continue
    }
    
    const questScore = gap - rupieScore
    
    // 计算撒币组合
    const rupieResult = rupieScore > 0 ? calculateRupieCombination(rupieScore) : { 
      entryBase: 0, 
      flip10k: 0, 
      flip3k: 0, 
      flip1k: 0, 
      totalScore: 0, 
      operations: 0 
    }
    
    // 计算副本组合
    const questResult = questScore > 0 ? calculateQuestCombination(questScore) : { 
      totalScore: 0, 
      operations: 0 
    }
    
    if ((rupieScore === 0 || rupieResult) && (questScore === 0 || questResult)) {
      const totalOperations = (rupieResult?.operations || 0) + (questResult?.operations || 0)
      
      if (totalOperations < minOperations) {
        minOperations = totalOperations
        bestResult = {
          gap,
          highLevelQuests: { totalScore: 0, operations: 0 },
          rupie: rupieResult || { entryBase: 0, flip10k: 0, flip3k: 0, flip1k: 0, totalScore: 0, operations: 0 },
          quests: questResult || { totalScore: 0, operations: 0 },
          totalOperations,
          isValid: true,
          suggestion: ''
        }
      }
    }
  }
  
  if (!bestResult) {
    return {
      gap,
      highLevelQuests: { totalScore: 0, operations: 0 },
      rupie: { entryBase: 0, flip10k: 0, flip3k: 0, flip1k: 0, totalScore: 0, operations: 0 },
      quests: { totalScore: 0, operations: 0 },
      totalOperations: 0,
      isValid: false,
      suggestion: '无法计算修分方案，请尝试调整目标分数'
    }
  }
  
  return bestResult
}

// 格式化修分结果
export function formatFixScoreResult(result: FixScoreResult): string {
  let output = `目标缺口：${result.gap.toLocaleString()} 分\n`
  
  // 如果有建议，直接显示建议
  if (result.suggestion) {
    output += `\n${result.suggestion}`
    return output
  }
  
  // 高级副本部分
  if (result.highLevelQuests.totalScore > 0) {
    output += '高级本：'
    const questEntries = Object.entries(result.highLevelQuests).filter(([key]) => key !== 'totalScore' && key !== 'operations')
    const questNames = {
      LV90: '90级',
      LV95: '95级',
      LV100: '100级',
      LV150: '150级',
      LV200: '200级',
      LV250: '250级'
    }
    
    questEntries.forEach(([key, count], index) => {
      if (index > 0) output += '，'
      output += `${questNames[key as keyof typeof questNames]} 打 ${count} 次`
    })
    output += `（共计 ${result.highLevelQuests.totalScore.toLocaleString()} 分）\n`
  }
  
  // 撒币部分
  if (result.rupie.totalScore > 0) {
    output += `撒币本：进本 ${result.rupie.entryBase} 次`
    if (result.rupie.flip10k > 0) output += `，撒 1万 ${result.rupie.flip10k} 次`
    if (result.rupie.flip3k > 0) output += `，撒 3千 ${result.rupie.flip3k} 次`
    if (result.rupie.flip1k > 0) output += `，撒 1千 ${result.rupie.flip1k} 次`
    output += `（共计 ${result.rupie.totalScore.toLocaleString()} 分）\n`
  }
  
  // 副本部分
  if (result.quests.totalScore > 0) {
    output += '战斗本：'
    const questEntries = Object.entries(result.quests).filter(([key]) => key !== 'totalScore' && key !== 'operations')
    const questNames = {
      EX_PLUS: 'EX+',
      EXTREME: '新牛',
      VERY_HARD: '老牛',
      HARD: '大眼',
      NORMAL: '小眼'
    }
    
    questEntries.forEach(([key, count], index) => {
      if (index > 0) output += '，'
      output += `${questNames[key as keyof typeof questNames]} 打 ${count} 次`
    })
    output += `（共计 ${result.quests.totalScore.toLocaleString()} 分）\n`
  }
  
  output += `总操作次数：${result.totalOperations} 次`
  
  return output
}