import {
  CssBaseline,
  Description,
  GeistProvider,
  Radio,
  Select,
  Text,
  Textarea,
  Toggle,
  useToasts
} from '@geist-ui/core'
import { capitalize } from 'lodash-es'
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks'
import '../base.css'
import {
  getUserConfig,
  Language,
  Theme,
  TriggerMode,
  TRIGGER_MODE_TEXT,
  updateUserConfig,
  userConfigWithDefaultValue,
} from '../config'
import logo from '../logo.png'
import { detectSystemColorScheme, getExtensionVersion } from '../utils'
import ProviderSelect from './ProviderSelect'

function OptionsPage(props: { theme: Theme; onThemeChange: (theme: Theme) => void }) {
  const [triggerMode, setTriggerMode] = useState<TriggerMode>(TriggerMode.Always)
  const [language, setLanguage] = useState<Language>(Language.Auto)
  const [command, setCommand] = useState<string>(userConfigWithDefaultValue.command)
  const [searchPrompt, setSearchPrompt] = useState<string>(userConfigWithDefaultValue.searchPrompt)
  const [pageChatPrompt, setPageChatPrompt] = useState<string>(userConfigWithDefaultValue.pageChatPrompt)
  const { setToast } = useToasts()

  useEffect(() => {
    getUserConfig().then((config) => {
      setTriggerMode(config.triggerMode)
      setLanguage(config.language)
      setCommand(config.command)
      setSearchPrompt(config.searchPrompt)
      setPageChatPrompt(config.pageChatPrompt)
    })
  }, [])

  const onTriggerModeChange = useCallback(
    (mode: TriggerMode) => {
      setTriggerMode(mode)
      updateUserConfig({ triggerMode: mode })
      setToast({ text: 'Changes saved', type: 'success' })
    },
    [setToast],
  )

  const onThemeChange = useCallback(
    (theme: Theme) => {
      updateUserConfig({ theme })
      props.onThemeChange(theme)
      setToast({ text: 'Changes saved', type: 'success' })
    },
    [props, setToast],
  )

  const onLanguageChange = useCallback(
    (language: Language) => {
      updateUserConfig({ language })
      setToast({ text: 'Changes saved', type: 'success' })
    },
    [setToast],
  )

  return (
    <div className="container mx-auto">
      <nav className="flex flex-row justify-between items-center mt-5 px-2">
        <div className="flex flex-row items-center gap-2">
          <img src={logo} className="w-10 h-10 rounded-lg" />
          <span className="font-semibold">search with LLM (v{getExtensionVersion()})</span>
        </div>
        <div className="flex flex-row gap-3">
          <a
            href="https://github.com/fw6669998/search-with-LLM/issues"
            target="_blank"
            rel="noreferrer"
          >
             问题反馈
          </a>
          <a
            href="https://github.com/fw6669998/search-with-LLM"
            target="_blank"
            rel="noreferrer"
          >
             源码
          </a>
        </div>
      </nav>
      <main className="w-[500px] mx-auto mt-14">
        <Text h2>选项</Text>
        <Text h3 className="mt-5">
          触发模式
        </Text>
        <Radio.Group
          value={triggerMode}
          onChange={(val) => onTriggerModeChange(val as TriggerMode)}
        >
          {Object.entries(TRIGGER_MODE_TEXT).map(([value, texts]) => {
            return (
              <Radio key={value} value={value}>
                {texts.title}
                <Radio.Description>{texts.desc}</Radio.Description>
              </Radio>
            )
          })}
        </Radio.Group>
        <Text h3 className="mt-5">
          主题
        </Text>
        <Radio.Group value={props.theme} onChange={(val) => onThemeChange(val as Theme)} useRow>
          {Object.entries(Theme).map(([k, v]) => {
            return (
              <Radio key={v} value={v}>
                {k}
              </Radio>
            )
          })}
        </Radio.Group>
        {/*<Text h3 className="mt-5 mb-0">*/}
        {/*  Language*/}
        {/*</Text>*/}
        {/*<Text className="my-1">*/}
        {/*  生成答案中使用的语言*/}
        {/*</Text>*/}
        {/*<Select*/}
        {/*  value={language}*/}
        {/*  placeholder="Choose one"*/}
        {/*  onChange={(val) => onLanguageChange(val as Language)}*/}
        {/*>*/}
        {/*  {Object.entries(Language).map(([k, v]) => (*/}
        {/*    <Select.Option key={k} value={v}>*/}
        {/*      {capitalize(v)}*/}
        {/*    </Select.Option>*/}
        {/*  ))}*/}
        {/*</Select>*/}
        <Text h3 className="mt-5 mb-0">
          AI提供者
        </Text>
        <ProviderSelect />
        <Text h3 className="mt-8">
          清理会话
        </Text>
        <div className="flex flex-row items-center gap-4">
          <Toggle initialChecked disabled />
          <Text b margin={0}>
              自动删除搜索和网页对话生成的会话
          </Text>
        </div>
        <Text h3 className="mt-8">
          网页对话常用指令
        </Text>
          <Textarea style={{width: '500px',height: '60px'}}
                    placeholder={'输入指令,多条常用指令用;分割'}
                    value={command}
                    onChange={(e) => {
                        setCommand(e.target.value)
                        updateUserConfig({command: e.target.value})
                    }}
                    onBlur={() => {
                        setToast({text: 'Changes saved', type: 'success'})
                    }}
          />
          <Description title={'输入指令,多条常用指令用;分割'}></Description>

        <Text h3 className="mt-8">
          搜索提问提示词
        </Text>
        <Textarea style={{width: '500px',height: '100px'}}
                  placeholder={''}
                  value={searchPrompt}
                  onChange={(e) => {
                    setSearchPrompt(e.target.value)
                    updateUserConfig({searchPrompt: e.target.value})
                  }}
                  onBlur={() => {
                    setToast({text: 'Changes saved', type: 'success'})
                  }}
        />
        <Description title={'提问时使用的提示词。当提问时，你的查询会被放在 {{query}} 的位置。'}></Description>

        <Text h3 className="mt-8">
          网页对话提示词
        </Text>
        <Textarea style={{width: '500px',height: '100px'}}
                  placeholder={''}
                  value={pageChatPrompt}
                  onChange={(e) => {
                    setPageChatPrompt(e.target.value)
                    updateUserConfig({pageChatPrompt: e.target.value})
                  }}
                  onBlur={() => {
                      setToast({text: 'Changes saved', type: 'success'})
                  }}
        />
        <Description title={'网页对话时使用的提示词。当对话时，你的查询指令会被放在 {{query}} 的位置，网页内容会被放在 {{html}} 的位置。'}></Description>
      </main>
    </div>
  )
}

function App() {
  const [theme, setTheme] = useState(Theme.Auto)

  const themeType = useMemo(() => {
    if (theme === Theme.Auto) {
      return detectSystemColorScheme()
    }
    return theme
  }, [theme])

  useEffect(() => {
    getUserConfig().then((config) => setTheme(config.theme))
  }, [])

  return (
    <GeistProvider themeType={themeType}>
      <CssBaseline />
      <OptionsPage theme={theme} onThemeChange={setTheme} />
    </GeistProvider>
  )
}

export default App
