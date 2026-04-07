# UI Scenes 适配度提示（专家提示）设计说明

## 1. 目标

适配度提示用于判断一条动画曲线在特定 UI 场景中的"专家级匹配程度"，帮助用户快速选择更符合交互语义与节奏的 easing。

本文档覆盖：

- 评分框架的输入、输出与核心维度。
- 统一的曲线特征抽象（cubic-bezier / spring / custom）。
- 每个指标的精确定义与计算公式。
- 场景偏好的量化参考表。
- 评分函数、阈值与专家提示策略。
- 校准与验证方法。

## 2. 设计原则

- **一致性**：所有曲线类型统一转为采样 → 特征 → 评分，结果可横向对比。
- **可解释性**：专家提示能说明"为什么好/不好"，而非只给分值。
- **可调参**：场景偏好、时长区间、权重均可配置、可迭代。
- **可验证**：通过参考曲线库 + 自动化测试进行校准。

## 3. 术语

| 术语 | 说明 |
|---|---|
| **场景（Scene）** | 具体 UI 交互类型，如 list-loading、drawer、tooltip 等 |
| **曲线类型** | cubic-bezier、spring、custom（用户自定义采样或表达式） |
| **适配度等级** | great / good / fair / poor |
| **专家提示** | 对曲线 + 时长匹配程度的解释与调整建议 |
| **CurveTraits** | 从采样数据中提取的曲线特征向量 |
| **有效时长** | 动画实际生效的时长（详见 §6.2 spring 时长语义） |

## 4. 输入与输出

### 4.1 输入

- `scene`：UI 场景类型（`UISceneType`）。
- `curve`：曲线定义，三种形式之一：
  - **cubic-bezier**：`{ x1, y1, x2, y2 }`
  - **spring**：`{ mass, stiffness, damping, initialVelocity }`
  - **custom**：`{ samples: { t, y }[] }` 或表达式
- `duration`：动画时长（秒）——对 spring 有特殊语义，见 §6.2。

### 4.2 输出

- `level`：适配度等级（`FitnessLevel`）。
- `label`：UI badge 短标签（如 "Great fit"）。
- `tip`：专家提示文本（含原因与建议）。
- `scores`（可选，用于调试）：`{ curveFit, duration, stability, total }`。

## 5. 评分框架总览

### 5.1 统一流程

所有曲线类型遵循同一评分管线：

```
曲线定义 → 采样归一化 → 特征提取(CurveTraits) → 评分(3个子项) → 加权合并 → 等级映射 → 专家提示
```

### 5.2 演进策略

- **当前状态**：cubic-bezier 使用控制点直接分析（`analyzeCurve`），不经过采样。
- **目标状态**：所有曲线统一走"采样 → 特征提取"管线。
- **迁移方式**：
  - cubic-bezier **保留控制点快捷路径**作为优化，但其输出需映射到统一的 `CurveTraits`。
  - spring / custom 走采样路径。
  - 评分层只接受 `CurveTraits`，不区分曲线来源。

## 6. 采样与归一化

### 6.1 通用规则

- **时间归一化**：将曲线映射到 t ∈ [0, 1]。
- **幅度归一化**：期望终点为 y = 1，允许 overshoot 超出 [0, 1]。
- **采样密度**：默认 N = 64 采样点（均匀分布）。
  - 若初次采样检测到 `max(|y|) > 1.1` 或 `max(|Δv|) > 阈值`，自适应增加到 N = 128。
- **速度估计**：使用中心差分 `v[i] = (y[i+1] - y[i-1]) / (t[i+1] - t[i-1])`，端点用前向/后向差分。
- **速度平滑**：对 v[] 施加 3 点移动平均，以降低采样噪声。

> 输出：`samples: { t: number, y: number, v: number }[]`

### 6.2 spring 曲线的时长语义

spring 动画的时长由物理参数（mass / stiffness / damping）决定，用户通常不显式指定。需要区分两种语义：

| 情况 | duration 含义 | 处理方式 |
|---|---|---|
| 用户未指定时长 | spring 自然 settleTime | `duration = settleTime`，直接用于评分 |
| 用户显式指定了截断时长 | 用户强制的播放时长 | 若 `截断时长 < settleTime * 0.8`，在 tip 中提示"动画可能被截断" |

**settleTime 定义**：`y(t)` 首次进入 `[0.998, 1.002]` 并不再离开的时刻。

