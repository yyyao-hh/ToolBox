/**
 * 税务计算器：纯领域逻辑（无 Vue 依赖）
 *
 * 基于收入合计计算增值税、附加税及印花税，可配置城建税类型（市 / 县）与减半征收。
 *
 * 税率（与 demo.html 一致）：
 *  - 增值税（应交税金）4‰、销项税 4‰、进项税 = 销项税 - 应交税金
 *  - 城建税：市 7%、县 5%（基于增值税）
 *  - 教育附加 3%、地方教育附加 2%（基于增值税）
 *  - 印花税（买卖合同）0.03%（基于进项 + 销项）
 *  - 附加税（城建 / 教育 / 地方教育）可选择减半征收
 */

/** 城建税类型 */
export type CityType = 'city' | 'county';

/** 税务计算配置 */
export interface TaxOptions {
  cityType: CityType;
  /** 是否减半征收附加税 */
  halfRate: boolean;
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
  /** 合计税额 */
  totalTax: number;
}

// ==================== 税率常量 ====================
export const VAT_RATE = 0.004; // 增值税 4‰
export const OUTPUT_TAX_RATE = 0.004; // 销项税 4‰
export const EDUCATION_SURCHARGE_RATE = 0.03; // 教育附加 3%
export const LOCAL_EDUCATION_SURCHARGE_RATE = 0.02; // 地方教育附加 2%
export const STAMP_DUTY_RATE = 0.0003; // 印花税 0.03%

/** 城建税率：市 7%、县 5% */
export const CITY_TAX_RATE: Record<CityType, number> = {
  city: 0.07,
  county: 0.05,
};

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
 * 金额格式化：整数直接输出；小额税费保留更多精度，避免四舍五入为 0。
 *  - < 0.01 保留 4 位（如印花税）
 *  - < 1     保留 3 位
 *  - 其余     保留 2 位（货币常规精度）
 */
export function formatMoney(num: number): string {
  if (Number.isInteger(num)) return num.toString();
  const abs = Math.abs(num);
  const decimals = abs < 0.01 ? 4 : abs < 1 ? 3 : 2;
  return Number.parseFloat(num.toFixed(decimals)).toString();
}

/**
 * 计算税务明细。
 *
 * @param income 收入合计（由调用方对金额列表求和得到）
 * @param options 城建税类型与减半征收开关
 */
export function calculateTaxes(income: number, options: TaxOptions): TaxResult {
  const { cityType, halfRate } = options;

  // 应交税金（增值税）= 收入 × 4‰；销项税同税率；进项税 = 销项 - 应交（此处为 0）
  const vat = income * VAT_RATE;
  const outputTax = income * OUTPUT_TAX_RATE;
  const inputTax = outputTax - vat;

  // 附加税基于增值税，可选择减半
  let cityTax = vat * CITY_TAX_RATE[cityType];
  if (halfRate) cityTax /= 2;

  let educationSurcharge = vat * EDUCATION_SURCHARGE_RATE;
  if (halfRate) educationSurcharge /= 2;

  let localEducationSurcharge = vat * LOCAL_EDUCATION_SURCHARGE_RATE;
  if (halfRate) localEducationSurcharge /= 2;

  // 印花税 = (进项 + 销项) × 0.0003
  const stampDuty = (inputTax + outputTax) * STAMP_DUTY_RATE;

  const totalTax =
    vat +
    cityTax +
    educationSurcharge +
    localEducationSurcharge +
    stampDuty;

  return {
    income,
    vat,
    outputTax,
    inputTax,
    cityTax,
    educationSurcharge,
    localEducationSurcharge,
    stampDuty,
    totalTax,
  };
}
