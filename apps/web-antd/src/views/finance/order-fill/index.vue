<script lang="ts" setup>
import type { CalcResult, Combo } from './find-closest';

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  message,
  Tag,
  Typography,
} from 'ant-design-vue';

import { Loading, Page } from '#/components/CommonUiComponents';
import { Icon } from '#/components/Icon';
import { Tooltip } from '#/components/Tooltip';

import ComboCard from './combo-card.vue';
import {
  findNoOverCombination,
  formatNumber,
  isValidNumber,
  parseNumberList,
} from './find-closest';
import OrderTag from './order-tag.vue';

defineOptions({ name: 'FinanceOrderFill' });

const { Text } = Typography;

// ==================== 常量 ====================
const MAX_NUMBERS = 25; // 数字数量上限（meet-in-the-middle 下 n=25 约毫秒级；保留上限以控制内存）
const MAX_SHOW = 50; // 结果最多展示的组合数
const EXAMPLE_NUMBERS = [12, 8, 15, 7, 22, 5, 18, 3, 9, 14, 6, 11];

// ==================== 状态 ====================
const numbers = ref<number[]>([]);
const numberInputValue = ref('');
const targetInputValue = ref('');
const isCalculating = ref(false);

const result = ref<CalcResult | null>(null);
const highlightedIndices = ref<number[]>([]);

// ==================== 高亮辅助 ====================
function isHighlighted(index: number): boolean {
  return highlightedIndices.value.includes(index);
}

function highlightSelected(indices: number[] = []) {
  highlightedIndices.value = indices;
}

// ==================== 计算属性 ====================
const totalSum = computed(() => numbers.value.reduce((a, b) => a + b, 0));

const targetNumber = computed(() => Number.parseFloat(targetInputValue.value));

const hasValidTarget = computed(
  () =>
    targetInputValue.value.trim() !== '' &&
    isValidNumber(targetInputValue.value),
);

// 将算法返回的下标集合映射为带 nums/sum 的组合视图模型
const resultCombos = computed<Combo[]>(() => {
  if (!result.value) return [];
  return result.value.indexCombos.map((indices) => ({
    indices,
    nums: indices.map((i) => numbers.value[i] as number),
    sum: indices.reduce((acc, i) => acc + (numbers.value[i] ?? 0), 0),
  }));
});

const totalCombos = computed(() => result.value?.totalCombos ?? 0);

const showCombos = computed(() => resultCombos.value.slice(0, MAX_SHOW));
const remainingCount = computed(() =>
  Math.max(0, totalCombos.value - showCombos.value.length),
);

const diffTagColor = computed<'error' | 'success' | 'warning'>(() => {
  if (!result.value) return 'warning';
  if (result.value.bestDiff === 0) return 'success';
  if (result.value.bestDiff <= Math.max(1, (targetNumber.value || 0) * 0.05))
    return 'warning';
  return 'error';
});

const diffTagText = computed(() => {
  if (!result.value) return '';
  if (result.value.bestDiff === 0) return '完全匹配！';
  return `差值 ${formatNumber(result.value.bestDiff)}`;
});

// ==================== 操作 ====================
function addNumbersFromInput() {
  const raw = numberInputValue.value.trim();
  if (!raw) {
    message.warning('请输入数字');
    return;
  }
  const parsed = parseNumberList(raw);
  if (parsed.length === 0) {
    message.error('未识别到有效数字');
    return;
  }
  if (numbers.value.length + parsed.length > MAX_NUMBERS) {
    message.error(`数字总数不能超过 ${MAX_NUMBERS} 个`);
    return;
  }
  numbers.value.push(...parsed);
  numberInputValue.value = '';
  highlightSelected([]);
  message.success(
    `已添加 ${parsed.length} 个数字：${parsed.map((n) => formatNumber(n)).join(', ')}`,
  );
}

