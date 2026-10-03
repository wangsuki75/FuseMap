# FuseMap

把任意图片转换成可照着施工的拼豆图纸，并预览同一张图纸在不同熨烫工艺下的成品外观。

图片全程在浏览器本地处理，不上传服务器。

## 特性

- 图片转图纸，输出尺寸可调
- 六个品牌九个色板：MARD 221/291、优肯 C197/M221/418、COCO 291、漫漫 278、盼盼 289、咪小窝 290
- 逐色号勾选，支持保存自定义套装与导入色号清单
- 施工图导出 PNG / PDF，用量清单导出 CSV
- 烫制效果预览：熔合程度 × 单双面 × 12 种表面纹理

## 开发

```bash
npm install
npm run dev
```

## 色卡数据

色板由 `scripts/build-palettes.mjs` 从上游数据编译生成，产物提交进仓库以保证离线可用。

```bash
node scripts/build-palettes.mjs
```

重新编译前请更新 `vendor/pindou-color-data` 并同步 `NOTICE` 中的锁定提交号。

## 许可

AGPL-3.0。本项目的网络服务使用者有权获取完整源码，见页脚"获取源码"入口。

来源与致谢见 [NOTICE](./NOTICE)。
