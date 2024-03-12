import { RetrieveResultItem } from '@aws-sdk/client-kendra';
import { ShownMessage } from 'generative-ai-use-cases-jp';
import { useMemo } from 'react';
import { getPrompter } from '../prompts';
import useChat from './useChat';
import useChatApi from './useChatApi';
import { findModelByModelId } from './useModel';
import useRagApi from './useRagApi';

const useRag = (id: string) => {
  const {
    getModelId,
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
  
  const modelId = getModelId();
  const { retrieve, query } = useRagApi();
  const { predict } = useChatApi();
  const prompter = useMemo(() => {
    return getPrompter(modelId);
  }, [modelId]);

  return {
    isEmpty,
    clear,
    loading,
    messages,
    postMessage: async (content: string) => {
      const DOCUMENTS_COUNT = 3
      const model = findModelByModelId(modelId);

      if (!model) {
        console.error(`model not found for ${modelId}`);
        return;
      }

      // Kendra から Retrieve する際に、ローディング表示する
      setLoading(true);
      pushMessage('user', content);
      pushMessage('assistant', 'Kendra から参照ドキュメントを取得中...');

      const queryContent = await predict({
        model: model,
        messages: [
          {
            role: 'user',
            content: prompter.ragPrompt({
              promptType: 'RETRIEVE',
              retrieveQueries: [content],
            }),
          },
        ],
      });

      // Kendra から 参考ドキュメントを Retrieve してシステムコンテキストとして設定する
      const retrieveItemsp = retrieve(queryContent);
      const queryItemsp = query(queryContent);
      const [retrieveItems, queryItems] = await Promise.all([retrieveItemsp, queryItemsp])
      console.log({
        retrieveResult: retrieveItems
      })
      console.log({
        queryResult: queryItems
      })
      const faqs: RetrieveResultItem[] = queryItems.data.ResultItems?.filter((item) => item.Type === 'QUESTION_ANSWER').map((item)=>{
        const question = item.AdditionalAttributes?.find(
          (a) => a.Key === 'QuestionText'
        )?.Value?.TextWithHighlightsValue?.Text
        const answer = item.AdditionalAttributes?.find(
          (a) => a.Key === 'AnswerText'
        )?.Value?.TextWithHighlightsValue?.Text
        const content = `Q: ${question}\n A: ${answer}`
        const res = {
          Content: question&&answer?content:item.DocumentExcerpt?.Text||"",
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

      const retrieveResultItems = retrieveItems.data.ResultItems.slice(0, DOCUMENTS_COUNT)??[]
      const contextItems = faqs.length?faqs:(retrieveResultItems.length?retrieveResultItems:[])
      const footnoteItems = faqs.length ? []: retrieveResultItems

      if (contextItems.length === 0){
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
        prompter.ragPrompt({
          promptType: 'SYSTEM_CONTEXT',
          referenceItems: contextItems,
        })
      );

      // ローディング表示を消してから通常のチャットの POST 処理を実行する
      popMessage();
      popMessage();
      postChat(
        content,
        false,
        (messages: ShownMessage[]) => {
          // 前処理：Few-shot で参考にされてしまうため、過去ログから footnote を削除
          return messages.map((message) => ({
            ...message,
            content: message.content.replace(/\[\^(\d+)\]:.*/g, ''),
          }));
        },
        (message: string) => {
          // 後処理：Footnote の付与
          const footnote = footnoteItems?.map((item, idx) => {
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