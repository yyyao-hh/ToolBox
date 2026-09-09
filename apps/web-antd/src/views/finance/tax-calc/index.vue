<script lang="ts" setup>
import type { CityType, TaxResult } from './tax-formula';

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { useClipboard } from '@vueuse/core';
import {
  Button,
  Card,
  Checkbox,
  Empty,
  Input,
  message,
  Radio,
  Typography,
} from 'ant-design-vue';

import { Page } from '#/components/CommonUiComponents';
import { Icon } from '#/components/Icon';
import { Tooltip } from '#/components/Tooltip';

import NumberTag from './number-tag.vue';
import { calculateTaxes, formatMoney, parseNumberList } from './tax-formula';

defineOptions({ name: 'FinanceTaxCalc' });

const { Text } = Typography;

// ==================== 常量 ====================
const EXAMPLE_NUMBERS = [10_000, 25_000, 18_000, 3000, 5000];

// ==================== 状态 ====================
const numbers = ref<number[]>([]);
const numberInputValue = ref('');
const cityType = ref<CityType>('city');
const halfRateEnabled = ref(true);
const result = ref<null | TaxResult>(null);

// 复制结果金额的反馈状态
const { copy } = useClipboard({ legacy: true });
const copiedLabel = ref<null | string>(null);
let copiedTimer: ReturnType<typeof setTimeout> | undefined;

// ==================== 计算属性 ====================
const totalSum = computed(() => numbers.value.reduce((a, b) => a + b, 0));

// 结果明细行：顺序与高亮规则
const resultRows = computed(() => {
  if (!result.value) return [];
  const half = halfRateEnabled.value;
  const r = result.value;
  const halfSuffix = half ? '（减半）' : '';
  return [
    { label: '收入合计', value: r.income, icon: '📈', isTotal: false },
    { label: '应交税金（增值税）', value: r.vat, icon: '🧾', isTotal: false },
    { label: '销项税', value: r.outputTax, icon: '📤', isTotal: false },
    { label: '进项税', value: r.inputTax, icon: '📥', isTotal: false },
    {
      label: `城建税${halfSuffix}`,
      value: r.cityTax,
      icon: '🏙️',
      isTotal: false,
    },
    {
      label: `教育附加税${halfSuffix}`,
      value: r.educationSurcharge,
      icon: '🎓',
      isTotal: false,
    },
    {
      label: `地方教育附加税${halfSuffix}`,
      value: r.localEducationSurcharge,
      icon: '🎓',
      isTotal: false,
    },
    {
      label: '印花税（买卖合同）',
      value: r.stampDuty,
      icon: '📄',
      isTotal: false,
    },
    { label: '合计税额', value: r.totalTax, icon: '💰', isTotal: true },
  ];
});

// ==================== 操作 ====================
function addNumbersFromInput() {
  const raw = numberInputValue.value.trim();
  if (!raw) {
    message.warning('请输入金额');
    return;
  }
  const parsed = parseNumberList(raw);
  if (parsed.length === 0) {
    message.error('未识别到有效金额');
    return;
  }
  numbers.value.push(...parsed);
  numberInputValue.value = '';
  message.success(
    `已添加 ${parsed.length} 个金额：${parsed.map((n) => formatMoney(n)).join(', ')}`,
  );
}

function removeNumber(index: number) {
  numbers.value.splice(index, 1);
  message.success('已移除金额');
}

function clearAll() {
  if (numbers.value.length === 0) {
    message.info('列表已经是空的');
    return;
  }
  numbers.value = [];
  result.value = null;
  message.success('已清空金额列表');
}

function loadExample() {
  numbers.value = [...EXAMPLE_NUMBERS];
  message.success('已载入示例数据');
}

/**
 * 执行税务计算并写入结果。
 * @param silent 静默模式：用于选项变动后的自动重算，避免频繁弹出"计算完成"提示
 */
function compute(silent: boolean): null | TaxResult {
  if (numbers.value.length === 0) {
    if (!silent) message.error('请先添加至少一个金额');
    return null;
  }
  result.value = calculateTaxes(totalSum.value, {
    cityType: cityType.value,
    halfRate: halfRateEnabled.value,
  });
  if (!silent) message.success('计算完成！');
  return result.value;
}

function calculate() {
  compute(false);
}

/** 复制某一行结果金额到剪贴板，并在该单元格短暂显示「✓」反馈 */
function copyRowValue(row: { label: string; value: number }) {
  copy(formatMoney(row.value));
  copiedLabel.value = row.label;
  if (copiedTimer) clearTimeout(copiedTimer);
  copiedTimer = setTimeout(() => {
    copiedLabel.value = null;
  }, 1200);
}

// 城建税类型 / 减半征收变更：与 demo 一致，有金额即自动计算
watch([cityType, halfRateEnabled], () => {
  if (numbers.value.length > 0) compute(true);
});

// 金额变动：自动计算结果（添加/移除均触发；清空时由下方 watch 清空结果）
watch([() => numbers.value.length, totalSum], () => {
  if (numbers.value.length > 0) compute(true);
});

// 金额清空时清空结果
watch(
  () => numbers.value.length,
  (len) => {
    if (len === 0) result.value = null;
  },
);

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
  if (copiedTimer) clearTimeout(copiedTimer);
});
</script>