采样时应以 settleTime（而非截断时长）为归一化基准，以完整捕获回弹特征。

#### 6.2.1 阻尼比（ζ）分析

对于 spring 曲线，阻尼比是判断动态行为的关键物理参数：

```
ζ = damping / (2 * √(stiffness * mass))
```

| ζ 范围 | 行为 | 对评分的影响 |
|---|---|---|
| ζ > 1 | 过阻尼（overdamped） | 无 overshoot，类似 ease-out；settleTimeRatio 偏高 |
| ζ = 1 | 临界阻尼（critically damped） | 最快到达终点，无 overshoot；最优 settleTimeRatio |
| 0.3 < ζ < 1 | 欠阻尼（underdamped） | 有 overshoot，适合弹性提示场景 |
| ζ < 0.3 | 强欠阻尼 | 大幅 overshoot + 长时间震荡，多数场景不适合 |

**用途**：
- ζ 作为 CurveTraits 的**辅助特征**（不参与加权评分，但用于生成更专业的专家提示）。
- 在 tip 中可输出如："Underdamped spring (ζ=0.45) causes noticeable bounce — consider increasing damping for tab indicators"。
- 当 `ζ < 0.3` 且场景 `overshootMax = 0` 时，可直接触发 `poor` 级别的快速路径判定。

### 6.3 cubic-bezier 快捷路径

cubic-bezier 可跳过采样，直接从控制点计算部分特征（与当前实现兼容）：

- `easeOutBias = (y1 - x1) + (y2 - x2)`
- `easeInOutStrength = max(0, -(y1 - x1)) + max(0, (y2 - x2))`
- `linearness_cp = 1 - min(1, (|y1 - x1| + |y2 - x2|) / 1.2)`
- `overshoot`：若 `y1 < 0` 或 `y2 > 1` 则存在 overshoot

这些值需映射到统一 `CurveTraits`（映射规则见 §7）。

#### 6.3.1 快捷路径的交叉验证

控制点快捷路径输出的 CurveTraits 是对采样路径的近似。为确保映射准确，需执行交叉验证：

**方法**：对一组常见 cubic-bezier 曲线，同时运行采样路径和快捷路径，比较各 trait 的输出差异。

```typescript
const testCurves = [
  [0.25, 0.1, 0.25, 1.0],   // ease
  [0.42, 0, 1.0, 1.0],      // ease-in
  [0, 0, 0.58, 1.0],        // ease-out
  [0.42, 0, 0.58, 1.0],     // ease-in-out
  [0, 0, 1, 1],             // linear
  [0.68, -0.55, 0.27, 1.55], // back-in-out (overshoot)
  [0.22, 1.0, 0.36, 1.0],   // aggressive ease-out
];

for (const curve of testCurves) {
  const sampledTraits  = extractTraitsFromSamples(sampleBezier(curve, 64));
  const shortcutTraits = mapControlPointsToTraits(curve);
  for (const key of ['velocityBias', 'inOutBalance', 'linearness', 'overshootAmount']) {
    const diff = Math.abs(sampledTraits[key] - shortcutTraits[key]);
    expect(diff).toBeLessThan(0.05); // 容差阈值
  }
}
```

**处理策略**：
- 若某 trait 的偏差持续 > 0.05，说明该线性映射公式不够准确，需更换为二次拟合或直接走采样路径。
- 交叉验证应作为 CI 回归测试的一部分（见 §12.2）。

### 6.4 custom 曲线预处理

custom 曲线来自用户手绘或公式，可能存在噪声与不连续：

- **平滑**：对输入 `y[]` 施加 Savitzky–Golay 滤波（窗口 5，2 阶多项式），降低手绘抖动。
- **断点检测**：若相邻两点 `|Δv| > 10 * avg(|Δv|)`，标记为"断点"，对该曲线强制降低 stabilityScore。
- **采样对齐**：若用户提供的采样点不均匀，先插值到均匀 N 点再提取特征。

## 7. 曲线特征定义（CurveTraits）

所有指标归一化到可对比的范围。以下为精确定义：

### 7.1 velocityBias（速度倾向）

衡量曲线的"前快后慢"或"前慢后快"程度。

```
avg_v_first  = mean(v[0 .. N/2-1])
avg_v_second = mean(v[N/2 .. N-1])
ε = 1e-6
velocityBias = avg_v_first / (avg_v_first + avg_v_second + ε)
```

