# TacSimulator-TS

本プロジェクトは, JavaScript製のTacSimulatorをTypeScriptで書き直し, TeC7dから追加されたMMUを実装することを目標とする.

### 導入ツール
- [TypeScript](https://www.typescriptlang.org/)  
  本プロジェクトに使用した言語. JavaScriptに型を追加しているので, 実行前にエラーの存在を気付きやすくなる.
- [Electron](https://www.electronjs.org/)  
  本プロジェクトに使用したフレームワーク. ChromiumとNode.jsをバイナリに組み込むことで, Web開発と同じ感覚でWindows, macOS, Linuxで動作するクロスプラットフォームアプリを作成することができる.  
- [ESlint](https://eslint.org/)  
  JavaScript向けの静的解析ツール. TypeScriptにも対応している.  
- [Prettier](https://prettier.io/)  
  コードフォーマッター. コードスタイルの一貫性を保つのに用いる.  
- [Jest](https://jestjs.io/ja/)  
  JavaScript向けのテスティングフレームワーク. 本プロジェクトでは主に単体テストで用いる.  
- [webpack](https://webpack.js.org/)  
  静的ファイルを1つにまとめるツール. レンダラープロセス用のJavaScriptコードをまとめるのに用いる.

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
- [ ] MMUテストが動作する
- [x] 拡張基盤を必要とする箇所まで組み込み用TacOSが動作する
- [ ] CPUのテストを記述し動作確認する
- [ ] コンソールのスイッチ、ランプが正しく動作する
- [x] 動作音が出る
- [ ] TLBの数変更とヒット率の検査機能
