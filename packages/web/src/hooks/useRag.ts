import { RetrieveResultItem } from '@aws-sdk/client-kendra';
import { Model, ShownMessage } from 'generative-ai-use-cases-jp';
import { ragPrompt } from '../prompts';
import useChat from './useChat';
import useChatApi from './useChatApi';
import useRagApi from './useRagApi';

const useRag = (id: string) => {
  const {
    messages,
    postChat,
    clear,
    loading,
    setLoading,
    updateSystemContext,
    popMessage,
    pushMessage,
    isEmpty,
  } = useChat(id);

  const { retrieve, query } = useRagApi();
  const { predict } = useChatApi();

  return {
    isEmpty,
    clear,
    loading,
    messages,
    postMessage: async (content: string, model: Model) => {
      // Kendra から Retrieve する際に、ローディング表示する
      setLoading(true);
      pushMessage('user', content);
      pushMessage('assistant', 'Kendra から参照ドキュメントを取得中...');

      const queryContent = await predict({
        model: model,
        messages: [
          {
            role: 'user',
            content: ragPrompt.generatePrompt({
              promptType: 'RETRIEVE',
              retrieveQueries: [content],
            }),
          },
        ],
      });

      // Kendra から 参考ドキュメントを Retrieve してシステムコンテキストとして設定する
      const retrieveItemsp = retrieve(queryContent);
      const queryItemsp = query(queryContent)
      const [retrieveItems, queryItems] = await Promise.all([retrieveItemsp, queryItemsp])
      console.log({
        retrieveResult: retrieveItems
      })
      console.log({
        queryResult: queryItems
      })
      const faqs: RetrieveResultItem[] = queryItems.data.ResultItems?.filter((item) => item.Type === 'QUESTION_ANSWER').map((item)=>{
        const res = {
          Content: item.DocumentExcerpt?.Text || "",
          Id: item.Id,
          DocumentId: item.DocumentId,
          DocumentTitle: item.DocumentTitle?.Text || "",
          DocumentURI: item.DocumentURI,
          DocumentAttributes: item.DocumentAttributes,
          ScoreAttributes: item.ScoreAttributes
        }
        console.log({
          faq:res
        })
        return res
      })||[];

      if ((retrieveItems.data.ResultItems ?? []).length === 0) {
        popMessage();
        pushMessage(
          'assistant',
          `参考ドキュメントが見つかりませんでした。次の対応を検討してください。
- Amazon Kendra の data source に対象のドキュメントが追加されているか確認する
- Amazon Kendra の data source が sync されているか確認する
- 入力の表現を変更する`
        );
        setLoading(false);
        return;
      }

      updateSystemContext(
        ragPrompt.generatePrompt({
          promptType: 'SYSTEM_CONTEXT',
          referenceItems: [...retrieveItems.data.ResultItems!, ...faqs!] ?? [],
        })
      );

      // ローディング表示を消してから通常のチャットの POST 処理を実行する
      popMessage();
      popMessage();
      postChat(
        content,
        false,
        model,
        (messages: ShownMessage[]) => {
          // 前処理：Few-shot で参考にされてしまうため、過去ログから footnote を削除
          return messages.map((message) => ({
            ...message,
            content: message.content.replace(/\[\^(\d+)\]:.*/g, ''),
          }));
        },
        (message: string) => {
          // 後処理：Footnote の付与
          const footnote = retrieveItems.data.ResultItems?.map((item, idx) => {
            // 参考にしたページ番号がある場合は、アンカーリンクとして設定する
            const _excerpt_page_number = item.DocumentAttributes?.find(
              (attr) => attr.Key === '_excerpt_page_number'
            )?.Value?.LongValue;
            return message.includes(`[^${idx}]`)
              ? `[^${idx}]: [${item.DocumentTitle}${
                  _excerpt_page_number ? `(${_excerpt_page_number} ページ)` : ''
                }](${item.DocumentURI}${
                  _excerpt_page_number ? `#page=${_excerpt_page_number}` : ''
                })`
              : '';
          })
            .filter((x) => x)
            .join('\n');
          return message + '\n' + footnote;
        }
      );
    },
  };
};

export default useRag;