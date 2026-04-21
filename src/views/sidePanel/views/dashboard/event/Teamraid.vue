<script setup lang="ts">
import type { EventInfo, TeamraidAdditional } from 'extension'
import { Icon } from '@iconify/vue'
import { getEventGachaBoxNum } from '~/constants/event'
import { calculateFixScore, formatFixScoreResult } from '~/constants/honorCalculator'
import { eventList } from '~/logic'

type TeamraidInfo = EventInfo & { additional: TeamraidAdditional }
const eventInfo = computed(() => eventList.value.find(event => event.type === 'teamraid') as TeamraidInfo)
const token = computed(() => eventInfo.value.additional.hasSpReward ? eventInfo.value.additional.gachaPoint : eventInfo.value.additional.gachaPoint + eventInfo.value.additional.honor / 1000000 * 60)
const showFixScore = ref(false)
const isCalculating = ref(false)
const fixScoreResult = ref<any>(null)

const gap = computed(() => {
  if (!eventInfo.value?.additional?.targetHonor) return 0
  return Math.max(0, eventInfo.value.additional.targetHonor - eventInfo.value.additional.honor)
})

// 防抖计算修分方案
let debounceTimer: number | null = null
function calculateFixScoreWithDebounce() {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  
  debounceTimer = window.setTimeout(() => {
    if (gap.value > 0) {
      isCalculating.value = true
      // 使用setTimeout避免阻塞UI
      setTimeout(() => {
        try {
          fixScoreResult.value = calculateFixScore(gap.value)
        } catch (error) {
          console.error('修分计算错误:', error)
          fixScoreResult.value = null
        } finally {
          isCalculating.value = false
        }
      }, 0)
    } else {
      fixScoreResult.value = null
    }
  }, 300)
}

// 监听gap变化，自动计算
watch(gap, () => {
  if (showFixScore.value) {
    calculateFixScoreWithDebounce()
  }
})

// 监听showFixScore变化
watch(showFixScore, (newValue) => {
  if (newValue) {
    calculateFixScoreWithDebounce()
  } else {
    fixScoreResult.value = null
  }
})

function onSetTarget() {
  ElMessageBox.prompt('请输入目标贡献值', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    inputPattern: /^\d+$/,
    inputErrorMessage: '请输入正确的数字',
    inputPlaceholder: eventInfo.value.additional.targetHonor ? `当前目标: ${eventInfo.value.additional.targetHonor.toLocaleString()}` : '',
  })
    .then(({ value }) => {
      eventInfo.value.additional.targetHonor = Number(value)
    })
    .catch(() => { })
}
</script>

<template>
  <el-card v-if="eventInfo && eventInfo.isActive && eventInfo.additional" h-full w-300px>
    <template #header>
      <div flex justify-between>
        <div>
          古战场({{ getEventGachaBoxNum({ eventType: eventInfo.type, currentToken: token, drawnBox: eventInfo.additional.drawnBox }) }}箱)
        </div>
        <el-tooltip content="最后更新时间" placement="top">
          {{ formatEventDate(eventInfo.updateTime) }}
        </el-tooltip>
      </div>
    </template>
    <div flex flex-col gap-3 text-12px>
      <div flex items-start justify-between>
        <div fc gap-1>
          <Icon
            :icon="eventInfo.additional.lottery.number >= eventInfo.additional.lottery.limit ? 'material-symbols:check-box' : 'material-symbols:check-box-outline-blank'"
            color="#f0cb4f"
            size="5"
          />
          <div>
            果報の古箱
          </div>
        </div>
        <NumberLimitDisplay :value="{ number: eventInfo.additional.lottery.number, limit: eventInfo.additional.lottery.limit }" />
      </div>
      <MissionList :mission-list="eventInfo.mission" />

      <div flex items-center justify-between text-12px>
        <div fc gap-1>
          <Icon icon="game-icons:medal" size="5" />
          <div>
            {{ eventInfo.additional.honor.toLocaleString() }}
          </div>
        </div>
        <el-tooltip content="点击设置贡献目标，显示差值" placement="top">
          <TheButton link @click="onSetTarget">
            {{ eventInfo.additional.targetHonor ? (eventInfo.additional.targetHonor - eventInfo.additional.honor).toLocaleString() : '设置目标' }}
          </TheButton>
        </el-tooltip>
      </div>

      <!-- 修分功能 -->
      <div v-if="gap > 0" flex flex-col gap-2 mt-2 border-t pt-2 border-gray-700>
        <div flex items-center justify-between>
          <div text-12px>修分方案</div>
          <el-checkbox v-model="showFixScore" size="small">显示</el-checkbox>
        </div>
        <div v-if="showFixScore" class="fix-score-result" text-11px>
          <div v-if="isCalculating" class="text-center py-2">
            计算中...
          </div>
          <div v-else-if="fixScoreResult" class="py-1">
            <div v-for="(line, index) in formatFixScoreResult(fixScoreResult).split('\n')" :key="index" class="mb-1">
              {{ line }}
            </div>
          </div>
          <div v-else class="text-center py-2">
            无法计算修分方案
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.fix-score-result {
  background-color: #1a1a1a;
  padding: 8px;
  border-radius: 4px;
  line-height: 1.3;
}
</style>
