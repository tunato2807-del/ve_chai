import useAuthenticatedAction from '../auth/useAuthenticatedAction'

export default function useCustomerAction(readback) {
  return useAuthenticatedAction(readback, 'CUSTOMER')
}
