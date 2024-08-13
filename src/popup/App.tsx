import '../base.css'
import browser from "webextension-polyfill";
import {getUserConfig, Theme, TriggerMode} from "../config";
import ChatGPTContainer from "../content-script/ChatGPTContainer";
import {detectSystemColorScheme} from "../utils";
import {render} from "preact";
import {useState} from "react";
import {Button, Divider} from "@geist-ui/core";

// const isChrome = /chrome/i.test(navigator.userAgent)
function clickQuery(event: React.FormEvent<HTMLElement>) {
    let text = event.currentTarget.innerText
    query(text)
}

function inputQuery(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key == 'Enter') {
        let inputElement = event.currentTarget as HTMLInputElement
        query(inputElement.value)
    }
}

async function query(command: string) {
    // let prompt = "根据下列网页文本内容执行指令, 指令:" + command + ", 网页文本内容:\n"
    let userConfig =await getUserConfig();
    let chatPrompt=userConfig.pageChatPrompt
    console.log('prompt:', chatPrompt)
    browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
        const tabId = tabs[0].id;
        // 使用tabId获取当前网页的内容
        if (tabId) {
            browser.tabs.sendMessage(tabId, "GET_HTML").then(response => {
                console.log('内容：', response);
                // let show = document.getElementById('show');
                let container = document.getElementById('llm-summary')
                if (container) {
                    let prompt=chatPrompt.replace("{{query}}", command).replace("{{html}}", response)
                    render(
                        <ChatGPTContainer question={prompt}
                                          triggerMode={TriggerMode.Always}/>,
                        container
                    )
                }
            });
        }
    });
}

// function cmdButtons(cmdArr: string[]) {
//     return cmdArr.map(cmd => {
//         <button onClick={clickQuery}>{cmd}</button>
//     })
// }

function App() {
    const [cmdArr, setCmdArr] = useState<string[]>([]);
    // const container = document.createElement('div')
    // container.className = 'chat-gpt-container'
    getUserConfig().then(config => {
        if (config.command) {
            let cmd = config.command.replace("；", ";")
            let cmdArr = cmd.split(";")
            setCmdArr(cmdArr)
        }
    })
    let theme = detectSystemColorScheme()
    let themeClass = theme === Theme.Dark ? 'gpt-dark' : 'gpt-light'
    document.body.classList.add('search-with-llm-popup')

    return (
        <div id={'web-page-content-chat-j2jkw'}>
            <div className="title">
                <div>网页对话</div>
            </div>
            <div className="commands">
                <div className="command-buttons">
                    {cmdArr.map(cmd => (
                        <button
                            className={'cmd'}
                            onClick={clickQuery}
                            key={cmd}
                        >
                            {cmd}
                        </button>
                    ))}
                </div>
            </div>
            <div className="custom-command">
                <input
                    className={'cmd-input'}
                    id={'input-cmd'}
                    type="text"
                    placeholder={'输入网页对话指令'}
                    onKeyDown={inputQuery}
                />
            </div>
            <div id={'llm-summary'} className={'summary chat-gpt-container ' + themeClass}></div>
        </div>
    )
}

export default App
