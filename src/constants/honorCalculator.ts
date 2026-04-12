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

// 计算撒币组合（包含进本按自私黄技的情况）
const calculateRupieCombination = (gap: number): RupieResult | null => {
  const { entryBase, flip10k: score10k, flip3k: score3k, flip1k: score1k } = CONTRIBUTION_DATA.rupieAdjustment
  
  let bestResult: RupieResult | null = null
  let minOperations = Infinity
  
  // 遍历所有可能的进本次数（从 0 次到 gap 次）
  for (let entryCount = 0; entryCount <= gap / entryBase; entryCount++) {
    // 性能剪枝：如果当前纯进本次数已经超过了已知最小操作数，直接放弃后续遍历
    if (entryCount >= minOperations) break
    
    const baseScore = entryCount * entryBase
    const remainingGap = gap - baseScore
    
    // 情况A：完全只靠进本（0次撒币）
    if (remainingGap === 0) {
      if (entryCount < minOperations) {
        minOperations = entryCount
        bestResult = { entryBase: entryCount, flip10k: 0, flip3k: 0, flip1k: 0, totalScore: gap, operations: entryCount }
      }
      continue
    }
    
    // 情况B：需要撒币（前提：必须至少进本1次才能撒币）
    if (entryCount === 0) continue
    
    // 尝试用硬币填补剩余缺口
    for (let f10k = 0; f10k * score10k <= remainingGap; f10k++) {
      if (entryCount + f10k >= minOperations) break // 剪枝
      
      const remainingAfter10k = remainingGap - f10k * score10k
      for (let f3k = 0; f3k * score3k <= remainingAfter10k; f3k++) {
        if (entryCount + f10k + f3k >= minOperations) break // 剪枝
        
        const remainingAfter3k = remainingAfter10k - f3k * score3k
        const f1k = remainingAfter3k / score1k
        
        if (Number.isInteger(f1k) && f1k >= 0) {
          const totalScore = baseScore + f10k * score10k + f3k * score3k + f1k * score1k
          const operations = entryCount + f10k + f3k + f1k // 总进本次数 + 撒币次数
          
          if (totalScore === gap && operations < minOperations) {
            minOperations = operations
            bestResult = {
              entryBase: entryCount,
              flip10k: f10k,
              flip3k: f3k,
              flip1k: f1k,
              totalScore: gap, // 严谨校验：总分必定等于 gap
              operations
            }
          }
        }
      }
    }
  }
  
  return bestResult
}

