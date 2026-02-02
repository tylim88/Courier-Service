import { Container, Title } from '@mantine/core'
import { useXTerm, XTerm } from 'react-xtermjs'
import { useEffect, useRef } from 'react'
import { validations } from './validations'
import chalk from 'chalk'

function App() {
	const { instance, ref } = useXTerm()
	const step = useRef<1 | 2 | 3>(1)
	const packageId = useRef<number>(1)
	const numberOfPackages = useRef<number>(0)
	const inputBuffer = useRef<string>('')

	useEffect(() => {
		if (!instance) return
		instance.writeln(
			`Welcome, Employee K001\r\n\r\n${commands[step.current](packageId.current)}`,
		)
		instance.onData(data => {
			if (data.startsWith('\x1b[')) {
				return
			} else if (data.charCodeAt(0) === 127) {
				inputBuffer.current = inputBuffer.current.slice(0, -1)
				instance.write('\b \b')
			} else if (data === '\r') {
				const error = validations[step.current](inputBuffer.current, v => {
					numberOfPackages.current = Number(v)
				})
				inputBuffer.current = ''
				if (error) {
					instance.writeln(
						`${chalk.red(error)}\r
\r
${commands[step.current](packageId.current)}`,
					)
					return
				}
				if (step.current === 1) {
					step.current = 2
					instance.writeln(`\r
\r
${commands[step.current](packageId.current)}`)
					return
				}

				if (packageId < numberOfPackages) {
					packageId.current++
					instance.writeln(commands[step.current](packageId.current))
					return
				}

				step.current = 1
				packageId.current = 0
				numberOfPackages.current = 0
			} else {
				instance.write(data)
				inputBuffer.current += data
			}
		})
	}, [instance])

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
			<div ref={ref} style={{ width: '100%' }} />{' '}
		</Container>
	)
}

export default App

const commands = {
	1: () =>
		chalk.yellow(`1. Please enter the basic delivery cost and number of input separate by a space,\r
example: 100 3\r
where 100 is the basic delivery cost and 3 is the number of packages.\r
${chalk.green('input:')}`),
	2: (number: number) =>
		chalk.cyan(`2.${number} Please enter the weight, distance and offer code of package ${chalk.yellow(`ID ${number}`)} separated by a space\r
example: 5 15 OFR001\r
where 5 is weight(kg), 15 is distance(km) and OFR001 is an offer code (if available)\r
${chalk.green('input:')}`),
	3: () => 'Final Cost:\r\n',
}
