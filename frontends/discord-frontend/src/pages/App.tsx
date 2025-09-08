import { PrimaryDiv, SecondaryDiv } from '@alemonjs/react-ui';
import Form from '@/pages/From';
export default function App() {
  return (
    <SecondaryDiv className='flex items-center justify-center p-8'>
      <PrimaryDiv className='rounded-lg shadow-inner w-full p-8'>
        <div className='flex justify-center text-3xl'>Discord</div>
        <Form />
      </PrimaryDiv>
    </SecondaryDiv>
  );
}