// 贪心算法计算固定分数副本组合（完全贪心版）
const calculateQuestCombination = (gap: number): QuestResult | null => {
  // 限制gap大小，防止内存溢出
  if (gap > 1000000) { // 100万
    return null
  }
  
  const fixedQuests = getFixedQuests()
  let remainingGap = gap
  const quests: Record<string, number> = {}
  let totalOperations = 0
  
  // 贪心算法：优先使用高分副本
  for (const quest of fixedQuests) {
    if (remainingGap <= 0) break
    
    const count = Math.floor(remainingGap / quest.score)
    if (count > 0) {
      quests[quest.key] = count
      totalOperations += count
      remainingGap -= count * quest.score
    }
  }
  
  // 如果剩余分数为0，说明找到了解决方案
  if (remainingGap === 0) {
    return {
      ...quests,
      totalScore: gap,
      operations: totalOperations
    }
  }
  
  // 贪心算法失败，返回null
  return null
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
  
  // 完全贪心算法实现
  let bestResult: FixScoreResult | null = null
  
  // 先计算贪心副本组合，得到剩余分数
  const fixedQuests = getFixedQuests()
  let remainingGap = gap
  const quests: Record<string, number> = {}
  let totalOperations = 0
  
  for (const quest of fixedQuests) {
    if (remainingGap <= 0) break
    
    const count = Math.floor(remainingGap / quest.score)
    if (count > 0) {
      quests[quest.key] = count
      totalOperations += count
      remainingGap -= count * quest.score
    }
  }
  
  // 尝试用撒币解决剩余分数
  let rupieResult = calculateRupieCombination(remainingGap)
  let finalRemainingGap = remainingGap
  
  if (rupieResult) {
    // 撒币成功，计算总分
    bestResult = {
      gap,
      highLevelQuests: { totalScore: 0, operations: 0 },
      rupie: rupieResult,
      quests: {
        ...quests,
        totalScore: gap - remainingGap,
        operations: totalOperations
      },
      totalOperations: totalOperations + rupieResult.operations,
      isValid: true,
      suggestion: ''
    }
  } else {
    // 撒币失败，尝试用纯混分本（只丢黄技）解决
    finalRemainingGap = remainingGap
    const entryBase = CONTRIBUTION_DATA.rupieAdjustment.entryBase
    const mixCount = finalRemainingGap / entryBase
    
    if (Number.isInteger(mixCount) && mixCount > 0) {
      bestResult = {
        gap,
        highLevelQuests: { totalScore: 0, operations: 0 },
        rupie: { 
          entryBase: mixCount, 
          flip10k: 0, 
          flip3k: 0, 
          flip1k: 0, 
          totalScore: finalRemainingGap, 
          operations: mixCount 
        },
        quests: {
          ...quests,
          totalScore: gap - finalRemainingGap,
          operations: totalOperations
        },
        totalOperations: totalOperations + mixCount,
        isValid: true,
        suggestion: ''
      }
    }
  }
  
  // 尝试直接用撒币解决（当所有副本分数都大于gap时）
  if (!bestResult) {
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
    }
  }
  
  // 尝试直接用纯混分本解决（当撒币也失败时）
  if (!bestResult) {
    const entryBase = CONTRIBUTION_DATA.rupieAdjustment.entryBase
    const mixCount = gap / entryBase
    
    if (Number.isInteger(mixCount) && mixCount > 0) {
      bestResult = {
        gap,
        highLevelQuests: { totalScore: 0, operations: 0 },
        rupie: { 
          entryBase: mixCount, 
          flip10k: 0, 
          flip3k: 0, 
          flip1k: 0, 
          totalScore: gap, 
          operations: mixCount 
        },
        quests: { totalScore: 0, operations: 0 },
        totalOperations: mixCount,
        isValid: true,
        suggestion: ''
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
  // 如果有建议，直接显示建议（通常是分差太大无法穷举时的提示）
  if (result.suggestion) {
    return `目标缺口：${result.gap.toLocaleString()} 分\n\n${result.suggestion}`
  }

  let output = `目标缺口：${result.gap.toLocaleString()} 分\n\n`
  
  // 用于收集各个模块，方便后续按分数从高到低排序
  const sections: { score: number; text: string }[] = []
  
  // 1. 高级副本部分
  if (result.highLevelQuests.totalScore > 0) {
    let text = `高级战斗本（共计 ${result.highLevelQuests.totalScore.toLocaleString()} 分）\n`
    const questNames = {
      LV90: '90级', LV95: '95级', LV100: '100级',
      LV150: '150级', LV200: '200级', LV250: '250级'
    }
    Object.entries(result.highLevelQuests).forEach(([key, count]) => {
      if (key !== 'totalScore' && key !== 'operations' && count > 0) {
        text += `  • ${questNames[key as keyof typeof questNames]}：打 ${count} 次\n`
      }
    })
    sections.push({ score: result.highLevelQuests.totalScore, text })
  }
  
  // 2. 常规战斗本部分
  if (result.quests.totalScore > 0) {
    let text = `常规战斗本（共计 ${result.quests.totalScore.toLocaleString()} 分）\n`
    const questNames = {
      EX_PLUS: 'EX+', EXTREME: '新牛', VERY_HARD: '老牛',
      HARD: '大眼', NORMAL: '小眼'
    }
    Object.entries(result.quests).forEach(([key, count]) => {
      if (key !== 'totalScore' && key !== 'operations' && count > 0) {
        text += `  • ${questNames[key as keyof typeof questNames]}：打 ${count} 次\n`
      }
    })
    sections.push({ score: result.quests.totalScore, text })
  }
  
  // 3. 撒币与纯混分本部分
  if (result.rupie.totalScore > 0) {
    const hasCoins = result.rupie.flip10k > 0 || result.rupie.flip3k > 0 || result.rupie.flip1k > 0
    const pureEntriesCount = hasCoins ? result.rupie.entryBase - 1 : result.rupie.entryBase
    
    // 纯混分本模块
    if (pureEntriesCount > 0) {
      const pureScore = pureEntriesCount * CONTRIBUTION_DATA.rupieAdjustment.entryBase
      let text = `混分（共计 ${pureScore.toLocaleString()} 分）\n`
      text += `  • 进本丢自私黄技 ${pureEntriesCount} 次\n`
      sections.push({ score: pureScore, text })
    }
    
    // 撒币本模块
    if (hasCoins) {
      const rupieScore = 1 * CONTRIBUTION_DATA.rupieAdjustment.entryBase + 
                         result.rupie.flip10k * 61 + 
                         result.rupie.flip3k * 18 + 
                         result.rupie.flip1k * 6
      let text = `撒币本 (90hell)（共计 ${rupieScore.toLocaleString()} 分）\n`
      text += `  • 进本：丢自私黄技 1 次\n`
      
      let coins = []
      if (result.rupie.flip10k > 0) coins.push(`1万 × ${result.rupie.flip10k} 次`)
      if (result.rupie.flip3k > 0) coins.push(`3千 × ${result.rupie.flip3k} 次`)
      if (result.rupie.flip1k > 0) coins.push(`1千 × ${result.rupie.flip1k} 次`)
      
      text += `  • 撒币：${coins.join('，')}\n`
      sections.push({ score: rupieScore, text })
    }
  }
  
  // 根据 score 从高到低对所有模块排序
  sections.sort((a, b) => b.score - a.score)
  
  // 拼接排序后的模块
  sections.forEach(sec => {
    output += sec.text + '\n'
  })
  
  output += `---\n`
  output += `总操作次数：${result.totalOperations} 次\n`
  output += `⚠️ 重要提示：务必先检查是否打了眼球 bjs 以及捐肉再修分`
  
  return output
}