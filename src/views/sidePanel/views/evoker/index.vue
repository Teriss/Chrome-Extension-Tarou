<script setup lang="ts">
import { ref, watch } from 'vue'
import { materialInfo, evokerInfo } from '~/logic'
import { evokerUncapData, defaultEvokerInfo } from '~/constants/evoker'

const evokerList = [...defaultEvokerInfo].sort((a, b) => a.no - b.no)
const selectedEvokers = ref<number[]>([])
const showAllMaterials = ref(false)

// 手动设置的贤者进度
const manualProgress = ref<Record<number, { evokerLevel: number, weaponLevel: number, tarotLevel: number, domainLevel: number, isAbility4Release: boolean }>>({})

// 从存储中加载设置
const loadSettings = () => {
  // 加载手动进度
  const savedProgress = localStorage.getItem('evokerManualProgress')
  if (savedProgress) {
    try {
      manualProgress.value = JSON.parse(savedProgress)
    } catch (e) {
      console.error('加载贤者进度失败:', e)
    }
  }
  
  // 加载选中的贤者
  const savedSelected = localStorage.getItem('evokerSelectedEvokers')
  if (savedSelected) {
    try {
      selectedEvokers.value = JSON.parse(savedSelected)
    } catch (e) {
      console.error('加载选中贤者失败:', e)
    }
  }
}

// 保存设置到存储
const saveSettings = () => {
  localStorage.setItem('evokerManualProgress', JSON.stringify(manualProgress.value))
  localStorage.setItem('evokerSelectedEvokers', JSON.stringify(selectedEvokers.value))
}

// 初始化手动进度
evokerList.forEach(evoker => {
  if (!manualProgress.value[evoker.npcId]) {
    manualProgress.value[evoker.npcId] = {
      evokerLevel: 0,
      weaponLevel: 0,
      tarotLevel: 0,
      domainLevel: 0,
      isAbility4Release: false
    }
  }
})

// 监听变化并保存
watch([manualProgress, selectedEvokers], saveSettings, { deep: true })

// 初始化时加载
loadSettings()

const getMaterialName = (materialId: string) => {
  const material = materialInfo.value.find(m => m.item_id === materialId)
  return material ? material.name : materialId
}

const getMaterialCount = (materialId: string) => {
  const material = materialInfo.value.find(m => m.item_id === materialId)
  return material ? material.number : 0
}

const getEvokerData = (npcId: number) => {
  const evoker = evokerList.find(e => e.npcId === npcId)
  if (!evoker) return null
  return evokerUncapData[evoker.no]
}

