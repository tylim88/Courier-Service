import { Container, Title, Tabs } from '@mantine/core'
import { CostEstimation, DeliveryEstimation } from './components'
import { useState } from 'react'

const urlParams = new URLSearchParams(window.location.search)
function App() {
	const [activeTab, setActiveTab] = useState<string | null>(
		urlParams.get('tab') || '1',
	)
	return (
		<Container
			h="100vh"
			display="flex"
			style={{
				justifyContent: 'center',
				alignItems: 'center',
				flexDirection: 'column',
			}}
		>
			<Title>Kiki Courier Service</Title>
			<Tabs
				variant="pills"
				value={activeTab}
				onChange={setActiveTab}
				keepMounted={false}
				w="100%"
			>
				<Tabs.List>
					<Tabs.Tab value="1">Problem 1</Tabs.Tab>
					<Tabs.Tab value="2">Problem 2</Tabs.Tab>
				</Tabs.List>
				<Tabs.Panel value="1">
					<CostEstimation />
				</Tabs.Panel>
				<Tabs.Panel value="2">
					<DeliveryEstimation />
				</Tabs.Panel>
			</Tabs>
		</Container>
	)
}

export default App
