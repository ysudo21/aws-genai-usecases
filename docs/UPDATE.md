# アップデート方法

このアプリケーションには頻繁にアップデートが入ります。
機能追加・改善に加え、セキュリティ文脈のアップデートが入ることもありますので、定期的にリポジトリの main ブランチを pull して再デプロイすることをお勧めします。

## main ブランチを pull する

すでにリポジトリを clone 済みで、初回デプロイが完了していることを想定しています。
main ブランチの内容を pull するには以下のコマンドを実行します。

```bash
git pull
```

別のリポジトリでカスタマイズしている場合は、remote が別名で登録されている可能性があります。
remote は以下のコマンドで調べることが可能です。

```bash
git remote -v
```

以下の出力例の場合、aws-samples という Organization で管理されているリポジトリ (本家のリポジトリ) が aws という名前で登録されています。

```
origin  https://my-private-git-hosting-site.com/myawesomeorg/generative-ai-use-cases-jp (fetch)
origin  https://my-private-git-hosting-site.com/myawesomeorg/generative-ai-use-cases-jp (push)
aws     https://github.com/aws-samples/generative-ai-use-cases-jp (fetch)
aws     https://github.com/aws-samples/generative-ai-use-cases-jp (push)
```

この場合は、aws を明示的に指定して pull を実施します。

```bash
git pull aws
```

`git remote -v` の結果、aws-samples で管理されているリポジトリがない場合は、以下のコマンドで追加します。

```bash
git remote add aws https://github.com/aws-samples/generative-ai-use-cases-jp
```

aws という名前で登録されたので、`git pull aws` を実行して pull を実施します。

## 取り込む前に変更が見たい場合

`git pull` コマンドは `git fetch` (変更を取得) と `git merge` (変更を取り込む) を同時に行います。
変更点を確認してから取り込みたい場合は、`fetch` と `merge` を別々に実行してください。
以下のコマンドでは、[aws-samples/generative-ai-use-cases-jp](https://github.com/aws-samples/generative-ai-use-cases-jp) が origin という名前で remote に登録されているとして記述します。
remote 名を調べる場合は、前述した `git remote -v` コマンドを実行してください。

まずは以下のコマンドで変更を取得します。

```bash
git fetch origin
```

続いて、手元のコードと origin/main の違いを確認します。

```bash
git diff origin/main
```

問題なければ、マージを実行します。

```bash
git merge origin/main
```

## コンフリクトが発生した場合

`git pull` 時にコンフリクトが発生した場合、カスタマイズしたコードと、本家の変更が同時に同じファイルに対して行われてしまっています。
コンフリクトが入ったコードは手動で修正する必要があります。

特に [cdk.json](/packages/cdk/cdk.json) のコンフリクトには注意が必要です。
**手元で設定した項目が消えていないか、`git pull` 後に必ず確認してください。**

## 再デプロイする

基本的には [README.md](/README.md) の手順に従いますが、Bootstrap は必要ありません。
パッケージがアップデートされている可能性があるため、`npm ci` コマンドは実行してください。

```bash
npm ci
npm run cdk:deploy
```