> 添加 ε 保护：当 `avg_v_first + avg_v_second → 0`（极慢曲线或 settle 震荡阶段）时避免除零或数值不稳定。

- 值域：[0, 1]
- `> 0.5`：ease-out 倾向（前快后慢）
- `< 0.5`：ease-in 倾向（前慢后快）
- `≈ 0.5`：线性或对称 ease-in-out

**cubic-bezier 映射**：`velocityBias = clamp(0.5 + easeOutBias / 4, 0, 1)`

> ⚠️ 此线性映射为近似值。需通过交叉验证（§6.3.1）确认与采样路径的偏差在可接受范围内。

### 7.2 inOutBalance（缓入缓出强度）

衡量起止阶段的速度缓冲程度。

```
avg_v_start  = mean(v[0 .. 0.2*N])        // 前 20%
avg_v_end    = mean(v[0.8*N .. N-1])       // 后 20%
avg_v_mid    = mean(v[0.2*N .. 0.8*N])     // 中间 60%
inOutBalance = 1 - (avg_v_start + avg_v_end) / (2 * avg_v_mid)
```

- 值域：clamp 到 [0, 1]
- `→ 1`：强缓入缓出（两端速度远低于中间）
- `→ 0`：无缓冲，接近线性或纯 ease-in/out

**cubic-bezier 映射**：`inOutBalance = min(1, easeInOutStrength / 0.8)`。

### 7.3 linearness（线性度）

衡量曲线与 `y = t` 的偏离程度。

```
linearness = 1 - (2/N) * Σ(i=0..N-1) |y[i] - t[i]|
```

- 值域：clamp 到 [0, 1]
- `→ 1`：接近线性
- `→ 0`：强烈弯曲或含 overshoot

**cubic-bezier 映射**：沿用 `linearness_cp`。

### 7.4 overshootAmount（超调幅度）

```
overshootAmount = max(0, max(y[]) - 1) + max(0, -min(y[]))
```

- 值域：[0, +∞)，实际场景一般 < 0.5
- `= 0`：无超调
- `> 0.05`：视为存在 overshoot

**cubic-bezier 映射**：`max(0, -y1) + max(0, y2 - 1)`（与当前实现一致）。

### 7.5 settleTimeRatio（稳定时间占比）

衡量曲线回弹后趋于稳定所需的时间占比。

```
settleIndex = 最后一个 |y[i] - 1| > 0.005 的索引
settleTimeRatio = settleIndex / N
```

- 值域：[0, 1]
- `→ 0`：无回弹，迅速到达终点
- `→ 1`：长时间震荡

**cubic-bezier**：若无 overshoot，`settleTimeRatio = 0`；若有 overshoot，近似为 `0.3`（固定估计）。

### 7.6 peakVelocity（峰值速度）

```
ε = 1e-6
peakVelocity = max(|v[]|) / (avg(|v[]|) + ε)
```

> 添加 ε 保护：当曲线极为平坦（`avg(|v|) → 0`）时避免除零。

- 归一化为相对于平均速度的倍数
- `≈ 1`：匀速
- `> 3`：存在明显"冲刺"

### 7.7 jerkiness（速度突变度）

衡量速度变化的剧烈程度（二阶差分的波动）。

```
a[i] = v[i+1] - v[i]        // 加速度序列
jerkiness = stddev(a[]) / avg(|v[]|)
```

- 值域：[0, +∞)，归一化后 clamp 到 [0, 1]（除以经验上限 2.0）
- `→ 0`：速度变化平滑
- `→ 1`：速度剧烈突变

## 8. 评分函数

### 8.1 总分公式

```
totalScore = curveFitScore * W_curve
           + durationScore * W_duration
           + stabilityScore * W_stability
```

三个子项的值域均为 [0, 1]，总分值域 [0, 1]。

### 8.2 curveFitScore（曲线匹配分）

基于场景偏好向量对 `velocityBias / inOutBalance / linearness` 打分。

每个场景定义一组偏好参数：

```typescript
interface ScenePreference {
  velocityBias:  { target: number; sigma: number };   // 高斯中心 + 宽度
  inOutBalance:  { target: number; sigma: number };
  linearness:    { target: number; sigma: number };
  overshootMax:  number;    // 最大可接受 overshoot
}
```

