<script setup lang="ts">
import type { NormalAttackInfo } from 'battle'
import { computed } from 'vue'
import { battleInfo, battleRecord } from '~/logic'
import { getAssetImg } from '~/composables/useImage'

const props = defineProps<{ normalAttackInfo: NormalAttackInfo }>()

const currentRecord = computed(() => battleRecord.value.find(record => String(record.raid_id) === battleInfo.value.bossInfo?.battleId))
const playerInfo = computed(() => currentRecord.value?.player ?? [])

const playerDamageSummary = computed(() => {
  if (!props.normalAttackInfo.playerDamage || props.normalAttackInfo.playerDamage.length === 0) return []
  
  return props.normalAttackInfo.playerDamage.map(item => {
    const player = playerInfo.value[item.playerIndex]
    return {
      player,
      damage: item.damage,
      percentage: item.percentage
    }
  }).filter(item => item.player && item.damage > 0)
})

const playerAbilityDamageSummary = computed(() => {
  if (!props.normalAttackInfo.playerAbilityDamage || props.normalAttackInfo.playerAbilityDamage.length === 0) return []
  
  return props.normalAttackInfo.playerAbilityDamage.map(item => {
    const player = playerInfo.value[item.playerIndex]
    return {
      player,
      damage: item.damage,
      percentage: item.percentage
    }
  }).filter(item => item.player && item.damage > 0)
})

const playerSpecialDamageSummary = computed(() => {
  if (!props.normalAttackInfo.playerSpecialDamage || props.normalAttackInfo.playerSpecialDamage.length === 0) return []
  
  return props.normalAttackInfo.playerSpecialDamage.map(item => {
    const player = playerInfo.value[item.playerIndex]
    return {
      player,
      damage: item.damage,
      percentage: item.percentage
    }
  }).filter(item => item.player && item.damage > 0)
})

const playerAttackDamageSummary = computed(() => {
  if (!props.normalAttackInfo.playerAttackDamage || props.normalAttackInfo.playerAttackDamage.length === 0) return []
  
  return props.normalAttackInfo.playerAttackDamage.map(item => {
    const player = playerInfo.value[item.playerIndex]
    return {
      player,
      damage: item.damage,
      percentage: item.percentage
    }
  }).filter(item => item.player && item.damage > 0)
})

const totalPlayerDamage = computed(() => {
  return playerDamageSummary.value.reduce((sum, player) => sum + player.damage, 0)
})

const totalPlayerAbilityDamage = computed(() => {
  return playerAbilityDamageSummary.value.reduce((sum, player) => sum + player.damage, 0)
})

const totalPlayerSpecialDamage = computed(() => {
  return playerSpecialDamageSummary.value.reduce((sum, player) => sum + player.damage, 0)
})

const totalPlayerAttackDamage = computed(() => {
  return playerAttackDamageSummary.value.reduce((sum, player) => sum + player.damage, 0)
})
</script>

