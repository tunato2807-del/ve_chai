export default function ActionFeedback({ state }) {
  return (
    <>
      {state.notice && (
        <p className="form-notice" role="status">
          {state.notice}
        </p>
      )}
      {state.error && (
        <div className="form-error" role="alert">
          <p>{state.error.message}</p>
          {(state.blocked || state.error.uncertain) && (
            <p>Thao tác đang được khóa. Tải lại dữ liệu để xác định kết quả trước khi tiếp tục.</p>
          )}
        </div>
      )}
    </>
  )
}