对每个指标用高斯函数打分：

```
score_i = exp(-0.5 * ((value - target) / sigma)^2)
```

`curveFitScore = mean(score_velocityBias, score_inOutBalance, score_linearness)`

若 `overshootAmount > overshootMax`，乘以惩罚因子：`* max(0, 1 - (overshoot - overshootMax) * 4)`。

### 8.3 durationScore（时长匹配分）

用高斯函数替代阶梯式评分，避免硬阈值突变：

```
mid = (ideal[0] + ideal[1]) / 2
sigma_d = (ideal[1] - ideal[0]) * 1.2    // 略宽于理想区间
durationScore = exp(-0.5 * ((duration - mid) / sigma_d)^2)
```

- 理想区间内 ≈ 0.95~1.0。
- 超出区间后平滑衰减。
- 支持非对称惩罚（短于理想比长于理想更严厉，或反之）：对不同侧使用不同 sigma。

### 8.4 stabilityScore（稳定性分）

衡量曲线的稳定表现，对不同场景有不同含义。采用**乘法惩罚**（而非减法）避免负值和量纲混乱：

```
stabilityScore = factor_overshoot * factor_settle * factor_jerkiness * factor_spring_pop
```

各因子定义（值域均为 (0, 1]，乘积自然在 [0, 1] 内）：

| 因子 | 计算 | 上限惩罚 | 生效条件 |
|---|---|---|---|
| **factor_overshoot** | `excess = max(0, overshootAmount - scene.overshootMax)`；`factor = max(0.1, 1 - excess * 3)` | 最低 0.1（即最多扣 90%） | 所有场景 |
| **factor_settle** | `excess = max(0, settleTimeRatio - 0.4)`；`factor = max(0.2, 1 - excess * 2)` | 最低 0.2 | 严谨场景（tab-switch, accordion, carousel） |
| **factor_jerkiness** | `excess = max(0, jerkiness - 0.3)`；`factor = max(0.3, 1 - excess * 1.5)` | 最低 0.3 | skeleton, page-transition |
| **factor_spring_pop** | `1.1` 当 `overshootAmount ∈ [0.05, 0.2]` 且 `settleTimeRatio < 0.35`；否则 `1.0` | 最高 1.1（奖励上限） | modal, toast, button-hover |

> **设计说明**：乘法结构保证各惩罚项独立、可解释，且无论组合多少惩罚，结果始终在 (0, 1] 内（clamp 后在 [0, 1]）。每个因子设有最低下限，防止单一极端值将整体分数清零。

**对 cubic-bezier**（无 settle 概念）：`factor_settle = 1.0`（不生效），`factor_spring_pop` 仅在 overshoot 范围内触发。

### 8.5 场景级权重

不同场景可配置不同权重：

| 场景类别 | W_curve | W_duration | W_stability | 理由 |
|---|---|---|---|---|
| 微交互（button-hover, tooltip） | 0.55 | 0.35 | 0.10 | 时长对体感影响大 |
| 进入/提示（list-loading, toast, modal） | 0.65 | 0.25 | 0.10 | 曲线语义是主要因素 |
| 切换/展开（tab-switch, accordion, carousel） | 0.60 | 0.25 | 0.15 | 稳定性更重要（禁 overshoot） |
| 持续过渡（skeleton, page-transition） | 0.60 | 0.30 | 0.10 | 时长偏重 |
| 面板滑出（drawer） | 0.60 | 0.30 | 0.10 | 时长与曲线并重 |

#### 8.5.1 敏感性分析与验证

上述权重为经验初始值，需通过以下方式验证其鲁棒性：

**扰动测试**：对每组权重分别施加 ±10% 扰动，统计校准集（§12.1）中等级跳变的比例。

```typescript
const perturbations = [-0.10, -0.05, +0.05, +0.10];
for (const delta of perturbations) {
  const tweakedWeights = { ...baseWeights, W_curve: baseWeights.W_curve + delta };
  // 归一化使总和 = 1
  normalize(tweakedWeights);
  const jumpRate = countLevelJumps(calibrationData, tweakedWeights) / calibrationData.length;
  // jumpRate > 15% 说明该权重是"主导因子"，需更谨慎设定
}
```

