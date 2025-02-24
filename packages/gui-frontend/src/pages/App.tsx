import From from './From'
import { PrimaryDiv, SecondaryDiv } from '@alemonjs/react-ui'
export default function App() {
  return (
    <SecondaryDiv className="flex items-center justify-center p-8">
      <PrimaryDiv className="rounded-lg shadow-inner w-full p-8">
        <From />
      </PrimaryDiv>
    </SecondaryDiv>
  )
}
