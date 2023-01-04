# TacSimulator-TS

本プロジェクトは, JavaScript製のTacSimulatorをTypeScriptで書き直し, TeC7dから追加されたMMUを実装することを目標とする.

### ビルド＆実行
```shell
git clone https://github.com/TacSimTeam/TacSimulator-TS.git
git checkout develop
npm ci  // 依存ツールを全てダウンロード
npm run compile  // ts->jsへのトランスパイル
npm start
```

### タスク
- [x] 8queenテストが動作する
- [x] SioEchoテストが動作する
- [x] MMUテストが動作する
- [x] 拡張基盤を必要とする箇所まで組み込み用TacOSが動作する
- [ ] CPUのテストを記述し動作確認する
- [x] コンソールのスイッチ、ランプが正しく動作する
- [x] 動作音が出る