**关注指标**：
- **跳变率** > 15%：该权重为主导因子，微小变化会导致大量等级跳档，需缩小调整步长或通过校准数据固定。
- **跳变率** < 5%：该权重对结果不敏感，可适当简化。

> ⚠️ 当前权重为初始经验值，标注为 **"待通过校准数据集 + A/B 测试验证"**。正式上线前应至少完成一轮扰动测试。

## 9. 场景偏好量化参考表

以下为所有 11 个场景的推荐偏好参数：

| 场景 | velocityBias target | velocityBias σ | inOutBalance target | inOutBalance σ | linearness target | linearness σ | overshootMax | 理想时长(s) | 可接受时长(s) |
|---|---|---|---|---|---|---|---|---|---|
| **list-loading** | 0.70 | 0.15 | 0.3 | 0.25 | 0.3 | 0.3 | 0.15 | 0.2–0.6 | 0.1–1.0 |
| **drawer** | 0.65 | 0.20 | 0.4 | 0.25 | 0.3 | 0.3 | 0.12 | 0.2–0.5 | 0.1–0.8 |
| **skeleton** | 0.50 | 0.10 | 0.3 | 0.20 | 0.95 | 0.10 | 0 | 0.8–2.0 | 0.4–3.0 |
| **button-hover** | 0.70 | 0.15 | 0.2 | 0.25 | 0.3 | 0.3 | 0.10 | 0.1–0.3 | 0.05–0.5 |
| **modal** | 0.65 | 0.20 | 0.3 | 0.25 | 0.3 | 0.3 | 0.20 | 0.15–0.4 | 0.1–0.6 |
| **toast** | 0.70 | 0.15 | 0.2 | 0.25 | 0.3 | 0.3 | 0.10 | 0.2–0.5 | 0.1–0.8 |
| **tab-switch** | 0.55 | 0.15 | 0.7 | 0.20 | 0.3 | 0.3 | 0 | 0.15–0.35 | 0.1–0.5 |
| **accordion** | 0.55 | 0.15 | 0.7 | 0.20 | 0.3 | 0.3 | 0 | 0.2–0.4 | 0.1–0.6 |
| **page-transition** | 0.55 | 0.20 | 0.6 | 0.25 | 0.3 | 0.3 | 0.10 | 0.25–0.5 | 0.15–0.8 |
| **tooltip** | 0.70 | 0.15 | 0.2 | 0.25 | 0.3 | 0.3 | 0.08 | 0.1–0.25 | 0.05–0.4 |
| **carousel** | 0.55 | 0.15 | 0.6 | 0.20 | 0.3 | 0.3 | 0 | 0.25–0.5 | 0.15–0.8 |

> 说明：velocityBias target > 0.5 表示偏 ease-out；inOutBalance target > 0.5 表示偏 ease-in-out；linearness target > 0.5 表示偏线性。

### 9.1 参数来源与校准状态

上述参数的来源与置信度：

| 参数类别 | 来源 | 置信度 | 说明 |
|---|---|---|---|
| **时长区间** | Material Design 3 Motion、Apple HIG — Motion | 较高 | 参考主流设计系统的推荐时长 |
| **velocityBias / inOutBalance target** | 对 MD3 / Apple 标准曲线的逆向分析 | 中等 | 通过对推荐曲线采样计算得到，未经用户测试验证 |
| **sigma 值** | 经验估计 | 较低 | 控制容差宽度，需通过校准数据集（§12）迭代调整 |
| **overshootMax** | 经验估计 + 场景语义推理 | 较低 | 部分场景（如 skeleton = 0、modal = 0.20）基于交互常识 |

> ⚠️ 所有参数标注为 **"初始值，待校准"**。正式上线前应完成：
> 1. 使用校准曲线库（§12.1）验证参数合理性。
> 2. 对 sigma 和 overshootMax 进行敏感性扫描。
> 3. 如有条件，通过设计师评审或用户 A/B 测试获取反馈。

## 10. 评分等级与阈值

### 10.1 等级映射

| 等级 | 总分范围 | label | 含义 |
|---|---|---|---|
| **great** | ≥ 0.78 | "Great fit" | 曲线语义与时长节奏高度匹配 |
| **good** | 0.58 – 0.78 | "Good" | 可用，可微调优化 |
| **fair** | 0.38 – 0.58 | "Not ideal" | 有明显不匹配项 |
| **poor** | < 0.38 | "Poor fit" | 不建议使用，需调整 |

