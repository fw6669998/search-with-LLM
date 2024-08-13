import ExpiryMap from 'expiry-map'
import {v4 as uuidv4} from 'uuid'
import {fetchSSE} from '../fetch-sse'
import {GenerateAnswerParams, Provider} from '../types'
import Browser, {cookies} from "webextension-polyfill";
import {getUserConfig} from "../../config";

async function request(token: string, method: string, path: string, data?: unknown) {
    // return fetch(`https://chat.openai.com/backend-api${path}`, {
    return fetch(`https://chatglm.cn/chatglm/backend-api${path}`, {
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
    await request(token, 'PATCH', `/assistant/conversation/${conversationId}`, propertyObject)
}

export async function deleteConversation(
    token: string,
    conversationId: string,
) {
    console.log('delete',token,conversationId)
    await request(token, 'POST', `/assistant/conversation/delete`,
        {conversation_id: conversationId, assistant_id: "65940acff94777010aa6b796"})
}

export async function getAccessToken(): Promise<string> {
    let authInfo = await cookies.get({url: 'https://chatglm.cn/', name: 'chatglm_token'});
    return authInfo.value;
}


export class ChatGLMProvider implements Provider {

    constructor() {

    }

    clearLastConversation(token: string, conversationId: string | undefined) {
        console.log("clearLastConversation", conversationId)
        // if (conversationId) {
        //     deleteConversation(token, conversationId)
        // }
        // 在下次对话时，删除前一次会话
        Browser.storage.local.get("lastConversationId").then((result) => {
            if (result.lastConversationId) {
                console.log("clearLastConversation2", conversationId)
                deleteConversation(token, result.lastConversationId)
            }
        })
        Browser.storage.local.set({lastConversationId: conversationId})
    }

    async generateAnswer(params: GenerateAnswerParams) {
        let token = await getAccessToken()
        let conversationId: string | undefined

        const cleanup = () => {
            console.log("cleanup")
            // this.clearLastConversation(token, conversationId)
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
                "messages": [{"role": "user", "content": [{"type": "text", "text": params.prompt}]}]
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
                // console.log(text);
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
