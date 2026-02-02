import { useXTerm } from 'react-xtermjs'
import { useEffect, useRef } from 'react'
import {
	validateStep1,
	validateStep2,
	validateStep3,
} from './DeliveryEstimation.validations'
import chalk from 'chalk'
import { FitAddon } from '@xterm/addon-fit'

export const DeliveryEstimation = () => {
	const { instance, ref } = useXTerm()
	const fitAddonRef = useRef(new FitAddon())
	const step = useRef<1 | 2 | 3>(1)
	const packageId = useRef<number>(1)
	const numberOfPackages = useRef<number>(0)
	const costOfDelivery = useRef<number>(0)
	const costEstimations = useRef<
		Record<
			'weight' | 'distance' | 'costWithoutDiscount' | 'discount' | 'id',
			number
		>[]
	>([])
	const deliveryEstimations = useRef<string>('')
	const inputBuffer = useRef<string>('')

	useEffect(() => {
		if (!instance) return
		instance.loadAddon(fitAddonRef.current)
		setTimeout(() => fitAddonRef.current.fit(), 100)
		instance.writeln(
			`Welcome, Employee K001\r\n\r\n${commands[step.current](packageId.current)}`,
		)
		instance.onData(async data => {
			if (data.startsWith('\x1b[')) {
				return
			} else if (data.charCodeAt(0) === 127) {
				inputBuffer.current = inputBuffer.current.slice(0, -1)
				instance.write('\b \b')
			} else if (data === '\r') {
				const error = await {
					1: () =>
						validateStep1(inputBuffer.current, (cost, number) => {
							costOfDelivery.current = cost
							numberOfPackages.current = number
						}),
					2: () =>
						validateStep2(
							inputBuffer.current,
							costOfDelivery.current,
							packageId.current,
							costEstimation => {
								costEstimations.current = [
									...costEstimations.current,
									costEstimation,
								]
							},
						),
					3: () =>
						validateStep3(
							inputBuffer.current,
							costEstimations.current,
							deliveryEstimation => {
								deliveryEstimations.current = deliveryEstimation
							},
						),
				}[step.current]()
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
				if (step.current === 2) {
					if (packageId.current < numberOfPackages.current) {
						packageId.current++
						instance.writeln(
							`\r\n\r\n${commands[step.current](packageId.current)}`,
						)
						return
					} else if (packageId.current === numberOfPackages.current) {
						step.current = 3
						instance.writeln(`\r\n\r\n${commands[step.current]()}`)
						return
					}
				}
				if (step.current === 3) {
					const output = deliveryEstimations.current
					step.current = 1
					packageId.current = 1
					costOfDelivery.current = 0
					numberOfPackages.current = 0
					costEstimations.current = []
					deliveryEstimations.current = ''
					instance.writeln(`\r
\r
${chalk.greenBright(`Final Output:${output}\r`)}
\r
${commands[step.current]()}`)
				}
			} else {
				instance.write(data)
				inputBuffer.current += data
			}
		})
	}, [instance])

	return <div ref={ref} style={{ width: '100%' }} />
}

const commands = {
	1: () =>
		chalk.yellow(`1. Please enter the basic delivery cost and number of packages separate by a space,\r
example: 100 3\r
where 100 is the basic delivery cost and 3 is the number of packages.\r
${chalk.green('input: basicDeliveryCost numberOfPackages')}`),
	2: (number: number) =>
		chalk.cyan(`2.${number} Please enter the weight, distance and offer code of package ${chalk.yellow(`ID ${number}`)} separate by a space\r
example: 5 15 OFR001\r
where 5 is weight(kg), 15 is distance(km) and OFR001 is an offer code (if available)\r
${chalk.green('input:weight(kg) distance(km) offer(optional)')}`),
	3: () =>
		chalk.magentaBright(`1. Please enter the number of vehicles, maximum speed(km/h) and maximum carriable weight(kg) separate by a space,\r
example: 2 70 200\r
where 2 is the number of vehicles, 70 is the maximum speed(km/h) and 200 is the maximum carriable weight(kg).\r
${chalk.green('input: numberOfVehicles maximumSpeed maximumCarriableWeight')}`),
}