### 10.2 阈值选取依据

使用高斯评分函数后，分数分布更加平滑。阈值通过以下方式校准：

- 对标准经典曲线（`ease`, `ease-in`, `ease-out`, `ease-in-out`, `linear`）在各场景的评分分布，确保：
  - 最佳曲线 ≥ 0.78（great）
  - 错误曲线 < 0.38（poor）
  - 中间区间有合理区分度
- 通过参考曲线库（§12）进一步微调。

## 11. 专家提示文案策略

### 11.1 提示生成规则

提示应包含两部分：**判断原因** + **调整建议**。

| 等级 | 策略 | 示例 |
|---|---|---|
| **great** | 说明匹配点 | "Ease-out curve with good timing for staggered entrances" |
| **good** | 肯定 + 指出可优化维度 | "Works well — slightly faster duration (0.3s) would feel snappier" |
| **fair** | 指出主要问题 + 替代方向 | "Ease-in curve feels sluggish here; try ease-out for quicker response" |
| **poor** | 明确问题 + 给出参考值 | "Linear curve with overshoot is jarring for tab indicators; try ease-in-out at 0.2–0.3s" |

### 11.2 提示变量

提示文本可引用以下变量使建议更具体：

- `{sceneLabel}`：场景名称
- `{idealDuration}`：推荐时长范围
- `{suggestedCurveType}`：建议的曲线类型
- `{mainIssue}`：主要扣分项（duration / curve shape / overshoot / jerkiness）
- `{dampingRatio}`：spring 阻尼比（仅 spring 曲线）
- `{overshootAmount}`：当前超调幅度

### 11.3 提示模板库

为每个主要扣分项预定义模板，运行时根据最低子分项选取：

| 扣分项 | 模板（EN） | 模板（ZH） |
|---|---|---|
| **curve_shape** | "{suggestedCurveType} would better match {sceneLabel}" | "{sceneLabel} 更适合 {suggestedCurveType} 曲线" |
| **duration_short** | "Duration too short — try {idealDuration} for {sceneLabel}" | "时长偏短，{sceneLabel} 建议 {idealDuration}" |
| **duration_long** | "Duration too long — try {idealDuration} for {sceneLabel}" | "时长偏长，{sceneLabel} 建议 {idealDuration}" |
| **overshoot** | "Overshoot ({overshootAmount}) may feel jarring here" | "超调 ({overshootAmount}) 在此场景可能显得突兀" |
| **jerkiness** | "Curve has abrupt speed changes — try a smoother easing" | "曲线速度变化突兀，建议使用更平滑的缓动" |
| **spring_bounce** | "Underdamped spring (ζ={dampingRatio}) — increase damping or use ease-out" | "弹簧欠阻尼 (ζ={dampingRatio})，建议增大阻尼或换用 ease-out" |
| **spring_overdamped** | "Overdamped spring (ζ={dampingRatio}) feels sluggish — reduce damping" | "弹簧过阻尼 (ζ={dampingRatio}) 响应迟缓，建议减小阻尼" |

### 11.4 多语言支持

- 当前默认输出英文提示（与 UI label 一致）。
- 模板库按 `locale` 键索引，支持扩展中文等语言。
- 语言选择跟随应用全局 locale 设置，不需用户手动切换。

### 11.5 多问题优先级策略

当同时存在多个扣分项时，提示文案按以下优先级选取**最多 2 条**：

1. **overshoot**（场景禁止 overshoot 但曲线有超调）— 最高优先级
2. **curve_shape**（曲线类型与场景语义严重不匹配）
3. **spring_bounce / spring_overdamped**（spring 特有问题）
4. **duration_short / duration_long**（时长偏离）
5. **jerkiness**（速度突变）— 最低优先级

> 选取规则：取优先级最高的扣分项作为主提示，若第二高扣分项的子分 < 0.5 则追加为副提示。避免输出超过 2 条建议导致信息过载。

## 12. 校准与验证方法

### 12.1 参考曲线库

建立 `fixtures/scene-fitness-calibration.json`，格式：

