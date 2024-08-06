import ExpiryMap from 'expiry-map'
import {v4 as uuidv4} from 'uuid'
import {fetchSSE} from '../fetch-sse'
import {GenerateAnswerParams, Provider} from '../types'
import {cookies} from "webextension-polyfill";

async function request(token: string, method: string, path: string, data?: unknown) {
    return fetch(`https://chat.openai.com/backend-api${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: data === undefined ? undefined : JSON.stringify(data),
    })
}

export async function setConversationProperty(
    token: string,
    conversationId: string,
    propertyObject: object,
) {
    await request(token, 'PATCH', `/conversation/${conversationId}`, propertyObject)
}

export async function getAccessToken(): Promise<string> {
    let authInfo = await cookies.get({url: 'https://chatglm.cn/', name: 'chatglm_token'});
    return authInfo.value;
}


export class ChatGLMProvider implements Provider {

    constructor() {

    }

    async generateAnswer(params: GenerateAnswerParams) {
        let token = await getAccessToken()
        let conversationId: string | undefined

        const cleanup = () => {
            if (conversationId) {   //清理会话
                setConversationProperty(token, conversationId, {is_visible: false})
            }
        }

        await fetchSSE('https://chatglm.cn/chatglm/backend-api/assistant/stream', {
            method: 'POST',
            signal: params.signal,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                "assistant_id": "65940acff94777010aa6b796",
                "conversation_id": "",
                "meta_data": {
                    "mention_conversation_id": "",
                    "is_test": false,
                    "input_question_type": "xxxx",
                    "channel": "",
                    "draft_id": "",
                    "quote_log_id": ""
                },
                "messages": [{"role": "user", "content": [{"type": "text", "text": "请用中文回答下列问题: "+params.prompt}]}]
            }),
            onMessage(message: string) {
                let data
                try {
                    data = JSON.parse(message)
                } catch (err) {
                    console.error(err)
                    return
                }
                const text = data.parts?.[0]?.content?.[0]?.text
                console.log(text);
                if (text) {
                    conversationId = data.conversation_id
                    params.onEvent({
                        type: 'answer',
                        data: {
                            text,
                            messageId: data.id,
                            conversationId: data.conversation_id,
                        },
                    })
                }
            },
        })
        return {cleanup}
    }
}
