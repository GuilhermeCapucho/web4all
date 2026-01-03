import type { ComponentProps } from 'react'
import { ActivityModal } from './ActivityModal'
import { ConfirmDeleteModal } from './ConfirmDeleteModal'
import { ToastStack, type Toast } from './ToastStack'

type DashboardModalsProps = {
  activityModal: ComponentProps<typeof ActivityModal>
  confirmDelete: ComponentProps<typeof ConfirmDeleteModal>
  toasts: Toast[]
}

export const DashboardModals = ({ activityModal, confirmDelete, toasts }: DashboardModalsProps) => {
  return (
    <>
      <ActivityModal {...activityModal} />
      <ConfirmDeleteModal {...confirmDelete} />
      <ToastStack toasts={toasts} />
    </>
  )
}