```json
[
  {
    "scene": "list-loading",
    "curve": { "type": "cubic-bezier", "x1": 0, "y1": 0, "x2": 0.2, "y2": 1 },
    "duration": 0.4,
    "expectedLevel": "great",
    "source": "Material Design 3 — standard decelerate"
  },
  {
    "scene": "tab-switch",
    "curve": { "type": "spring", "mass": 1, "stiffness": 300, "damping": 20, "initialVelocity": 0 },
    "duration": null,
    "expectedLevel": "poor",
    "source": "Manual — bouncy spring causes overshoot on tab indicator"
  }
]
```

- 每个场景至少 10 条（涵盖 great / good / fair / poor 各等级）。
- 来源优先引用：**Material Design 3 Motion**、**Apple HIG — Motion**、**IBM Carbon Motion**。

### 12.2 自动化回归测试

在 `vitest` 中编写回归测试：

```typescript
import calibrationData from '../fixtures/scene-fitness-calibration.json';

describe('scene fitness calibration', () => {
  for (const entry of calibrationData) {
    it(`${entry.scene} — ${entry.source}`, () => {
      const result = getSceneFitness(entry.scene, entry.curve, entry.duration);
      expect(result.level).toBe(entry.expectedLevel);
    });
  }
});
```

### 12.3 评估指标

| 指标 | 定义 | 目标 |
|---|---|---|
| **精确一致率** | `预测等级 == 标签等级` 的比例 | ≥ 75% |
| **容差一致率** | 预测等级与标签差距 ≤ 1 档的比例 | ≥ 95% |
| **平均绝对误差** | 等级映射到 {3,2,1,0} 后计算 MAE | ≤ 0.4 |

## 13. 可视化调试（开发辅助）

为方便开发阶段调参与排查，建议在 UI 中提供以下调试视图（仅 dev 模式可见）：

### 13.1 CurveTraits 雷达图

将当前曲线的 CurveTraits 与场景偏好 target 叠加在同一雷达图上：

- **轴**：velocityBias、inOutBalance、linearness、overshootAmount（缩放到 0–1）、settleTimeRatio、peakVelocity（归一化）、jerkiness
- **两条线**：
  - 蓝色实线 = 当前曲线的实际 trait 值
  - 灰色虚线 = 场景偏好 target 值
  - 灰色填充区 = target ± sigma 的容差范围
- **用途**：一眼看出哪些维度偏离严重、哪些维度匹配良好。

### 13.2 分项评分条形图

水平条形图显示三个子分项：

```
curveFitScore    ████████░░  0.82
durationScore    ██████░░░░  0.61
stabilityScore   █████████░  0.93
─────────────────────────────
totalScore       ████████░░  0.79 → great
```

- 每条 bar 着色：≥ 0.78 绿色、0.58–0.78 黄色、0.38–0.58 橙色、< 0.38 红色。
- 点击 bar 展开详细因子（如 stabilityScore 展开为 factor_overshoot、factor_settle 等）。

### 13.3 曲线对比叠加

将当前曲线与该场景的"理想参考曲线"叠加在同一坐标系中：

- **坐标系**：x = t ∈ [0, 1]，y = progress ∈ [0, 1+overshoot]
- **当前曲线**：蓝色实线
- **参考曲线**：灰色虚线（取自校准库 §12.1 中该场景的 great 级曲线）
- **差异高亮**：两曲线间的面积用半透明红色填充，面积越大说明偏离越大。

### 13.4 调试输出接口

在 `getSceneFitness` 的返回值中增加可选 `debug` 字段：

```typescript
interface SceneFitnessDebug {
  traits: CurveTraits;
  scores: { curveFit: number; duration: number; stability: number; total: number };
  factors: { overshoot: number; settle: number; jerkiness: number; springPop: number };
  mainIssue: string;
  dampingRatio?: number;  // 仅 spring
}
```

通过 URL 参数 `?debug=fitness` 或 dev tools 开关启用。

## 14. 注意事项

- 适配度是"专家级匹配建议"，不是可用性判定。
- 所有曲线类型必须统一到 `CurveTraits` 后再评分，评分层不感知曲线来源。
- spring 曲线的 duration 有特殊语义（§6.2），评分前需确认是否为截断时长。
- custom 曲线需先做预处理（§6.4），避免噪声导致 jerkiness 假阳性。
- 新增场景（如 input-focus / drag / scroll）时，需同步补充：偏好参数行（§9）、时长区间、stabilityScore 规则（§8.4）。
- 所有经验参数（§9 偏好值、§8.5 权重）标注为"初始值，待校准"，需在校准通过后移除标注。