<template>
  <div m-2 fc flex-wrap gap-2>
    <el-tag type="primary" effect="dark" size="small">
      {{ `hit: ${normalAttackInfo.hit}` }}
    </el-tag>
    <el-popover placement="top" width="250" trigger="hover">
      <template #reference>
        <el-tag type="info" effect="dark" size="small">
          {{ `平A伤害: ${normalAttackInfo.attack.toLocaleString()}` }}
        </el-tag>
      </template>
      <div v-if="playerAttackDamageSummary.length > 0" class="text-12px">
        <div class="mb-2 text-center font-bold">角色平A伤害分布</div>
        <div v-for="(item, index) in playerAttackDamageSummary" :key="index" class="flex items-center justify-between mb-1">
          <div class="fc items-center gap-5px">
            <div relative w-20px>
              <div v-if="item.player.is_dead" class="absolute h-full w-full fc bg-black/40">
                <span text-8px text-red font-bold>Dead</span>
              </div>
              <img w-full :src="getAssetImg(item.player.is_npc ? 'npc' : 'leader', item.player.image_id, 's')">
            </div>
          </div>
          <span>{{ item.damage.toLocaleString() }} ({{ item.percentage }}%)</span>
        </div>
        <div class="mt-2 pt-2 border-t border-gray-400 flex justify-between font-bold">
          <span>角色总平A伤害:</span>
          <span>{{ totalPlayerAttackDamage.toLocaleString() }}</span>
        </div>
      </div>
      <div v-else class="text-12px">
        暂无角色平A伤害数据
      </div>
    </el-popover>
    <el-popover placement="top" width="250" trigger="hover">
      <template #reference>
        <el-tag type="warning" effect="dark" size="small">
          {{ `奥伤(${normalAttackInfo.chain}c): ${normalAttackInfo.special.toLocaleString()}` }}
        </el-tag>
      </template>
      <div v-if="playerSpecialDamageSummary.length > 0" class="text-12px">
        <div class="mb-2 text-center font-bold">角色奥伤分布</div>
        <div v-for="(item, index) in playerSpecialDamageSummary" :key="index" class="flex items-center justify-between mb-1">
          <div class="fc items-center gap-5px">
            <div relative w-20px>
              <div v-if="item.player.is_dead" class="absolute h-full w-full fc bg-black/40">
                <span text-8px text-red font-bold>Dead</span>
              </div>
              <img w-full :src="getAssetImg(item.player.is_npc ? 'npc' : 'leader', item.player.image_id, 's')">
            </div>
          </div>
          <span>{{ item.damage.toLocaleString() }} ({{ item.percentage }}%)</span>
        </div>
        <div class="mt-2 pt-2 border-t border-gray-400 flex justify-between font-bold">
          <span>角色总奥伤:</span>
          <span>{{ totalPlayerSpecialDamage.toLocaleString() }}</span>
        </div>
      </div>
      <div v-else class="text-12px">
        暂无角色奥伤数据
      </div>
    </el-popover>
    <el-popover placement="top" width="250" trigger="hover">
      <template #reference>
        <el-tag type="success" effect="dark" size="small">
          {{ `技伤: ${normalAttackInfo.ability.toLocaleString()}` }}
        </el-tag>
      </template>
      <div v-if="playerAbilityDamageSummary.length > 0" class="text-12px">
        <div class="mb-2 text-center font-bold">角色技伤分布</div>
        <div v-for="(item, index) in playerAbilityDamageSummary" :key="index" class="flex items-center justify-between mb-1">
          <div class="fc items-center gap-5px">
            <div relative w-20px>
              <div v-if="item.player.is_dead" class="absolute h-full w-full fc bg-black/40">
                <span text-8px text-red font-bold>Dead</span>
              </div>
              <img w-full :src="getAssetImg(item.player.is_npc ? 'npc' : 'leader', item.player.image_id, 's')">
            </div>
          </div>
          <span>{{ item.damage.toLocaleString() }} ({{ item.percentage }}%)</span>
        </div>
        <div class="mt-2 pt-2 border-t border-gray-400 flex justify-between font-bold">
          <span>角色总技伤:</span>
          <span>{{ totalPlayerAbilityDamage.toLocaleString() }}</span>
        </div>
      </div>
      <div v-else class="text-12px">
        暂无角色技伤数据
      </div>
    </el-popover>
    <el-popover placement="top" width="250" trigger="hover">
      <template #reference>
        <el-tag type="danger" effect="dark" size="small">
          {{ `总伤害: ${normalAttackInfo.total.toLocaleString()}` }}
        </el-tag>
      </template>
      <div v-if="playerDamageSummary.length > 0" class="text-12px">
        <div class="mb-2 text-center font-bold">角色伤害分布</div>
        <div v-for="(item, index) in playerDamageSummary" :key="index" class="flex items-center justify-between mb-1">
          <div class="fc items-center gap-5px">
            <div relative w-20px>
              <div v-if="item.player.is_dead" class="absolute h-full w-full fc bg-black/40">
                <span text-8px text-red font-bold>Dead</span>
              </div>
              <img w-full :src="getAssetImg(item.player.is_npc ? 'npc' : 'leader', item.player.image_id, 's')">
            </div>
          </div>
          <span>{{ item.damage.toLocaleString() }} ({{ item.percentage }}%)</span>
        </div>
        <div class="mt-2 pt-2 border-t border-gray-400 flex justify-between font-bold">
          <span>角色总伤害:</span>
          <span>{{ totalPlayerDamage.toLocaleString() }}</span>
        </div>
      </div>
      <div v-else class="text-12px">
        暂无角色伤害数据
      </div>
    </el-popover>
  </div>
</template>
