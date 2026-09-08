/**
 * 凑数字：纯领域逻辑（无 Vue 依赖）
 *
 * findNoOverCombination：穷举子集和，在「不超过目标」的前提下找出总和最大
 *  （即最接近目标）的组合集合；以及输入解析与数字格式化辅助函数。
 *
 * 算法说明：采用 meet-in-the-middle——把数字分成两半各穷举 2^(n/2)，合并阶段
 *  在右半按和排序后二分查找，复杂度 O(n · 2^(n/2))。n=25 时约 1e4 量级子集，
 *  毫秒级即可完成（朴素穷举 O(n·2^n) 约 8 亿次、会卡住主线程）。
 *  小数按 1e6 精度量化为整数参与运算，避免浮点累加 / 比较误差。
 */

/** 单个组合的计算结果（带原始 nums 与求和） */
export interface Combo {
  indices: number[];
  nums: number[];
  sum: number;
}

/** 算法返回结果 */
export interface CalcResult {
  /** 物化的最优组合下标集合（已按元素个数升序、按下标去重，最多 MAX_COMBOS 个） */
  indexCombos: number[][];
  /** 最优组合的总数量（不一定都物化，仅用于展示「找到 N 个」「还有 X 个未显示」） */
  totalCombos: number;
  bestDiff: number;
  bestSum: null | number;
}

/** 判断是否为有效有限数字 */
export function isValidNumber(val: unknown): boolean {
  if (val === null || val === undefined || val === '') return false;
  const num = Number.parseFloat(val as string);
  return !Number.isNaN(num) && Number.isFinite(num);
}

/**
 * 从字符串中解析若干个数字。
 * 支持逗号、中文逗号、顿号、分号、空格等分隔符；非数字片段会被忽略。
 */
export function parseNumberList(str: string): number[] {
  const parts = str.split(/[,，、;；\s]+/).filter((s) => s.trim() !== '');
  const result: number[] = [];
  for (const part of parts) {
    if (isValidNumber(part)) result.push(Number.parseFloat(part));
  }
  return result;
}

/** 数字格式化：整数直接输出，小数最多保留 6 位有效 */
export function formatNumber(num: number): string {
  if (Number.isInteger(num)) return num.toString();
  return Number.parseFloat(num.toFixed(6)).toString();
}

// 物化最优组合的上限——避免病态输入（大量相同 / 为 0 的数字会产生天文数字的最优组合）爆内存
const MAX_COMBOS = 200;
// 小数量化精度（与 formatNumber 的 6 位小数对齐）
const SCALE = 1e6;

interface HalfSubset {
  sumU: number;
  indices: number[];
}

/** 穷举 [from, to) 区间数字的全部子集，返回每个子集的整数和（量化）与原始下标集合 */
function enumerateHalves(
  unitArr: number[],
  from: number,
  to: number,
): HalfSubset[] {
  const len = to - from;
  const total = 1 << len;
  const res: HalfSubset[] = [];
  for (let mask = 0; mask < total; mask++) {
    let sum = 0;
    const indices: number[] = [];
    for (let i = 0; i < len; i++) {
      if (mask & (1 << i)) {
        sum += unitArr[from + i] as number;
        indices.push(from + i);
      }
    }
    res.push({ sumU: sum, indices });
  }
  return res;
}

/** 在升序数组中返回第一个大于 x 的下标（即「最大不超过 x」查询用的右端 + 1） */
function upperBound(arr: number[], x: number): number {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if ((arr[m] as number) <= x) lo = m + 1;
    else hi = m;
  }
  return lo;
}

function pushGroup(
  map: Map<number, HalfSubset[]>,
  key: number,
  item: HalfSubset,
) {
  let arr = map.get(key);
  if (!arr) {
    arr = [];
    map.set(key, arr);
  }
  arr.push(item);
}

