import { Container } from '@mantine/core'
import { CostEstimation } from './components'

function App() {
	return (
		<Container
			p="xl"
			h="100vh"
			display="flex"
			style={{
				justifyContent: 'center',
				alignItems: 'center',
				flexDirection: 'column',
			}}
		>
			<CostEstimation />
		</Container>
	)
}

export default App