<template>
  <Page
    :auto-content-height="true"
    content-class="!overflow-hidden flex flex-col"
    description="添加收入金额，自动计算增值税、附加税及印花税，可配置减半征收"
    title="税务计算"
  >
    <div
      class="grid min-h-0 flex-1 grid-rows-2 gap-6 lg:grid-cols-2 lg:grid-rows-1"
    >
      <!-- 左侧面板：收入金额输入 -->
      <Card
        :body-style="{ flex: '1 1 0%', minHeight: 0, overflow: 'auto' }"
        :head-style="{ flex: 'none' }"
        class="!flex min-h-0 !flex-col overflow-hidden"
        title="📥 添加收入金额"
      >
        <div class="flex flex-wrap gap-2">
          <Input
            v-model:value="numberInputValue"
            allow-clear
            class="min-w-[160px] flex-1"
            placeholder="输入金额，如 1000 或 350.5"
            @press-enter="addNumbersFromInput"
          />
          <Tooltip>
            <template #trigger>
              <Button type="primary" @click="addNumbersFromInput">添加</Button>
            </template>
            添加金额到列表
          </Tooltip>
        </div>

        <div class="text-muted-foreground mt-2 text-xs leading-relaxed">
          支持批量：用逗号、空格或换行分隔多个金额，如 "1000, 2500 3000"
        </div>

        <div class="mt-2 flex flex-wrap gap-2">
          <Button class="!inline-flex items-center" @click="clearAll">
            <Icon class="mr-1" icon="lucide:trash-2" />
            清空列表
          </Button>
          <Button class="!inline-flex items-center" @click="loadExample">
            <Icon class="mr-1" icon="lucide:clipboard-list" />
            示例数据
          </Button>
        </div>

        <div class="mt-4 flex min-h-[36px] flex-wrap items-start gap-2">
          <Text v-if="numbers.length === 0" class="!text-sm" type="secondary">
            暂无金额，请添加
          </Text>
          <NumberTag
            v-for="(num, index) in numbers"
            v-else
            :key="index"
            :value="num"
            @close="removeNumber(index)"
          />
        </div>

        <div
          v-if="numbers.length > 0"
          class="text-muted-foreground mt-3 flex flex-wrap gap-3 text-xs"
        >
          <span class="border-border bg-card rounded-full border px-2.5 py-1">
            总收入 -
            <strong class="text-foreground">{{ formatMoney(totalSum) }}</strong>
          </span>
          <span class="border-border bg-card rounded-full border px-2.5 py-1">
            个数 - <strong class="text-foreground">{{ numbers.length }}</strong>
          </span>
        </div>
      </Card>

      <!-- 右侧面板：税务选项 & 计算结果 -->
      <Card
        :body-style="{
          display: 'flex',
          flexDirection: 'column',
          flex: '1 1 0%',
          minHeight: 0,
        }"
        :head-style="{ flex: 'none' }"
        class="!flex min-h-0 !flex-col overflow-hidden"
        title="🎛️ 税务选项 &amp; 计算结果"
      >
        <Radio.Group v-model:value="cityType" class="mb-3 flex-none">
          <Radio.Button value="city">🏙️ 市（城建税 7%）</Radio.Button>
          <Radio.Button value="county">🏘️ 县（城建税 5%）</Radio.Button>
        </Radio.Group>

        <div
          class="border-border bg-card mb-3 flex flex-none items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm"
        >
          <Checkbox v-model:checked="halfRateEnabled">
            减半征收（优惠期间）
          </Checkbox>
        </div>

        <div class="flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
          <div v-if="!result" class="flex flex-1 items-center justify-center">
            <Empty
              description="添加金额并选择城建税类型后，点击上方按钮开始计算"
            />
          </div>

          <div v-else>
            <div class="border-border overflow-hidden rounded-lg border">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-accent">
                    <th
                      class="text-foreground px-4 py-2 text-left font-semibold"
                    >
                      项目
                    </th>
                    <th
                      class="text-foreground px-4 py-2 text-right font-semibold"
                    >
                      金额（元）
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in resultRows"
                    :key="row.label"
                    class="border-border border-b last:border-b-0"
                    :class="row.isTotal ? 'bg-primary/10' : ''"
                  >
                    <td
                      class="text-muted-foreground px-4 py-2.5"
                      :class="row.isTotal ? 'font-semibold' : ''"
                    >
                      {{ row.icon }} {{ row.label }}
                    </td>
                    <td
                      class="text-foreground px-4 py-2.5 text-right font-semibold tabular-nums"
                      :class="row.isTotal ? 'text-primary' : ''"
                    >
                      <span
                        class="cursor-pointer select-none transition-colors"
                        :class="
                          copiedLabel === row.label ? 'text-green-600' : ''
                        "
                        :title="
                          copiedLabel === row.label ? '已复制' : '点击复制'
                        "
                        role="button"
                        tabindex="0"
                        @click="copyRowValue(row)"
                        @keydown.enter.prevent="copyRowValue(row)"
                        @keydown.space.prevent="copyRowValue(row)"
                      >
                        {{
                          copiedLabel === row.label
                            ? `✓ ${formatMoney(row.value)}`
                            : formatMoney(row.value)
                        }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div
              class="text-muted-foreground mt-2.5 text-center text-xs leading-relaxed"
            >
              * 进项税 = 销项税 - 应交税金；因销项税与应交税金相同，进项税为 0。
            </div>
          </div>
        </div>
      </Card>
    </div>

    <div
      class="text-muted-foreground mt-5 flex-none text-center text-xs leading-relaxed"
    >
      ⚡ 税率：增值税 4‰，城建税（市 7%、县 5%），教育附加 3%，地方教育附加
      2%，印花税（买卖合同） 0.03%。附加税可选择是否减半。支持 Ctrl/Cmd + Enter
      快捷计算。
    </div>
  </Page>
</template>