/**
 * 穷举全部子集，在「不超过 target」的前提下找出总和最大（即最接近目标）的组合集合。
 *
 * meet-in-the-middle：复杂度 O(n · 2^(n/2))，n=25 毫秒级。
 * 小数按 SCALE 量化为整数参与运算，避免浮点比较误差。
 */
export function findNoOverCombination(
  nums: number[],
  target: number,
): CalcResult {
  const n = nums.length;
  if (n === 0)
    return {
      indexCombos: [],
      totalCombos: 0,
      bestDiff: Number.POSITIVE_INFINITY,
      bestSum: null,
    };

  // 量化为整数：小数最多 6 位 → 乘 1e6 后取整，子集和用整数加法（精确无累加误差）
  const unitNums = nums.map((v) => Math.round(v * SCALE));
  const unitTarget = Math.round(target * SCALE);

  const mid = n >> 1;
  const left = enumerateHalves(unitNums, 0, mid);
  const right = enumerateHalves(unitNums, mid, n);

  // 右半按整数和升序排序，便于「最大不超过」二分
  right.sort((a, b) => a.sumU - b.sumU);
  const rightSums = right.map((r) => r.sumU);

  // 1) 求最优总和 bestTotalU（不超过 unitTarget 的最大值）
  //    right 含空子集（sumU = 0），故 unitTarget >= 0 时 bestTotalU 至少为 0
  let bestTotalU = Number.NEGATIVE_INFINITY;
  for (const l of left) {
    const remain = unitTarget - l.sumU;
    if (remain < 0) continue; // 左半已超过目标，直接跳过
    const j = upperBound(rightSums, remain) - 1; // 右半中 ≤ remain 的最大和
    if (j >= 0) {
      const total = l.sumU + (rightSums[j] as number);
      if (total > bestTotalU) bestTotalU = total;
    } else if (l.sumU > bestTotalU) {
      bestTotalU = l.sumU;
    }
  }

  if (bestTotalU === Number.NEGATIVE_INFINITY) {
    // 所有子集都超过目标（如目标为负、数字全为正）：无解
    return {
      indexCombos: [],
      totalCombos: 0,
      bestDiff: Number.POSITIVE_INFINITY,
      bestSum: null,
    };
  }

  // 2) 找出所有达到 bestTotalU 的组合：右半按 sumU 分组，左半按 sumU 分组匹配。
  //    左右下标天然不重叠，每个 (左, 右) 配对都对应唯一组合，故可直接相乘得到精确总数。
  //    仅物化前 MAX_COMBOS 个供展示，避免病态输入爆内存。
  const rightBySum = new Map<number, HalfSubset[]>();
  for (const r of right) pushGroup(rightBySum, r.sumU, r);
  const leftBySum = new Map<number, HalfSubset[]>();
  for (const l of left) pushGroup(leftBySum, l.sumU, l);

  let totalCombos = 0;
  const combos: number[][] = [];
  for (const [sl, leftList] of leftBySum) {
    const needR = bestTotalU - sl;
    const rightList = rightBySum.get(needR);
    if (!rightList) continue;
    totalCombos += leftList.length * rightList.length;
    if (combos.length < MAX_COMBOS) {
      for (const l of leftList) {
        if (combos.length >= MAX_COMBOS) break;
        for (const r of rightList) {
          if (combos.length >= MAX_COMBOS) break;
          combos.push([...l.indices, ...r.indices]);
        }
      }
    }
  }

  // 按元素个数升序、按下标集合去重（去重仅作保险）
  combos.sort((a, b) => a.length - b.length);
  const seen = new Set<string>();
  const unique: number[][] = [];
  for (const combo of combos) {
    const key = [...combo].sort((x, y) => x - y).join(',');
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(combo);
    }
  }

  const bestSum = bestTotalU / SCALE;
  return {
    indexCombos: unique,
    totalCombos,
    bestDiff: (unitTarget - bestTotalU) / SCALE,
    bestSum,
  };
}
