import { tuple, enum as enum_ } from 'zod'
import { constructErrorString, positiveIntegerSchema } from './__utils'

export const validateStep1 = (
	value: string,
	callback: (costOfDelivery: number, numberOfPackages: number) => void,
) => {
	const inputs = value.trim().split(' ')
	const error = tuple([positiveIntegerSchema, positiveIntegerSchema]).safeParse(
		inputs,
	).error

	if (error) {
		return constructErrorString(error, [
			'cost of delivery',
			'number of packages',
		])
	} else {
		callback(Number(inputs[0]), Number(inputs[1]))
		return ''
	}
}
export const validateStep2 = (
	value: string,
	basicCost: number,
	id: number,
	callback: (
		costEstimation: Record<
			'weight' | 'distance' | 'costWithoutDiscount' | 'discount' | 'id',
			number
		>,
	) => void,
) => {
	const inputs = value.trim().split(' ')
	const error = tuple([
		positiveIntegerSchema,
		positiveIntegerSchema.max(17208, {
			error:
				'17208km is the longest straight line distance on earth between 2 points',
		}),
		enum_(Object.keys(offers) as [keyof typeof offers]).optional(),
	])
		.superRefine(([weight, distance, offer], ctx) => {
			const data = { weight, distance }
			;(Object.keys(data) as [keyof typeof data]).forEach(key => {
				const max = offer ? offers[offer][`${key}_max`] : Infinity

				if (data[key] > max) {
					ctx.addIssue({
						code: 'too_big',
						maximum: max,
						input: data[key],
						inclusive: true,
						origin: 'number',
						message: `expect the ${key} to be less than ${max}${units[key]}, but received ${data[key]}${units[key]}`,
					})
				}

				const min = offer ? offers[offer][`${key}_min`] : -Infinity
				if (data[key] < min) {
					ctx.addIssue({
						code: 'too_small',
						minimum: max,
						input: data[key],
						inclusive: true,
						origin: 'number',
						message: `expect the ${key} to be more than ${min}${units[key]}, but received ${data[key]}${units[key]}`,
					})
				}
			})
			const costWithoutDiscount = basicCost + weight * 10 + distance * 5
			const discount = offer ? offers[offer].discount : 0
			callback({ id, weight, distance, costWithoutDiscount, discount })
		})
		.safeParse(inputs).error

	return error
		? constructErrorString(error, ['weight', 'distance', 'offer'])
		: ''
}

export const validateStep3 = async (
	value: string,
	costEstimations: Record<
		'weight' | 'distance' | 'costWithoutDiscount' | 'discount' | 'id',
		number
	>[],
	callback: (deliveryEstimations: string) => void,
) => {
	const inputs = value.trim().split(' ')
	const { error, data } = tuple([
		positiveIntegerSchema,
		positiveIntegerSchema,
		positiveIntegerSchema,
	]).safeParse(inputs)

	if (error) {
		return constructErrorString(error, [
			'number of vehicle',
			'maximum speed',
			'maximum carriable weight',
		])
	}
	const [numberOfVehicle, maxSpeed, maxWeight] = data

	let filteredAndSortedByWeight = costEstimations.filter(
		({ weight }) => weight <= maxWeight,
	)

	const bestCombination = () => {
		let bestCombination: { weight: number; distance: number }[] = []
		let maxWeightReached = 0

		const findSubsets = (
			start: number,
			currentSubset: { weight: number; distance: number }[],
			currentWeight: number,
		) => {
			if (
				currentSubset.length > bestCombination.length ||
				(currentSubset.length === bestCombination.length &&
					currentWeight > maxWeightReached)
			) {
				bestCombination = [...currentSubset]
				maxWeightReached = currentWeight
			}

			for (let i = start; i < filteredAndSortedByWeight.length; i++) {
				if (currentWeight + filteredAndSortedByWeight[i].weight <= maxWeight) {
					currentSubset.push(filteredAndSortedByWeight[i])
					findSubsets(
						i + 1,
						currentSubset,
						currentWeight + filteredAndSortedByWeight[i].weight,
					)
					currentSubset.pop() // Backtrack
				}
			}
		}

		findSubsets(0, [], 0)
		return bestCombination
	}

	const vehicles = [...Array(numberOfVehicle)].map(() => ({
		consumedTime: 0,
		packages: [] as { output: string; id: number }[],
	}))

	while (filteredAndSortedByWeight.length) {
		vehicles
			.sort((a, b) => a.consumedTime - b.consumedTime)
			.forEach(vehicles => {
				const { maxSingleTripTime, processedId } =
					filteredAndSortedByWeight.reduce(
						(acc, { costWithoutDiscount, discount, distance, id, weight }) => {
							if (acc.totalWeight + weight <= maxWeight) {
								acc.totalWeight += weight
								acc.processedId[id] = true

								const singleTripTime = parseFloat(
									(Math.floor((distance / maxSpeed) * 100) / 100).toFixed(2),
								)

								acc.maxSingleTripTime = Math.max(
									acc.maxSingleTripTime,
									singleTripTime,
								)
								console.log(
									`PKG${id} ${parseFloat((costWithoutDiscount * discount).toFixed(2))} ${parseFloat((costWithoutDiscount * (1 - discount)).toFixed(2))} ${parseFloat((vehicles.consumedTime + singleTripTime).toFixed(2))}`,
								)
								vehicles.packages.push({
									id,
									output: `PKG${id} ${parseFloat((costWithoutDiscount * discount).toFixed(2))} ${parseFloat((costWithoutDiscount * (1 - discount)).toFixed(2))} ${parseFloat((vehicles.consumedTime + singleTripTime).toFixed(2))}`,
								})
							}
							return acc
						},
						{
							processedId: {} as Record<number, true>,
							totalWeight: 0,
							maxSingleTripTime: 0,
						},
					)
				vehicles.consumedTime += maxSingleTripTime * 2
				filteredAndSortedByWeight = filteredAndSortedByWeight.filter(
					({ id }) => !processedId[id],
				)
			})
		await new Promise(res => {
			// prevent while loop from exhausting cpu resource if something went wrong
			setTimeout(() => {
				res(1)
			}, 100)
		})
	}
	const output = vehicles
		.reduce(
			(acc, { packages }) => {
				return [...acc, ...packages]
			},
			[] as { output: string; id: number }[],
		)
		.sort((a, b) => {
			return a.id - b.id
		})
		.reduce(
			(acc, { output }) => `${acc}\r
${output}`,
			'',
		)
	callback(output)
}

const units = {
	distance: 'km',
	weight: 'kg',
}

const offers = {
	OFR001: {
		discount: 0.1,
		distance_min: 0,
		distance_max: 200,
		weight_min: 70,
		weight_max: 200,
	},
	OFR002: {
		discount: 0.07,
		distance_min: 50,
		distance_max: 150,
		weight_min: 100,
		weight_max: 250,
	},
	OFR003: {
		discount: 0.05,
		distance_min: 50,
		distance_max: 250,
		weight_min: 10,
		weight_max: 150,
	},
}