function removeNumber(index: number) {
  numbers.value.splice(index, 1);
  highlightSelected([]);
  message.success('已移除数字');
}

function clearAll() {
  if (numbers.value.length === 0) {
    message.info('列表已经是空的');
    return;
  }
  numbers.value = [];
  highlightSelected([]);
  message.success('已清空数字列表');
}

function loadExample() {
  numbers.value = [...EXAMPLE_NUMBERS];
  targetInputValue.value = '50';
  highlightSelected([]);
  message.success('已载入示例数据');
  calculate();
}

function calculate() {
  if (isCalculating.value) return;
  if (!hasValidTarget.value) {
    message.error('请输入有效的目标数字');
    return;
  }
  if (numbers.value.length === 0) {
    message.error('请先添加至少一个数字');
    return;
  }
  if (numbers.value.length > MAX_NUMBERS) {
    message.error(`数字数量超过 ${MAX_NUMBERS} 个，请删减`);
    return;
  }

  isCalculating.value = true;
  const target = targetNumber.value;
  // 异步执行，留出时间渲染“计算中”状态（与 demo.html 一致）
  setTimeout(() => {
    try {
      const calc = findNoOverCombination(numbers.value, target);
      result.value = calc;
      highlightSelected(calc.indexCombos[0] ?? []);
      message.success('计算完成！');
    } catch (error) {
      console.error(error);
      message.error(`计算出错：${(error as Error).message}`);
    } finally {
      isCalculating.value = false;
    }
  }, 30);
}

function onComboClick(combo: Combo) {
  highlightSelected(combo.indices);
}

// 目标值变化时清除高亮
watch(targetInputValue, () => highlightSelected([]));

// ==================== 全局快捷键 Ctrl/Cmd + Enter ====================
let keydownHandler: ((e: KeyboardEvent) => void) | undefined;

onMounted(() => {
  keydownHandler = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      calculate();
    }
  };
  document.addEventListener('keydown', keydownHandler);
});

onBeforeUnmount(() => {
  if (keydownHandler) document.removeEventListener('keydown', keydownHandler);
});
</script>

