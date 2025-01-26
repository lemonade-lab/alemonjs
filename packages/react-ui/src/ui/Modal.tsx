import { PrimaryDiv } from './PrimaryDiv'
import { Button } from './Button'
export const Modal = ({
  isOpen,
  onClose,
  children
}: {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <PrimaryDiv className="rounded-lg p-6 relative w-1/3">
        <Button className="absolute top-3 right-3 px-2 rounded-md" onClick={onClose}>
          &times;
        </Button>
        {children}
      </PrimaryDiv>
    </div>
  )
}
