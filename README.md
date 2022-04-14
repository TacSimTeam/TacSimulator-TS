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
  コードフォーマッター. コードスタイルの一貫性を保つのに使用する.  
- [Jest](https://jestjs.io/ja/)  
  JavaScript向けのテスティングフレームワーク. 本プロジェクトでは主に単体テストで用いる.  

### タスク
- [ ] 過去のTacSimulatorのプログラムを移植する
- [ ] MMUを追加する