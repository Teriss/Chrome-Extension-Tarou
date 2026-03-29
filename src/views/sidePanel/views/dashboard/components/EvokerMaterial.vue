<script setup lang="ts">
import { ref } from 'vue'
import { materialInfo, evokerInfo } from '~/logic'
import { evokerUncapData, defaultEvokerInfo } from '~/constants/evoker'

const evokerList = defaultEvokerInfo

const activeEvoker = ref(evokerList[0]?.npcId.toString() || '')

const getMaterialName = (materialId: string) => {
  const material = materialInfo.value.find(m => m.item_id === materialId)
  return material ? material.name : materialId
}

const getMaterialCount = (materialId: string) => {
  const material = materialInfo.value.find(m => m.item_id === materialId)
  return material ? material.number : 0
}

const getEvokerData = (npcId: number) => {
  const evokerIndex = evokerList.findIndex(e => e.npcId === npcId)
  return evokerUncapData[evokerIndex]
}

const getMaterialRequirements = (npcId: number) => {
  const evokerData = getEvokerData(npcId)
  if (!evokerData) return []
  
  const requirements = []
  if (evokerData.weaponUncap) {
    evokerData.weaponUncap.forEach(level => {
      Object.entries(level).forEach(([id, count]) => {
        requirements.push({ id, count })
      })
    })
  }
  if (evokerData.evokerUncap) {
    evokerData.evokerUncap.forEach(level => {
      Object.entries(level).forEach(([id, count]) => {
        requirements.push({ id, count })
      })
    })
  }
  if (evokerData.tarotUncap) {
    evokerData.tarotUncap.forEach(level => {
      Object.entries(level).forEach(([id, count]) => {
        requirements.push({ id, count })
      })
    })
  }
  return requirements
}
</script>

<template>
  <el-card w-300px body-style="padding: 10px">
    <template #header>
      <div text-lg>贤者素材</div>
    </template>
    <el-tabs v-model="activeEvoker" type="card">
      <el-tab-pane
        v-for="evoker in evokerList"
        :key="evoker.npcId"
        :label="evoker.name"
      >
        <div fc flex-col gap-5px>
          <div v-for="(req, index) in getMaterialRequirements(evoker.npcId)" :key="index">
            <div flex justify-between items-center>
              <div flex items-center gap-5px>
                <img
                  :src="`https://prd-game-a1-granbluefantasy.akamaized.net/assets/img/sp/assets${req.id}`"
                  w-20px h-20px
                >
                <span>{{ getMaterialName(req.id) }}</span>
              </div>
              <div>
                {{ getMaterialCount(req.id) }} / {{ req.count }}
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>