<template>
  <Page
    :auto-content-height="true"
    content-class="!overflow-hidden flex flex-col"
    description="添加一组数字，设定目标值，找出总和不超过目标且最接近的组合"
    title="凑数字"
  >
    <div
      class="grid min-h-0 flex-1 grid-rows-2 gap-6 lg:grid-cols-2 lg:grid-rows-1"
    >
      <!-- 左侧面板：数字输入 -->
      <Card
        :body-style="{ flex: '1 1 0%', minHeight: 0, overflow: 'auto' }"
        :head-style="{ flex: 'none' }"
        class="!flex min-h-0 !flex-col overflow-hidden"
        title="📥 添加数字"
      >
        <div class="flex flex-wrap gap-2">
          <Input
            v-model:value="numberInputValue"
            allow-clear
            class="min-w-[160px] flex-1"
            placeholder="输入数字，如 15 或 3.5"
            @press-enter="addNumbersFromInput"
          />
          <Tooltip>
            <template #trigger>
              <Button type="primary" @click="addNumbersFromInput">
                添加
              </Button>
            </template>
            添加数字到列表
          </Tooltip>
        </div>

        <div class="text-muted-foreground mt-2 text-xs leading-relaxed">
          支持批量：用逗号、空格或换行分隔多个数字，如 "10, 20 30"
        </div>

        <div class="mt-2 flex flex-wrap gap-2">
          <Button
            class="!inline-flex items-center"
            size="middle"
            @click="clearAll"
          >
            <Icon class="mr-1" icon="lucide:trash-2" />
            清空列表
          </Button>
          <Button
            class="!inline-flex items-center"
            size="middle"
            @click="loadExample"
          >
            <Icon class="mr-1" icon="lucide:clipboard-list" />
            示例数据
          </Button>
        </div>

        <div class="mt-4 flex min-h-[36px] flex-wrap items-start gap-2">
          <Text v-if="numbers.length === 0" class="!text-sm" type="secondary">
            暂无数字，请添加
          </Text>
          <OrderTag
            v-for="(num, index) in numbers"
            v-else
            :key="index"
            :selected="isHighlighted(index)"
            :value="num"
            @close="removeNumber(index)"
          />
        </div>

        <div
          v-if="numbers.length > 0"
          class="text-muted-foreground mt-3 flex flex-wrap gap-3 text-xs"
        >
          <span class="border-border bg-card rounded-full border px-2.5 py-1">
            总和 -
            <strong class="text-foreground">{{
              formatNumber(totalSum)
            }}</strong>
          </span>
          <span class="border-border bg-card rounded-full border px-2.5 py-1">
            个数 - <strong class="text-foreground">{{ numbers.length }}</strong>
          </span>
        </div>
      </Card>

      <!-- 右侧面板：目标与结果 -->
      <Card
        :body-style="{
          display: 'flex',
          flexDirection: 'column',
          flex: '1 1 0%',
          minHeight: 0,
        }"
        :head-style="{ flex: 'none' }"
        class="!flex min-h-0 !flex-col overflow-hidden"
        title="🎯 目标数字 &amp; 计算结果"
      >
        <Input
          v-model:value="targetInputValue"
          allow-clear
          class="mb-3 flex-none"
          placeholder="输入目标数字，如 100"
          @press-enter="calculate"
        />

        <Button
          :loading="isCalculating"
          block
          class="flex-none"
          size="large"
          type="primary"
          @click="calculate"
        >
          <Icon v-if="!isCalculating" class="mr-1" icon="lucide:search" />
          {{ isCalculating ? '计算中...' : '计算最接近组合' }}
        </Button>

        <Loading
          :spinning="isCalculating"
          class="mt-4 flex !min-h-0 flex-1 flex-col"
          text="计算中..."
        >
          <div v-if="!result" class="flex flex-1 items-center justify-center">
            <Empty description="添加数字并设置目标后，点击上方按钮开始计算" />
          </div>
          <div
            v-else-if="resultCombos.length === 0"
            class="flex flex-1 items-center justify-center"
          >
            <Empty description="没有找到有效组合（所有数字都超过目标？）" />
          </div>
          <div v-else class="flex min-h-0 flex-1 flex-col gap-2">
            <Alert class="flex-none" show-icon type="success">
              <template #message>
                <span class="font-semibold">
                  找到 {{ totalCombos }} 个最优组合
                </span>
              </template>
              <template #description>
                最接近和值：
                <strong class="mr-2 text-lg">{{
                  formatNumber(result.bestSum ?? 0)
                }}</strong>
                目标：<strong>{{ formatNumber(targetNumber || 0) }}</strong>
                <Tag :color="diffTagColor" class="!m-0 !ml-2">
                  {{ diffTagText }}
                </Tag>
              </template>
            </Alert>

            <div
              class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1"
            >
              <ComboCard
                v-for="combo in showCombos"
                :key="combo.indices.join('-')"
                :combo="combo"
                :target="targetNumber"
                @click="onComboClick(combo)"
              />

              <div
                v-if="remainingCount > 0"
                class="text-muted-foreground py-2.5 text-center text-xs"
              >
                ... 还有 {{ remainingCount }} 个组合未显示
              </div>
            </div>
          </div>
        </Loading>
      </Card>
    </div>

    <div
      class="text-muted-foreground mt-5 flex-none text-center text-xs leading-relaxed"
    >
      算法采用穷举搜索（子集和），数字数量上限
      <strong>{{ MAX_NUMBERS }}</strong> 个（超出会提示）。支持小数。
      提示：点击结果卡片可以高亮左侧对应的数字；支持 Ctrl/Cmd + Enter 快捷计算。
    </div>
  </Page>
</template>
