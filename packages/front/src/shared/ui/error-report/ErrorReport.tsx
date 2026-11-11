import { FormItem, Textarea } from '@vkontakte/vkui'
import { type FC } from 'react'
import { createErrorReport } from '../../lib/error-report'

export const ErrorReport: FC<{ error: unknown }> = ({ error }) => (
  <details>
    <summary>Информация об ошибке</summary>
    <FormItem top='Скопируйте информацию об ошибке' topComponent='h5'>
      <Textarea slotProps={{ textArea: { 'aria-label': 'Информация об ошибке' } }} grow={false} rows={8} readOnly value={JSON.stringify(createErrorReport(error), null, 2)} />
    </FormItem>
  </details>
)
