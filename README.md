# TacSimulator-TS

本プロジェクトは, JavaScript製のTacSimulatorをTypeScriptで書き直し, TeC7dから追加されたMMUを実装することを目標とする.

### 開発準備
```shell
git clone https://github.com/TacSimTeam/TacSimulator-TS.git
git checkout develop
npm ci  // 依存ツールを全てダウンロード
```

### コンパイル・実行
```shell
npm run compile  // ts->jsへのトランスパイル
npm start
```

### 開発者モードをONにしてコンパイル・実行
```shell
npm run dev
```

### 実行バイナリ作成(Windows)
```shell
npm run build:win // TacSimulatorディレクトリにmsiファイルが生成される
```

### 実行バイナリ作成(MacOS)
```shell
npm run build:mac
```

### タスク
- [x] 8queenテストが動作する
- [x] SioEchoテストが動作する
- [x] MMUテストが動作する
- [x] 拡張基盤を必要とする箇所まで組み込み用TacOSが動作する
- [x] コンソールのスイッチ、ランプが正しく動作する
- [x] 動作音が出る
- [x] TaCシミュレータのWebアプリ化
- [x] 仮想記憶に対応したTacOSが動く(2023-01-13現在)