const getMaterialRequirements = (npcId: number) => {
  const evokerData = getEvokerData(npcId)
  if (!evokerData) return []
  
  const progress = getCurrentEvokerProgress(npcId)
  const requirements = []
  
  // 计算武器升级所需素材（当前等级到最高等级）
  if (evokerData.weaponUncap) {
    // 武器：未入手(0)、武器0星(1)、武器1星(2)、武器2星(3)、武器3星(4)、武器4星(5)、武器5星(6)
    // 数组索引：0=0星, 1=1星, 2=2星, 3=3星, 4=4星, 5=5星
    // 未入手(0) → 计算所有材料（从0开始）
    // 0星(1) → 计算数组[0]以外的所有材料（从1开始）
    // 1星(2) → 计算数组[0]和数组[1]之外的所有材料（从2开始）
    const startIndex = progress.weaponLevel
    for (let i = startIndex; i< evokerData.weaponUncap.length; i++) {
      Object.entries(evokerData.weaponUncap[i]).forEach(([id, count]) =>{
        requirements.push({ id, count })
      })
    }
  }
  
  // 计算贤者升级所需素材（当前等级到最高等级）
  if (evokerData.evokerUncap) {
    // 贤者：未入手(0)、贤者0星(1)、贤者1星(2)、贤者2星(3)、贤者3星(4)、贤者4星(5)、贤者5星(6)
    // 数组索引：0=0星, 1=1星, 2=2星, 3=3星, 4=4星, 5=5星
    // 未入手(0) → 计算所有材料（从0开始）
    // 0星(1) → 计算数组[0]以外的所有材料（从1开始）
    // 1星(2) → 计算数组[0]和数组[1]之外的所有材料（从2开始）
    const startIndex = progress.evokerLevel
    for (let i = startIndex; i< evokerData.evokerUncap.length; i++) {
      Object.entries(evokerData.evokerUncap[i]).forEach(([id, count]) =>{
        requirements.push({ id, count })
      })
    }
  }
  
  // 计算塔罗升级所需素材（当前等级到最高等级）
  if (evokerData.tarotUncap) {
    // 塔罗等级：0=未入手, 2=0凸, 3=1凸, 4=2凸, 5=3凸, 6=SSR化, 7=4凸, 8=5凸
    // 数组索引：0=0凸, 1=1凸, 2=2凸, 3=3凸, 4=SSR化, 5=4凸, 6=5凸
    // 未入手(0) → 计算所有材料（从0开始）
    // 0凸(2) → 计算数组[0]以外的所有材料（从1开始）
    // 1凸(3) → 计算数组[0]和数组[1]之外的所有材料（从2开始）
    let startIndex = 0
    if (progress.tarotLevel >= 2) {
      startIndex = progress.tarotLevel - 1
    }
    for (let i = startIndex; i< evokerData.tarotUncap.length; i++) {
      Object.entries(evokerData.tarotUncap[i]).forEach(([id, count]) =>{
        requirements.push({ id, count })
      })
    }
  }
  
  // 计算领域升级所需素材（当前等级到最高等级）
  if (evokerData.domainUncap) {
    // 领域：未入手(0)、解放一层(1)、解放二层(2)、解放三层(3)、解放四层(4)
    // 数组索引：0=解放一层, 1=解放二层, 2=解放三层, 3=解放四层
    // 未入手(0) → 计算所有材料（从0开始）
    // 解放一层(1) → 计算数组[0]以外的所有材料（从1开始）
    const startIndex = progress.domainLevel
    for (let i = startIndex; i< evokerData.domainUncap.length; i++) {
      Object.entries(evokerData.domainUncap[i]).forEach(([id, count]) =>{
        requirements.push({ id, count })
      })
    }
  }
  
  // 计算4技能解锁所需素材
  if (evokerData.ability4Release && !progress.isAbility4Release) {
    Object.entries(evokerData.ability4Release).forEach(([id, count]) =>{
      requirements.push({ id, count })
    })
  }
  
  return requirements
}

const calculateTotalMaterials = () => {
  const total: Record<string, number> = {}
  
  selectedEvokers.value.forEach(npcId => {
    const requirements = getMaterialRequirements(npcId)
    requirements.forEach(req => {
      if (total[req.id]) {
        total[req.id] += req.count
      } else {
        total[req.id] = req.count
      }
    })
  })
  
  return Object.entries(total).map(([id, count]) => ({
    id,
    count,
    current: getMaterialCount(id),
    name: getMaterialName(id)
  })).filter(material =>showAllMaterials.value || material.current< material.count) // 根据设置决定是否显示所有材料
}

const getCurrentEvokerProgress = (npcId: number) => {
  // 优先使用手动设置的进度
  if (manualProgress.value[npcId]) {
    return manualProgress.value[npcId]
  }
  
  const evoker = evokerInfo.value.find(e => e.npcId === npcId)
  if (!evoker) return {
    evokerLevel: 0,
    weaponLevel: 0,
    tarotLevel: 0,
    domainLevel: 0,
    isAbility4Release: false
  }
  
  return {
    evokerLevel: evoker.evokerLevel,
    weaponLevel: evoker.weaponLevel,
    tarotLevel: evoker.tarotLevel,
    domainLevel: evoker.domainLevel || 0,
    isAbility4Release: evoker.isAbility4Release || false
  }
}
</script>

<template>
<div class="evoker-page">
<div class="page-header">
<h2>贤者素材计算</h2>
<el-button size="small" @click="showAllMaterials = !showAllMaterials" type="primary" plain>
{{ showAllMaterials ? '只显示缺少的材料' : '显示所有材料' }}
</el-button>
</div>

<!-- 材料显示区域 -->
<div class="material-section" v-if="selectedEvokers.length >0">
<h3>所需素材总计</h3>
<div class="material-grid" v-if="calculateTotalMaterials().length > 0">
<div class="material-card" v-for="(material, index) in calculateTotalMaterials()" :key="index">
<img :src="`https://prd-game-a-granbluefantasy.akamaized.net/assets/img/sp/assets/item/article/s/${material.id}.jpg`" class="material-icon" />
<div class="material-count">{{ material.current }} / {{ material.count }}</div>
</div>
</div>
<div class="congratulations" v-else>
🎉 恭喜！所有材料都已满足！
</div>
</div>

