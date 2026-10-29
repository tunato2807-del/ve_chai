import useUnsavedChanges from '../navigation/useUnsavedChanges'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { requiredText } from '../../lib/validation'
import { canDispute } from './order-action-model'
import { evidenceUrl } from './schemas'
import { getWeighings } from '../orders/weighing-api'
import { openDispute } from './order-actions-api'
import useCustomerFeed from './useCustomerFeed'
import useCustomerAction from './useCustomerAction'
import ActionFeedback from '../../components/ActionFeedback'
import InputField from '../../components/InputField'
import AsyncState from '../../components/AsyncState'
import DisputeHistory from './DisputeHistory'

const schema = z.object({ reason: requiredText(1000), evidenceUrl: z.string() })
export default function OrderDisputes({ order }) {
  const feed = useCustomerFeed('disputes', order),
    [open, setOpen] = useState(false)
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { reason: '', evidenceUrl: '' },
  })

  const protection = useUnsavedChanges(open && form.formState.isDirty, 'Khiếu nại của khách hàng')
  const weights = useQuery({
    queryKey: [...feed.scope, 'customer-weighings', String(order.id), order.version],
    queryFn: ({ signal }) => getWeighings(order, { signal, role: 'CUSTOMER' }),
    enabled: open,
    retry: false,
    staleTime: 0,
  })
  const state = useCustomerAction(async () => {
    await feed.refresh()
    setOpen(false)
    form.reset()
  })
  const images = [
    ...new Set(
      [
        ...order.items.map((row) => row.photoUrl),
        ...(weights.data?.records || []).map((row) => row.photoUrl),
      ].filter((url) => evidenceUrl.safeParse(url).success),
    ),
  ]
  function submit() {
    void state.run(
      () => openDispute(order, form.getValues(), images, feed.user.id),
      async (result) => {
        setOpen(false)
        form.reset()
        await feed.commit(result)
      },
      'Đã gửi khiếu nại. Admin sẽ tiếp nhận và lưu kết luận tại đây.',
    )
  }
  return (
    <section className="workspace-panel customer-section" aria-labelledby="disputes-title">
      <header className="panel-heading">
        <h2 id="disputes-title">Hỗ trợ và khiếu nại</h2>
        <button
          className="text-button"
          type="button"
          disabled={state.busy || feed.query.isFetching}
          onClick={() => protection.confirmDiscard(() => void state.refresh())}
        >
          Tải lại khiếu nại
        </button>
      </header>
      <p className="customer-description">
        Mô tả vấn đề để admin xem xét. Khiếu nại không tự hoàn tiền hoặc thay đổi khoản đã thanh
        toán.
      </p>
      <ActionFeedback state={state} />
      {feed.query.isPending ? (
        <AsyncState title="Đang tải khiếu nại" busy />
      ) : feed.query.isError ? (
        <AsyncState
          title="Chưa tải được khiếu nại"
          message={feed.query.error.message}
          retry={state.refresh}
        />
      ) : (
        <>
          {canDispute(order) && !open && (
            <button
              className="button button-secondary"
              type="button"
              disabled={state.busy || state.blocked}
              onClick={() => setOpen(true)}
            >
              Gửi khiếu nại
            </button>
          )}
          {order.status === 'DISPUTED' && (
            <p className="form-notice">
              Đơn đang có khiếu nại. Bạn có thể theo dõi phản hồi trong lịch sử bên dưới.
            </p>
          )}
          {open && (
            <div className="customer-confirm">
              <h3>Nội dung cần hỗ trợ</h3>
              <p>Gửi yêu cầu sẽ chuyển đơn sang “Đang có khiếu nại” để admin xử lý.</p>
              {weights.isError && (
                <p className="field-hint">
                  Chưa tải được ảnh phiếu cân. Bạn có thể gửi không kèm ảnh, hoặc{' '}
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => void weights.refetch()}
                  >
                    thử tải ảnh phiếu cân lại
                  </button>
                  .
                </p>
              )}
              <form onSubmit={form.handleSubmit(submit)} noValidate aria-label="Gửi khiếu nại">
                <fieldset className="form-fields" disabled={state.busy || state.blocked}>
                  <legend className="sr-only">Lý do và ảnh đã lưu</legend>
                  <InputField
                    id="dispute-reason"
                    label="Mô tả vấn đề"
                    as="textarea"
                    rows={4}
                    maxLength={1000}
                    required
                    error={form.formState.errors.reason}
                    {...form.register('reason')}
                  />
                  <InputField
                    id="dispute-evidence"
                    label="Ảnh minh chứng đã lưu (không bắt buộc)"
                    as="select"
                    {...form.register('evidenceUrl')}
                  >
                    <option value="">Không kèm ảnh</option>
                    {images.map((url, index) => (
                      <option key={url} value={url}>
                        Ảnh minh chứng {index + 1} của đơn
                      </option>
                    ))}
                  </InputField>
                  <div className="customer-actions">
                    <button className="button button-primary" type="submit">
                      {state.busy ? 'Đang gửi…' : 'Xác nhận gửi khiếu nại'}
                    </button>
                    <button
                      className="text-button"
                      type="button"
                      onClick={() =>
                        protection.confirmDiscard(() => {
                          form.reset()
                          setOpen(false)
                        })
                      }
                    >
                      Đóng biểu mẫu
                    </button>
                  </div>
                </fieldset>
              </form>
            </div>
          )}
          <DisputeHistory feed={feed} busy={state.busy} />
        </>
      )}
    </section>
  )
}
