import { PrimaryDiv, SecondaryDiv } from '@alemonjs/react-ui'
import Table from './Table'
export default function App() {
  return (
    <SecondaryDiv className="flex items-center justify-center p-8">
      <PrimaryDiv className="rounded-lg shadow-inner w-full">
        <Table />
      </PrimaryDiv>
    </SecondaryDiv>
  )
}