<!-- 贤者列表 -->
<div class="evoker-list">
<el-card v-for="evoker in evokerList" :key="evoker.npcId" class="evoker-card">
<template #header>
<div class="card-header">
<el-checkbox v-model="selectedEvokers" :label="evoker.npcId" class="select-checkbox">
<span class="evoker-name">{{ evoker.name }}</span>
</el-checkbox>
</div>
</template>
<div class="evoker-content">
<div class="progress-settings">
<div class="progress-item">
<label>贤者:</label>
<el-select v-model="manualProgress[evoker.npcId].evokerLevel" size="small">
<el-option label="未入手" :value="0" />
<el-option label="贤者0星" :value="1" />
<el-option label="贤者1星" :value="2" />
<el-option label="贤者2星" :value="3" />
<el-option label="贤者3星" :value="4" />
<el-option label="贤者4星" :value="5" />
<el-option label="贤者5星" :value="6" />
</el-select>
</div>
<div class="progress-item">
<label>武器:</label>
<el-select v-model="manualProgress[evoker.npcId].weaponLevel" size="small">
<el-option label="未入手" :value="0" />
<el-option label="武器0星" :value="1" />
<el-option label="武器1星" :value="2" />
<el-option label="武器2星" :value="3" />
<el-option label="武器3星" :value="4" />
<el-option label="武器4星" :value="5" />
<el-option label="武器5星" :value="6" />
</el-select>
</div>
<div class="progress-item">
<label>塔罗:</label>
<el-select v-model="manualProgress[evoker.npcId].tarotLevel" size="small">
<el-option label="未入手" value="0" />
<el-option label="塔罗牌0凸" value="2" />
<el-option label="塔罗牌1凸" value="3" />
<el-option label="塔罗牌2凸" value="4" />
<el-option label="塔罗牌3凸" value="5" />
<el-option label="塔罗牌SSR化" value="6" />
<el-option label="塔罗牌4凸" value="7" />
<el-option label="塔罗牌5凸" value="8" />
</el-select>
</div>
<div class="progress-item">
<label>领域:</label>
<el-select v-model="manualProgress[evoker.npcId].domainLevel" size="small">
<el-option label="未入手" :value="0" />
<el-option label="解放一层" :value="1" />
<el-option label="解放二层" :value="2" />
<el-option label="解放三层" :value="3" />
<el-option label="解放四层" :value="4" />
</el-select>
</div>
<div class="progress-item">
<label>四技能:</label>
<el-select v-model="manualProgress[evoker.npcId].isAbility4Release" size="small">
<el-option label="未解锁" :value="false" />
<el-option label="已解锁" :value="true" />
</el-select>
</div>
</div>
</div>
</el-card>
</div>
<div class="no-selection" v-if="selectedEvokers.length === 0">请选择要计算的贤者</div>
</div>
</template>

<style scoped>
.evoker-page {
  padding: 20px;
  color: white;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

h2 {
  font-size: 20px;
  margin: 0;
  font-weight: 600;
}

h3 {
  font-size: 16px;
  margin-bottom: 15px;
  font-weight: 500;
}

.evoker-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}

.evoker-card {
  border-radius: 8px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.select-checkbox {
  margin-right: 5px;
}

.evoker-name {
  font-size: 16px;
  font-weight: 500;
}

.evoker-content {
  padding: 10px 0;
}

.evoker-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 14px;
}

.progress-label {
  color: #999;
}

.progress-value {
  color: #fff;
}

.progress-settings {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.progress-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-item label {
  font-size: 12px;
  color: #ccc;
  white-space: nowrap;
}

.material-section {
  margin-bottom: 20px;
}

.material-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}

.material-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 10px;
  background-color: #2d2d2d;
  border-radius: 8px;
}

.material-icon {
  width: 40px;
  height: 40px;
  border-radius: 4px;
}

.material-count {
  font-size: 14px;
  font-weight: 500;
  color: #999;
}

.congratulations {
  text-align: center;
  padding: 20px;
  font-size: 16px;
  font-weight: 600;
  color: #67c23a;
}

.no-selection {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 14px;
}

.el-select {
  width: 100px;
}

.el-option {
  font-size: 12px;
}</style>
