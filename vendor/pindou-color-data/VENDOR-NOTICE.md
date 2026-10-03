# 关于这份内置色卡数据

本目录是 [HansBug/pindou-color-data](https://github.com/HansBug/pindou-color-data) 的部分副本，
锁定提交记录在同目录的 `VERSION` 文件里。

上游采用 MIT 许可，许可全文见同目录 `LICENSE`。

## 保留了哪些内容

- 各系列的 `colors.json`（本项目唯一消费的数据源）
- 各系列的 `README.md`（记录该系列的来源与异常色号说明）
- 根目录 `README.md`、`manifest.json`、`Mard-221-source-differences.json`
- `scripts/`（上游的数据生成脚本，保留以便追溯数据是怎么产出的）
- 上游 `LICENSE`

## 移除了哪些内容，以及为什么

| 移除项 | 原因 |
| --- | --- |
| 各系列的 `legend.pdf`（9 个，合计约 16 MB） | 仅作人工核对用途，会让仓库体积膨胀约 24 倍 |
| 各系列的 `colors.xlsx`（9 个） | 与 `colors.json` 数据重复 |
| `AGENTS.md`、`CLAUDE.md` | 是上游数据仓库自己给 AI 助手看的维护规则，留在本仓库会被误读为本项目的指令 |
| `.github/workflows/` | 上游数据仓库自己的 CI 配置。虽然嵌套在 `vendor/` 下的 workflow 不会被执行，但留在仓库里只会造成困惑 |

需要完整副本（含 PDF 图例与 Excel）时，请直接克隆上游仓库：

```bash
git clone https://github.com/HansBug/pindou-color-data.git
cd pindou-color-data && git checkout $(cat /path/to/VERSION)
```

## 数据口径提醒

- 上游 `README.md` 明确说明：这些色值是公开渠道整理与实测采样值，**不是品牌官方发布数据**。
- 屏幕 HEX 为近似值，受显示器、环境光、打印设备与生产批次影响。大批量采购前请核对实体色卡。
- 带 `unidentified: true` 的占位色号（如 `UNKNOWN-01`）表示上游无法确认真实品牌色号，本项目的量化流程会跳过它们，不把它们当作可选颜色。
