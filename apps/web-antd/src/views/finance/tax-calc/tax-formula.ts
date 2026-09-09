/**
 * 税务计算器：纯领域逻辑（无 Vue 依赖）
 *
 * 基于收入合计计算增值税、附加税及印花税，可配置：增值税率（千分之 X，默认
 *  DEFAULT_VAT_RATE_PERMIL ‰）、城建税类型（市 / 县）、附加税是否减半征收。
 *
 * 精度说明：采用 decimal.js 做十进制运算，规避 JS 浮点累加/舍入误差；收入与各项
 *  税费均四舍五入到 3 位小数（厘），合计 = 各税目（已取整）之和，因此「各行之和」
 *  恒等于「合计」、全程精确到 3 位小数。税率/千分值以字符串或整数除法形式参与
 *  运算，避免把 0.004 之类的浮点字面量再次带入 Decimal。
 *
 * 税率（默认）：
 *  - 增值税（应交税金）= 销项税 = 收入 × 默认 7‰（可配置，单位 ‰）；进项税 = 销项 - 应交（=0）
 *  - 城建税：市 7%、县 5%（基于增值税）
 *  - 教育附加 3%、地方教育附加 2%（基于增值税）
 *  - 印花税（买卖合同）0.03%（基于进项 + 销项）
 *  - 附加税（城建 / 教育 / 地方教育）可选择减半征收
 */
import { Decimal } from 'decimal.js';

/** 城建税类型 */
export type CityType = 'city' | 'county';

/** 税务计算配置 */
export interface TaxOptions {
  cityType: CityType;
  /** 是否减半征收附加税 */
  halfRate: boolean;
  /** 增值税率，单位 ‰（千分之），如 7 表示 7‰ */
  vatRatePermil: number;
}

/** 税务计算结果 */
export interface TaxResult {
  income: number;
  /** 应交税金（增值税） */
  vat: number;
  /** 销项税 */
  outputTax: number;
  /** 进项税 = 销项税 - 应交税金 */
  inputTax: number;
  /** 城建税 */
  cityTax: number;
  /** 教育附加税 */
  educationSurcharge: number;
  /** 地方教育附加税 */
  localEducationSurcharge: number;
  /** 印花税（买卖合同） */
  stampDuty: number;
  /** 合计税额（= 上方 5 个税目之和，均精确到 3 位小数） */
  totalTax: number;
}

/** 增值税率输入框的默认值（单位 ‰） */
export const DEFAULT_VAT_RATE_PERMIL = 7;

// ==================== 附加税率（固定，字符串形式喂给 Decimal） ====================
export const EDUCATION_SURCHARGE_RATE = '0.03'; // 教育附加 3%
export const LOCAL_EDUCATION_SURCHARGE_RATE = '0.02'; // 地方教育附加 2%
export const STAMP_DUTY_RATE = '0.0003'; // 印花税 0.03%
export const CITY_TAX_RATE: Record<CityType, string> = {
  city: '0.07', // 市 7%
  county: '0.05', // 县 5%
};

/** 金额精度：3 位小数（厘） */
const MONEY_DECIMALS = 3;

/** 判断是否为有效非负有限数字 */
export function isValidNumber(val: unknown): boolean {
  if (val === null || val === undefined || val === '') return false;
  const num = Number.parseFloat(val as string);
  return !Number.isNaN(num) && Number.isFinite(num) && num >= 0;
}

/**
 * 从字符串中解析若干个金额。
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

/**
 * 金额格式化：保留至多 3 位小数，且不强制补零（1.20 -> 1.2，1 -> 1，1.235 -> 1.235）。
 * 计算值已在 calculateTaxes 内四舍五入到 3 位小数，这里仅做显示归一与去尾零。
 */
export function formatMoney(num: number): string {
  return String(Number(num.toFixed(3)));
}

/** 四舍五入到 3 位小数（厘）；Decimal 默认舍入模式即 ROUND_HALF_UP，符合四舍五入 */
function roundAmount(value: Decimal): Decimal {
  return value.toDecimalPlaces(MONEY_DECIMALS);
}

/**
 * 计算税务明细。
 *
 * @param income 收入合计（由调用方对金额列表求和得到）
 * @param options 城建税类型、减半征收开关、增值税率(‰)
 */
export function calculateTaxes(income: number, options: TaxOptions): TaxResult {
  const { cityType, halfRate, vatRatePermil } = options;

  // 收入先归一到 3 位小数，确保显示与参与运算的基数为同一值
  const base = roundAmount(new Decimal(income));
  // 增值税率：千分之 X → X / 1000（如 7‰ → 0.007），字符串/整数除法避免浮点
  const vatRate = new Decimal(vatRatePermil).div(1000);

  // 应交税金（增值税）、销项税 同率（保持进项税 = 0）
  const vatRaw = base.mul(vatRate);
  const outputRaw = base.mul(vatRate);
  const inputRaw = outputRaw.sub(vatRaw);

  // 附加税基于增值税，可选择减半
  let cityRaw = vatRaw.mul(CITY_TAX_RATE[cityType]);
  let eduRaw = vatRaw.mul(EDUCATION_SURCHARGE_RATE);
  let localRaw = vatRaw.mul(LOCAL_EDUCATION_SURCHARGE_RATE);
  if (halfRate) {
    cityRaw = cityRaw.div(2);
    eduRaw = eduRaw.div(2);
    localRaw = localRaw.div(2);
  }
  const stampRaw = inputRaw.add(outputRaw).mul(STAMP_DUTY_RATE);

  // 各税目四舍五入到 3 位小数；合计 = 已取整各税目之和 → 行之和 == 合计
  const vat = roundAmount(vatRaw);
  const outputTax = roundAmount(outputRaw);
  const inputTax = roundAmount(inputRaw);
  const cityTax = roundAmount(cityRaw);
  const educationSurcharge = roundAmount(eduRaw);
  const localEducationSurcharge = roundAmount(localRaw);
  const stampDuty = roundAmount(stampRaw);
  const totalTax = vat
    .add(cityTax)
    .add(educationSurcharge)
    .add(localEducationSurcharge)
    .add(stampDuty);

  return {
    income: base.toNumber(),
    vat: vat.toNumber(),
    outputTax: outputTax.toNumber(),
    inputTax: inputTax.toNumber(),
    cityTax: cityTax.toNumber(),
    educationSurcharge: educationSurcharge.toNumber(),
    localEducationSurcharge: localEducationSurcharge.toNumber(),
    stampDuty: stampDuty.toNumber(),
    totalTax: totalTax.toNumber(),
  };
}
