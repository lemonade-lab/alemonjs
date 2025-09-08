import { PrimaryDiv } from './PrimaryDiv';
import { Button } from './Button';

export type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  if (!isOpen) return null;
  return (
    <div className='bg-black bg-opacity-50 fixed inset-0  w-screen top-0 left-1/2 z-50 transform -translate-x-1/2 flex justify-center items-center'>
      <PrimaryDiv className='rounded-lg p-6 relative w-1/3'>
        <Button className='absolute top-3 right-3 px-2 rounded-md' onClick={onClose}>
          &times;
        </Button>
        {children}
      </PrimaryDiv>
    </div>
  );
};
