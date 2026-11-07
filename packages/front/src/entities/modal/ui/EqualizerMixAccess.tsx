import { commonTypes, equalizer } from '@vk-audiopad/common'
import { Icon24LockOutline, Icon56LogoVk } from '@vkontakte/icons'
import { Button, ButtonGroup, Footnote, Text, ModalCard, useModalManager, type CustomModalProps, type OpenModalCardProps } from '@vkontakte/vkui'
import { useCallback, useEffect, useRef, useState } from 'react'
import { equalizerSettingsAtom } from '../model/equalizer'

const access = { origins: ['https://*.okcdn.ru/*'] }
const rememberDecision = (mixAccessDenied: boolean): void => {
  equalizerSettingsAtom.set({ ...equalizer.normalize(equalizerSettingsAtom.get()), mixAccessDenied })
}
interface Props {
  enabled: boolean
  requestVersion: number
  denied: boolean
  onDialogChange?: (open: boolean) => void
}

export const EqualizerMixAccess = ({ enabled, requestVersion, denied, onDialogChange }: Props) => {
  const [allowed, setAllowed] = useState(true)
  const [api, holder] = useModalManager({ saveHistory: false })
  const dialog = useRef<ReturnType<typeof api.openModalCard> | null>(null)

  const show = useCallback((): void => {
    if (dialog.current != null) return
    onDialogChange?.(true)
    const opened = api.openCustomModalCard({ component: MixAccessDialog, additionalProps: { onGranted: () => { setAllowed(true) } } })
    dialog.current = opened
    void opened.onClose(() => { dialog.current = null; onDialogChange?.(false) })
  }, [api, onDialogChange])

  useEffect(() => {
    let active = true
    const check = (): void => {
      void chrome.permissions.contains(access).then(granted => { if (active) setAllowed(granted) }).catch(() => {})
    }
    check()
    chrome.permissions.onAdded?.addListener(check)
    chrome.permissions.onRemoved?.addListener(check)
    return () => {
      active = false
      chrome.permissions.onAdded?.removeListener(check)
      chrome.permissions.onRemoved?.removeListener(check)
      onDialogChange?.(false)
    }
  }, [onDialogChange])

  useEffect(() => {
    if (!enabled) { dialog.current?.close(); return }
    if (requestVersion === 0 || denied) return
    let active = true
    void chrome.permissions.contains(access).then(granted => { if (active && !granted) show() }).catch(() => {})
    return () => { active = false }
  }, [enabled, requestVersion, denied, show])

  return (
    <>
      {enabled && !allowed && (
        <div className='vkap_equalizer_mix_access' role='note' aria-label='Ограничение эквалайзера в VK Mix'>
          <Icon24LockOutline className='vkap_equalizer_mix_access_icon' />
          <div>
            <Text weight='2'>VK Mix пока без эквалайзера</Text>
            <Footnote>Нужен доступ к аудиосерверу okcdn.ru</Footnote>
          </div>
          <Button size='s' onClick={show}>Выдать доступ</Button>
        </div>
      )}
      {holder}
    </>
  )
}

const MixAccessDialog = ({ modalProps, close, onGranted }: CustomModalProps<OpenModalCardProps, { onGranted: () => void }>) => {
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)
  const busy = useRef(false)
  const dismiss = (): void => { rememberDecision(true); close() }
  const request = async (): Promise<void> => {
    if (busy.current) return
    busy.current = true
    setPending(true)
    setFailed(false)
    try {
      if (await chrome.permissions.request(access)) {
        rememberDecision(false)
        onGranted()
        await chrome.runtime.sendMessage({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.RETRY_EQUALIZER })
        close()
      } else dismiss()
    } catch {
      setFailed(true)
    } finally {
      busy.current = false
      setPending(false)
    }
  }

  return (
    <ModalCard
      {...modalProps}
      title='Эквалайзер для VK Mix'
      icon={<Icon56LogoVk />}
      description='VK Mix загружает музыку с okcdn.ru. Доступ к этому аудиосерверу нужен, чтобы загрузить звук и применить эквалайзер. Без разрешения VK Mix продолжит играть без обработки, а эквалайзер для остальных источников останется доступен'
      onClose={dismiss}
      preventClose={pending}
      actions={
        <ButtonGroup mode='vertical' gap='m' stretched>
          <Button size='l' stretched loading={pending} onClick={() => { void request() }}>Разрешить</Button>
          <Button size='l' stretched mode='secondary' disabled={pending} onClick={dismiss}>Не сейчас</Button>
        </ButtonGroup>
      }
    >
      {failed && <Footnote role='status'>Не удалось запросить доступ или включить обработку. Повторите попытку</Footnote>}
    </ModalCard>
  )
}
